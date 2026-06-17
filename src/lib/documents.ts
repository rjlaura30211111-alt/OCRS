import type { ActionRequested } from "@/lib/actions";
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

export function getDisplayStatus(status: DocumentStatus): string {
  if (status === "Uploaded at OLCIMS") {
    return status;
  }
  return "Pending";
}
