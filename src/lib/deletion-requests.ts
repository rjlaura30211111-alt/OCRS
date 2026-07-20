import {
  archiveDocumentByReference,
  getDocumentByReference,
  getDocumentSubmitOffice,
  type DocumentRecord,
} from "@/lib/documents";
import { getSupabaseAdmin } from "@/lib/supabase/server";

function rethrowDbError(error: { code?: string; message?: string }): never {
  const message = error.message ?? "Database error.";

  if (/deletion_requests/i.test(message)) {
    throw new Error(
      "Deletion request tables are not set up yet. Run supabase/migrations/20260720140000_deletion_requests.sql in the Supabase SQL Editor, then try again."
    );
  }

  throw new Error(message);
}

type DeletionRequestRow = {
  id: string;
  document_id: string;
  reference_number: string;
  requested_by_office: string;
  requested_at: string;
  request_status: "pending" | "approved" | "rejected";
  subject: string;
  drafter: string;
  action_requested: string;
  sent_date: string;
  sent_time: string;
  document_status: string;
  received_by: string | null;
  current_office: string | null;
  destination_office: string | null;
  document_created_at: string;
  document_updated_at: string;
  resolved_at: string | null;
  deleted_by_name: string | null;
  resolved_by_office: string | null;
};

export type DeletionRequestRecord = {
  id: string;
  documentId: string;
  referenceNumber: string;
  requestedByOffice: string;
  requestedAt: string;
  requestStatus: DeletionRequestRow["request_status"];
  subject: string;
  drafter: string;
  actionRequested: string;
  sentDate: string;
  sentTime: string;
  documentStatus: string;
  receivedBy: string | null;
  currentOffice: string | null;
  destinationOffice: string | null;
  documentCreatedAt: string;
  documentUpdatedAt: string;
  resolvedAt: string | null;
  deletedByName: string | null;
  resolvedByOffice: string | null;
};

function mapDeletionRequest(row: DeletionRequestRow): DeletionRequestRecord {
  return {
    id: row.id,
    documentId: row.document_id,
    referenceNumber: row.reference_number,
    requestedByOffice: row.requested_by_office,
    requestedAt: row.requested_at,
    requestStatus: row.request_status,
    subject: row.subject,
    drafter: row.drafter,
    actionRequested: row.action_requested,
    sentDate: row.sent_date,
    sentTime: row.sent_time,
    documentStatus: row.document_status,
    receivedBy: row.received_by,
    currentOffice: row.current_office,
    destinationOffice: row.destination_office,
    documentCreatedAt: row.document_created_at,
    documentUpdatedAt: row.document_updated_at,
    resolvedAt: row.resolved_at,
    deletedByName: row.deleted_by_name,
    resolvedByOffice: row.resolved_by_office,
  };
}

function snapshotFromDocument(
  document: DocumentRecord,
  submitOffice: string
): Omit<DeletionRequestRow, "id" | "requested_at" | "request_status" | "resolved_at" | "deleted_by_name" | "resolved_by_office"> {
  return {
    document_id: document.id,
    reference_number: document.referenceNumber,
    requested_by_office: submitOffice,
    subject: document.subject,
    drafter: document.drafter,
    action_requested: document.actionRequested,
    sent_date: document.sentDate,
    sent_time: document.sentTime,
    document_status: document.status,
    received_by: document.receivedBy,
    current_office: document.currentOffice,
    destination_office: document.destinationOffice,
    document_created_at: document.createdAt,
    document_updated_at: document.updatedAt,
  };
}

export async function createDeletionRequest(
  referenceNumber: string,
  requestedByOffice: string
): Promise<DeletionRequestRecord> {
  const document = await getDocumentByReference(referenceNumber);

  if (!document) {
    throw new Error("No Document Found");
  }

  const submitOffice = await getDocumentSubmitOffice(
    document.id,
    document.currentOffice
  );

  if (submitOffice.trim() !== requestedByOffice.trim()) {
    throw new Error("You can only request deletion for reports submitted by your office.");
  }

  const supabase = getSupabaseAdmin();

  const { data: existing, error: existingError } = await supabase
    .from("deletion_requests")
    .select("id")
    .eq("document_id", document.id)
    .eq("request_status", "pending")
    .maybeSingle();

  if (existingError) {
    rethrowDbError(existingError);
  }

  if (existing) {
    throw new Error("A deletion request for this report is already pending OCRS approval.");
  }

  const { data, error } = await supabase
    .from("deletion_requests")
    .insert({
      ...snapshotFromDocument(document, requestedByOffice.trim()),
      request_status: "pending",
    })
    .select()
    .single();

  if (error) {
    rethrowDbError(error);
  }

  return mapDeletionRequest(data as DeletionRequestRow);
}

export async function listPendingDeletionRequests(): Promise<DeletionRequestRecord[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("deletion_requests")
    .select()
    .eq("request_status", "pending")
    .order("requested_at", { ascending: true });

  if (error) {
    rethrowDbError(error);
  }

  return (data ?? []).map((row) => mapDeletionRequest(row as DeletionRequestRow));
}

export async function getPendingDeletionReferenceNumbers(): Promise<Set<string>> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("deletion_requests")
    .select("reference_number")
    .eq("request_status", "pending");

  if (error) {
    rethrowDbError(error);
  }

  return new Set((data ?? []).map((row) => row.reference_number as string));
}

export async function approveDeletionRequest(
  requestId: string,
  deletedByName: string,
  resolvedByOffice: string
): Promise<void> {
  const trimmedName = deletedByName.trim();
  if (!trimmedName) {
    throw new Error("Deleted by is required.");
  }

  const supabase = getSupabaseAdmin();

  const { data: request, error: fetchError } = await supabase
    .from("deletion_requests")
    .select()
    .eq("id", requestId)
    .eq("request_status", "pending")
    .maybeSingle();

  if (fetchError) {
    rethrowDbError(fetchError);
  }

  if (!request) {
    throw new Error("Deletion request not found or already resolved.");
  }

  const row = request as DeletionRequestRow;

  await archiveDocumentByReference(row.reference_number, resolvedByOffice.trim(), {
    deletedByName: trimmedName,
    requestedByOffice: row.requested_by_office,
  });
}

export function toDeletionRequestPayload(request: DeletionRequestRecord) {
  return {
    id: request.id,
    referenceNumber: request.referenceNumber,
    requestedByOffice: request.requestedByOffice,
    requestedAt: request.requestedAt,
    subject: request.subject,
    drafter: request.drafter,
    actionRequested: request.actionRequested,
    sentDate: request.sentDate,
    sentTime: request.sentTime,
    documentStatus: request.documentStatus,
    receivedBy: request.receivedBy,
    currentOffice: request.currentOffice,
    destinationOffice: request.destinationOffice,
    documentCreatedAt: request.documentCreatedAt,
    documentUpdatedAt: request.documentUpdatedAt,
  };
}
