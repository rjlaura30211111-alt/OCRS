import { getSupabaseAdmin } from "@/lib/supabase/server";

export const BACKUP_VERSION = 1;

export type DatabaseBackupPayload = {
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  counts: {
    documents: number;
    documentRoutingLogs: number;
    archivedDocuments: number;
    archivedDocumentRoutingLogs: number;
    deletionRequests: number;
  };
  documents: Record<string, unknown>[];
  documentRoutingLogs: Record<string, unknown>[];
  archivedDocuments: Record<string, unknown>[];
  archivedDocumentRoutingLogs: Record<string, unknown>[];
  deletionRequests: Record<string, unknown>[];
};

export type BackupPreview = DatabaseBackupPayload["counts"] & {
  exportedAt: string | null;
  version: number | null;
};

async function fetchAllRows(table: string): Promise<Record<string, unknown>[]> {
  const supabase = getSupabaseAdmin();
  const pageSize = 1000;
  const rows: Record<string, unknown>[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(error.message);
    }

    const batch = (data ?? []) as Record<string, unknown>[];
    rows.push(...batch);

    if (batch.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

export async function exportDatabaseBackup(): Promise<DatabaseBackupPayload> {
  const [
    documents,
    documentRoutingLogs,
    archivedDocuments,
    archivedDocumentRoutingLogs,
    deletionRequests,
  ] = await Promise.all([
    fetchAllRows("documents"),
    fetchAllRows("document_routing_logs"),
    fetchAllRows("archived_documents"),
    fetchAllRows("archived_document_routing_logs"),
    fetchAllRows("deletion_requests"),
  ]);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    counts: {
      documents: documents.length,
      documentRoutingLogs: documentRoutingLogs.length,
      archivedDocuments: archivedDocuments.length,
      archivedDocumentRoutingLogs: archivedDocumentRoutingLogs.length,
      deletionRequests: deletionRequests.length,
    },
    documents,
    documentRoutingLogs,
    archivedDocuments,
    archivedDocumentRoutingLogs,
    deletionRequests,
  };
}

function isBackupPayload(value: unknown): value is DatabaseBackupPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<DatabaseBackupPayload>;
  return (
    payload.version === BACKUP_VERSION &&
    Array.isArray(payload.documents) &&
    Array.isArray(payload.documentRoutingLogs) &&
    Array.isArray(payload.archivedDocuments) &&
    Array.isArray(payload.archivedDocumentRoutingLogs) &&
    Array.isArray(payload.deletionRequests)
  );
}

export function previewBackupPayload(value: unknown): BackupPreview | null {
  if (!isBackupPayload(value)) {
    return null;
  }

  return {
    version: value.version,
    exportedAt: value.exportedAt ?? null,
    documents: value.documents.length,
    documentRoutingLogs: value.documentRoutingLogs.length,
    archivedDocuments: value.archivedDocuments.length,
    archivedDocumentRoutingLogs: value.archivedDocumentRoutingLogs.length,
    deletionRequests: value.deletionRequests.length,
  };
}

async function upsertRows(
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string
): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  const supabase = getSupabaseAdmin();
  const chunkSize = 200;
  let restored = 0;

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });

    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }

    restored += chunk.length;
  }

  return restored;
}

export async function restoreDatabaseBackup(
  value: unknown
): Promise<{ restored: DatabaseBackupPayload["counts"] }> {
  if (!isBackupPayload(value)) {
    throw new Error("Invalid backup file. Expected OCRS backup version 1.");
  }

  const restored = {
    documents: await upsertRows("documents", value.documents, "reference_number"),
    documentRoutingLogs: await upsertRows(
      "document_routing_logs",
      value.documentRoutingLogs,
      "id"
    ),
    archivedDocuments: await upsertRows(
      "archived_documents",
      value.archivedDocuments,
      "id"
    ),
    archivedDocumentRoutingLogs: await upsertRows(
      "archived_document_routing_logs",
      value.archivedDocumentRoutingLogs,
      "id"
    ),
    deletionRequests: await upsertRows(
      "deletion_requests",
      value.deletionRequests,
      "id"
    ),
  };

  return { restored };
}
