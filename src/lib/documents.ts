import type { ActionRequested } from "@/lib/actions";
import type { ReceiveDisposition } from "@/lib/dispositions";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const DOCUMENT_STATUSES = [
  "Pending",
  "For Checking",
  "Approved",
  "For Approval",
  "Return for Correction",
  "Uploaded at OLCIMS",
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
      current_office: "OCRS",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Reference number already exists.");
    }
    throw new Error(error.message);
  }

  await supabase.from("document_routing_logs").insert({
    document_id: data.id,
    office_code: "OCRS",
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
    throw new Error(error.message);
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
    throw new Error(error.message);
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
    throw new Error(error.message);
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
    throw new Error(error.message);
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
    throw new Error(logError.message);
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
  };
}

export function getDisplayStatus(status: DocumentStatus): string {
  if (status === "Uploaded at OLCIMS") {
    return status;
  }
  return "Pending";
}
