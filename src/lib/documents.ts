import type { ActionRequested } from "@/lib/actions";
import {
  COMPLETED_DISPOSITIONS,
  isCompletedDisposition,
  type ReceiveDisposition,
} from "@/lib/dispositions";
import { deriveTrackingPhase, type TrackingPhase } from "@/lib/report-filters";
import { getSupabaseAdmin } from "@/lib/supabase/server";

function rethrowDbError(
  error: { code?: string; message?: string },
  duplicateMessage?: string
): never {
  if (error.code === "23505" && duplicateMessage) {
    throw new Error(duplicateMessage);
  }

  const message = error.message ?? "Database error.";

  if (/documents_status_check/i.test(message)) {
    throw new Error(
      "This disposition could not be saved because the database status list is outdated. Run supabase/migrations/20260720110000_add_disposition_options.sql in the Supabase SQL Editor, then try again."
    );
  }

  if (/archived_documents/i.test(message)) {
    throw new Error(
      "Archive tables are not set up yet. Run supabase/run-pending-migrations.sql in the Supabase SQL Editor, then try again."
    );
  }

  if (/destination_office/i.test(message)) {
    throw new Error(
      "Office Destination column is missing. Run supabase/run-pending-migrations.sql in the Supabase SQL Editor, then try again."
    );
  }

  if (/fetch failed|ENOTFOUND|ECONNREFUSED|network/i.test(message)) {
    throw new Error(
      "Could not connect to Supabase. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, and ensure the project is active."
    );
  }

  throw new Error(message);
}

export const DOCUMENT_STATUSES = [
  "Pending",
  "For Checking",
  "Approved",
  "Return for Correction",
  "Signed by RD",
  "Signed by CRS",
  "Pull-out",
  "Hand Carry",
  "For Concur",
  "HWI",
  "Uploaded to OLCIMS",
  "Approved-Completed",
  "Approved by CRS",
  "Noted By CRS",
  "Approved by RD",
  "Noted by RD",
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export type DocumentRecord = {
  id: string;
  referenceNumber: string;
  subject: string;
  drafter: string;
  actionRequested: string;
  sentDate: string;
  sentTime: string;
  status: DocumentStatus;
  receivedBy: string | null;
  currentOffice: string | null;
  destinationOffice: string | null;
  updatedAt: string;
  createdAt: string;
};

export type CreateDocumentInput = {
  referenceNumber: string;
  subject: string;
  drafter: string;
  officeDivision: string;
  actionRequested: ActionRequested;
  date: string;
  time: string;
};

export type ReceiveDocumentInput = {
  referenceNumber: string;
  receivedBy: string;
  status: ReceiveDisposition;
  currentOffice: string;
};

export type UpdateDocumentInput = {
  referenceNumber: string;
  subject: string;
  drafter: string;
  actionRequested: ActionRequested;
};

type RoutingLogRow = {
  id: string;
  document_id: string;
  office_code: string;
  received_by: string | null;
  status: string;
  logged_at: string;
  notes: string | null;
};

export type RoutingLogEntry = {
  id: string;
  officeCode: string;
  receivedBy: string | null;
  status: string;
  loggedAt: string;
  notes: string | null;
};

type DocumentRow = {
  id: string;
  reference_number: string;
  subject: string;
  drafter: string;
  action_requested: string;
  sent_date: string;
  sent_time: string;
  status: string;
  received_by: string | null;
  current_office: string | null;
  destination_office: string | null;
  updated_at: string;
  created_at: string;
};

function mapRow(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    referenceNumber: row.reference_number,
    subject: row.subject,
    drafter: row.drafter,
    actionRequested: row.action_requested,
    sentDate: row.sent_date,
    sentTime: row.sent_time,
    status: row.status as DocumentStatus,
    receivedBy: row.received_by,
    currentOffice: row.current_office,
    destinationOffice: row.destination_office,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

export async function createDocument(
  input: CreateDocumentInput
): Promise<DocumentRecord> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("documents")
    .insert({
      reference_number: input.referenceNumber,
      subject: input.subject,
      drafter: input.drafter,
      action_requested: input.actionRequested,
      sent_date: input.date,
      sent_time: input.time,
      status: "Pending",
      current_office: input.officeDivision,
      destination_office: null,
    })
    .select()
    .single();

  if (error) {
    rethrowDbError(error, "Reference number already exists.");
  }

  await supabase.from("document_routing_logs").insert({
    document_id: data.id,
    office_code: input.officeDivision,
    status: "Pending",
    notes: "Document submitted",
  });

  return mapRow(data as DocumentRow);
}

export async function getDocumentByReference(
  referenceNumber: string
): Promise<DocumentRecord | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("documents")
    .select()
    .eq("reference_number", referenceNumber)
    .maybeSingle();

  if (error) {
    rethrowDbError(error);
  }

  return data ? mapRow(data as DocumentRow) : null;
}

export async function searchDocumentsByReference(
  query: string,
  limit = 8
): Promise<DocumentRecord[]> {
  const supabase = getSupabaseAdmin();
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const { data, error } = await supabase
    .from("documents")
    .select()
    .ilike("reference_number", `%${trimmed}%`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    rethrowDbError(error);
  }

  return (data ?? []).map((row) => mapRow(row as DocumentRow));
}

export type DocumentReportRecord = DocumentRecord & {
  submitOffice: string;
};

export async function listDocumentReports(
  limit = 100
): Promise<DocumentReportRecord[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("documents")
    .select()
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    rethrowDbError(error);
  }

  const documents = (data ?? []).map((row) => mapRow(row as DocumentRow));

  if (documents.length === 0) {
    return [];
  }

  const documentIds = documents.map((doc) => doc.id);

  const { data: submitLogs, error: logError } = await supabase
    .from("document_routing_logs")
    .select("document_id, office_code")
    .in("document_id", documentIds)
    .eq("notes", "Document submitted");

  if (logError) {
    rethrowDbError(logError);
  }

  const submitOfficeByDocumentId = new Map<string, string>();
  for (const log of submitLogs ?? []) {
    submitOfficeByDocumentId.set(log.document_id, log.office_code);
  }

  return documents.map((document) => ({
    ...document,
    submitOffice:
      submitOfficeByDocumentId.get(document.id) ??
      document.currentOffice ??
      "—",
  }));
}

export function toReportPayload(document: DocumentReportRecord) {
  const trackingPhase: TrackingPhase = deriveTrackingPhase({
    status: document.status,
    submitOffice: document.submitOffice,
    currentOffice: document.currentOffice,
  });

  return {
    referenceNumber: document.referenceNumber,
    subject: document.subject,
    office: document.submitOffice,
    drafter: document.drafter,
    currentTrack: document.currentOffice,
    status: document.status,
    trackingPhase,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export async function listDocumentsByOffice(
  office: string,
  limit = 50
): Promise<DocumentRecord[]> {
  const supabase = getSupabaseAdmin();
  const trimmed = office.trim();

  if (!trimmed) {
    return [];
  }

  // Inbox = active documents at this office. Completed (OLCIMS) and routed-away
  // documents are excluded from the receive queue.
  let query = supabase
    .from("documents")
    .select()
    .eq("current_office", trimmed);

  for (const completedStatus of COMPLETED_DISPOSITIONS) {
    query = query.neq("status", completedStatus);
  }

  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    rethrowDbError(error);
  }

  return (data ?? []).map((row) => mapRow(row as DocumentRow));
}

function mapRoutingLog(row: RoutingLogRow): RoutingLogEntry {
  return {
    id: row.id,
    officeCode: row.office_code,
    receivedBy: row.received_by,
    status: row.status,
    loggedAt: row.logged_at,
    notes: row.notes,
  };
}

export async function getRoutingLogsByReference(
  referenceNumber: string
): Promise<RoutingLogEntry[]> {
  const document = await getDocumentByReference(referenceNumber);

  if (!document) {
    return [];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("document_routing_logs")
    .select()
    .eq("document_id", document.id)
    .order("logged_at", { ascending: true });

  if (error) {
    rethrowDbError(error);
  }

  return (data ?? []).map((row) => mapRoutingLog(row as RoutingLogRow));
}

export async function hasOfficeReceivedDocument(
  referenceNumber: string,
  office: string
): Promise<boolean> {
  const trimmedOffice = office.trim();
  if (!trimmedOffice) {
    return false;
  }

  const logs = await getRoutingLogsByReference(referenceNumber);
  return logs.some(
    (entry) =>
      entry.officeCode.trim() === trimmedOffice &&
      entry.notes === "Document received"
  );
}

export function toRoutingLogPayload(entry: RoutingLogEntry) {
  return {
    id: entry.id,
    officeCode: entry.officeCode,
    receivedBy: entry.receivedBy,
    status: entry.status,
    loggedAt: entry.loggedAt,
    notes: entry.notes,
  };
}

export type UpdateRoutingLogInput = {
  id: string;
  referenceNumber: string;
  officeCode: string;
  receivedBy: string;
  status: ReceiveDisposition;
};

export async function updateRoutingLog(
  input: UpdateRoutingLogInput
): Promise<{ document: DocumentRecord; logs: RoutingLogEntry[] }> {
  const supabase = getSupabaseAdmin();
  const document = await getDocumentByReference(input.referenceNumber);

  if (!document) {
    throw new Error("No Document Found");
  }

  const { data: logRow, error: fetchError } = await supabase
    .from("document_routing_logs")
    .select()
    .eq("id", input.id)
    .eq("document_id", document.id)
    .maybeSingle();

  if (fetchError) {
    rethrowDbError(fetchError);
  }

  if (!logRow) {
    throw new Error("Tracking entry not found.");
  }

  const office = input.officeCode.trim();
  if (!office) {
    throw new Error("Office is required.");
  }

  const { error: updateLogError } = await supabase
    .from("document_routing_logs")
    .update({
      office_code: office,
      received_by: input.receivedBy.trim(),
      status: input.status,
    })
    .eq("id", input.id);

  if (updateLogError) {
    rethrowDbError(updateLogError);
  }

  const logs = await getRoutingLogsByReference(input.referenceNumber);
  const latestReceive = [...logs]
    .reverse()
    .find((entry) => entry.notes === "Document received");

  if (latestReceive?.id === input.id) {
    await supabase
      .from("documents")
      .update({
        received_by: input.receivedBy.trim(),
        status: input.status,
        current_office: office,
        updated_at: new Date().toISOString(),
      })
      .eq("id", document.id);
  }

  const updatedDocument = await getDocumentByReference(input.referenceNumber);
  const updatedLogs = await getRoutingLogsByReference(input.referenceNumber);

  if (!updatedDocument) {
    throw new Error("No Document Found");
  }

  return { document: updatedDocument, logs: updatedLogs };
}

export async function receiveDocument(
  input: ReceiveDocumentInput
): Promise<DocumentRecord> {
  const supabase = getSupabaseAdmin();
  const existing = await getDocumentByReference(input.referenceNumber);

  if (!existing) {
    throw new Error("No Document Found");
  }

  const office = input.currentOffice.trim();
  if (!office) {
    throw new Error("Office is required.");
  }
  const receivedAt = new Date().toISOString();
  const updatePayload: Record<string, string> = {
    received_by: input.receivedBy.trim(),
    status: input.status,
    current_office: office,
    updated_at: receivedAt,
  };

  const { data, error } = await supabase
    .from("documents")
    .update(updatePayload)
    .eq("id", existing.id)
    .select()
    .single();

  if (error) {
    rethrowDbError(error);
  }

  const { error: logError } = await supabase.from("document_routing_logs").insert({
    document_id: existing.id,
    office_code: office,
    received_by: input.receivedBy.trim(),
    status: input.status,
    logged_at: receivedAt,
    notes: "Document received",
  });

  if (logError) {
    rethrowDbError(logError);
  }

  return mapRow(data as DocumentRow);
}

export async function updateDocument(
  input: UpdateDocumentInput
): Promise<DocumentRecord> {
  const supabase = getSupabaseAdmin();
  const existing = await getDocumentByReference(input.referenceNumber);

  if (!existing) {
    throw new Error("No Document Found");
  }

  const updatePayload: Record<string, string> = {
    subject: input.subject.trim(),
    drafter: input.drafter.trim(),
    action_requested: input.actionRequested,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("documents")
    .update(updatePayload)
    .eq("id", existing.id)
    .select()
    .single();

  if (error) {
    rethrowDbError(error);
  }

  return mapRow(data as DocumentRow);
}

export function toDocumentPayload(document: DocumentRecord) {
  return {
    referenceNumber: document.referenceNumber,
    subject: document.subject,
    drafter: document.drafter,
    actionRequested: document.actionRequested,
    receivedBy: document.receivedBy,
    status: getDisplayStatus(document.status),
    rawStatus: document.status,
    timestamp: document.updatedAt,
    currentOffice: document.currentOffice,
    destinationOffice: document.destinationOffice,
    sentDate: document.sentDate,
    sentTime: document.sentTime,
    createdAt: document.createdAt,
  };
}

export function getDisplayStatus(status: DocumentStatus): string {
  if (status === "Approved-Completed") {
    return "Completed";
  }
  if (isCompletedDisposition(status)) {
    return "Completed";
  }
  if (status === "Uploaded to OLCIMS") {
    return status;
  }
  return "Pending";
}

export async function archiveDocumentByReference(
  referenceNumber: string,
  archivedByOffice: string
): Promise<void> {
  const document = await getDocumentByReference(referenceNumber);

  if (!document) {
    throw new Error("No Document Found");
  }

  const supabase = getSupabaseAdmin();

  const { data: logs, error: logsError } = await supabase
    .from("document_routing_logs")
    .select()
    .eq("document_id", document.id)
    .order("logged_at", { ascending: true });

  if (logsError) {
    rethrowDbError(logsError);
  }

  const { data: archived, error: archError } = await supabase
    .from("archived_documents")
    .insert({
      original_document_id: document.id,
      reference_number: document.referenceNumber,
      subject: document.subject,
      drafter: document.drafter,
      action_requested: document.actionRequested,
      sent_date: document.sentDate,
      sent_time: document.sentTime,
      status: document.status,
      received_by: document.receivedBy,
      current_office: document.currentOffice,
      destination_office: document.destinationOffice,
      document_created_at: document.createdAt,
      document_updated_at: document.updatedAt,
      archived_by_office: archivedByOffice.trim(),
    })
    .select("id")
    .single();

  if (archError) {
    rethrowDbError(archError);
  }

  if (logs && logs.length > 0) {
    const { error: archLogsError } = await supabase
      .from("archived_document_routing_logs")
      .insert(
        logs.map((log) => ({
          archived_document_id: archived.id,
          original_log_id: log.id,
          office_code: log.office_code,
          received_by: log.received_by,
          status: log.status,
          logged_at: log.logged_at,
          notes: log.notes,
        }))
      );

    if (archLogsError) {
      rethrowDbError(archLogsError);
    }
  }

  const { error: deleteLogsError } = await supabase
    .from("document_routing_logs")
    .delete()
    .eq("document_id", document.id);

  if (deleteLogsError) {
    rethrowDbError(deleteLogsError);
  }

  const { error: deleteDocError } = await supabase
    .from("documents")
    .delete()
    .eq("id", document.id);

  if (deleteDocError) {
    rethrowDbError(deleteDocError);
  }
}

export async function getDocumentSubmitOffice(
  documentId: string,
  fallbackOffice: string | null
): Promise<string> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("document_routing_logs")
    .select("office_code")
    .eq("document_id", documentId)
    .eq("notes", "Document submitted")
    .maybeSingle();

  if (error) {
    rethrowDbError(error);
  }

  return data?.office_code ?? fallbackOffice ?? "—";
}

type ArchivedDocumentRow = {
  id: string;
  original_document_id: string;
  reference_number: string;
  subject: string;
  drafter: string;
  action_requested: string;
  sent_date: string;
  sent_time: string;
  status: string;
  received_by: string | null;
  current_office: string | null;
  destination_office: string | null;
  document_created_at: string;
  document_updated_at: string;
  archived_at: string;
  archived_by_office: string;
};

type ArchivedRoutingLogRow = {
  id: string;
  archived_document_id: string;
  original_log_id: string | null;
  office_code: string;
  received_by: string | null;
  status: string;
  logged_at: string;
  notes: string | null;
};

export type ArchivedDocumentRecord = {
  id: string;
  originalDocumentId: string;
  referenceNumber: string;
  subject: string;
  drafter: string;
  actionRequested: string;
  sentDate: string;
  sentTime: string;
  status: DocumentStatus;
  receivedBy: string | null;
  currentOffice: string | null;
  destinationOffice: string | null;
  documentCreatedAt: string;
  documentUpdatedAt: string;
  archivedAt: string;
  archivedByOffice: string;
};

export type ArchivedReportRecord = ArchivedDocumentRecord & {
  submitOffice: string;
};

function mapArchivedRow(row: ArchivedDocumentRow): ArchivedDocumentRecord {
  return {
    id: row.id,
    originalDocumentId: row.original_document_id,
    referenceNumber: row.reference_number,
    subject: row.subject,
    drafter: row.drafter,
    actionRequested: row.action_requested,
    sentDate: row.sent_date,
    sentTime: row.sent_time,
    status: row.status as DocumentStatus,
    receivedBy: row.received_by,
    currentOffice: row.current_office,
    destinationOffice: row.destination_office,
    documentCreatedAt: row.document_created_at,
    documentUpdatedAt: row.document_updated_at,
    archivedAt: row.archived_at,
    archivedByOffice: row.archived_by_office,
  };
}

export async function listArchivedDocuments(
  limit = 500
): Promise<ArchivedReportRecord[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("archived_documents")
    .select()
    .order("archived_at", { ascending: false })
    .limit(limit);

  if (error) {
    rethrowDbError(error);
  }

  const documents = (data ?? []).map((row) =>
    mapArchivedRow(row as ArchivedDocumentRow)
  );

  if (documents.length === 0) {
    return [];
  }

  const archivedIds = documents.map((document) => document.id);

  const { data: submitLogs, error: logError } = await supabase
    .from("archived_document_routing_logs")
    .select("archived_document_id, office_code")
    .in("archived_document_id", archivedIds)
    .eq("notes", "Document submitted");

  if (logError) {
    rethrowDbError(logError);
  }

  const submitOfficeByArchivedId = new Map<string, string>();
  for (const log of submitLogs ?? []) {
    submitOfficeByArchivedId.set(log.archived_document_id, log.office_code);
  }

  return documents.map((document) => ({
    ...document,
    submitOffice:
      submitOfficeByArchivedId.get(document.id) ??
      document.currentOffice ??
      "—",
  }));
}

export async function getArchivedDocumentByReference(
  referenceNumber: string
): Promise<ArchivedDocumentRecord | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("archived_documents")
    .select()
    .eq("reference_number", referenceNumber)
    .order("archived_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    rethrowDbError(error);
  }

  if (!data) {
    return null;
  }

  return mapArchivedRow(data as ArchivedDocumentRow);
}

export async function getArchivedRoutingLogsByReference(
  referenceNumber: string
): Promise<RoutingLogEntry[]> {
  const document = await getArchivedDocumentByReference(referenceNumber);

  if (!document) {
    return [];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("archived_document_routing_logs")
    .select()
    .eq("archived_document_id", document.id)
    .order("logged_at", { ascending: true });

  if (error) {
    rethrowDbError(error);
  }

  return (data ?? []).map((row) => {
    const log = row as ArchivedRoutingLogRow;
    return {
      id: log.id,
      officeCode: log.office_code,
      receivedBy: log.received_by,
      status: log.status,
      loggedAt: log.logged_at,
      notes: log.notes,
    };
  });
}

export function toArchivedReportPayload(document: ArchivedReportRecord) {
  const trackingPhase: TrackingPhase = deriveTrackingPhase({
    status: document.status,
    submitOffice: document.submitOffice,
    currentOffice: document.currentOffice,
  });

  return {
    referenceNumber: document.referenceNumber,
    subject: document.subject,
    office: document.submitOffice,
    drafter: document.drafter,
    currentTrack: document.currentOffice,
    status: document.status,
    trackingPhase,
    createdAt: document.documentCreatedAt,
    updatedAt: document.documentUpdatedAt,
    archivedAt: document.archivedAt,
    archivedByOffice: document.archivedByOffice,
  };
}
