import { listDocumentReports } from "@/lib/documents";
import { listPendingDeletionRequests } from "@/lib/deletion-requests";
import { deriveTrackingPhase, type TrackingPhase } from "@/lib/report-filters";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type CountBreakdown = {
  label: string;
  count: number;
};

export type StatisticsSnapshot = {
  generatedAt: string;
  totals: {
    active: number;
    archived: number;
    pendingDeletionRequests: number;
    byPhase: Record<TrackingPhase, number>;
  };
  bySubmitOffice: CountBreakdown[];
  byCurrentOffice: CountBreakdown[];
  byStatus: CountBreakdown[];
  byArchivedOffice: CountBreakdown[];
};

function sortBreakdown(items: Map<string, number>): CountBreakdown[] {
  return [...items.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export async function collectStatistics(): Promise<StatisticsSnapshot> {
  const supabase = getSupabaseAdmin();

  const [activeCountRes, archivedCountRes, archivedRowsRes, pendingRequests] =
    await Promise.all([
      supabase.from("documents").select("*", { count: "exact", head: true }),
      supabase.from("archived_documents").select("*", { count: "exact", head: true }),
      supabase
        .from("archived_documents")
        .select("archived_by_office, requested_by_office"),
      listPendingDeletionRequests(),
    ]);

  if (activeCountRes.error) {
    throw new Error(activeCountRes.error.message);
  }

  if (archivedCountRes.error) {
    throw new Error(archivedCountRes.error.message);
  }

  if (archivedRowsRes.error) {
    throw new Error(archivedRowsRes.error.message);
  }

  const documents = await listDocumentReports(5000);

  const byPhase: Record<TrackingPhase, number> = {
    pending: 0,
    "on-process": 0,
    completed: 0,
  };
  const bySubmitOffice = new Map<string, number>();
  const byCurrentOffice = new Map<string, number>();
  const byStatus = new Map<string, number>();

  for (const document of documents) {
    const phase = deriveTrackingPhase({
      status: document.status,
      submitOffice: document.submitOffice,
      currentOffice: document.currentOffice,
    });
    byPhase[phase] += 1;
    increment(bySubmitOffice, document.submitOffice || "—");
    increment(byCurrentOffice, document.currentOffice ?? "—");
    increment(byStatus, document.status);
  }

  const byArchivedOffice = new Map<string, number>();
  for (const row of archivedRowsRes.data ?? []) {
    increment(
      byArchivedOffice,
      (row.archived_by_office as string | null)?.trim() || "—"
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      active: activeCountRes.count ?? documents.length,
      archived: archivedCountRes.count ?? 0,
      pendingDeletionRequests: pendingRequests.length,
      byPhase,
    },
    bySubmitOffice: sortBreakdown(bySubmitOffice),
    byCurrentOffice: sortBreakdown(byCurrentOffice),
    byStatus: sortBreakdown(byStatus),
    byArchivedOffice: sortBreakdown(byArchivedOffice),
  };
}
