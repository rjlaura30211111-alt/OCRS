import type { ActionRequested } from "@/lib/actions";
import {
  COMPLETED_DISPOSITIONS,
  type ReceiveDisposition,
} from "@/lib/dispositions";
import { getSupabaseAdmin } from "@/lib/supabase/server";

function rethrowDbError(
  error: { code?: string; message?: string },
  duplicateMessage?: string
): never {
  if (error.code === "23505" && duplicateMessage) {
    throw new Error(duplicateMessage);
  }

  const message = error.message ?? "Database error.";

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
  "Uploaded to OLCIMS",
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
  currentOffice: string;
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
  return {
    referenceNumber: document.referenceNumber,
    subject: document.subject,
    office: document.submitOffice,
    drafter: document.drafter,
    currentTrack: document.currentOffice,
    status: document.status,
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

  const { data, error } = await supabase
    .from("documents")
    .update({
      received_by: input.receivedBy.trim(),
      status: input.status,
      current_office: office,
      updated_at: receivedAt,
    })
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

  const office = input.currentOffice.trim();
  if (!office) {
    throw new Error("Office is required.");
  }

  const { data, error } = await supabase
    .from("documents")
    .update({
      subject: input.subject.trim(),
      drafter: input.drafter.trim(),
      action_requested: input.actionRequested,
      current_office: office,
      updated_at: new Date().toISOString(),
    })
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
    sentDate: document.sentDate,
    sentTime: document.sentTime,
    createdAt: document.createdAt,
  };
}

export function getDisplayStatus(status: DocumentStatus): string {
  if (status === "Uploaded to OLCIMS") {
    return status;
  }
  return "Pending";
}
