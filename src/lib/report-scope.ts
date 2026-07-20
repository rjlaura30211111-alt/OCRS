import type { OfficeOption } from "@/lib/offices";

export type OfficeFilter = "all" | OfficeOption;

export function matchesOfficeReportScope(input: {
  viewerOffice: OfficeOption;
  submitOffice: string;
  currentOffice: string | null;
}): boolean {
  const viewer = input.viewerOffice.trim();
  const submit = input.submitOffice.trim();
  const current = (input.currentOffice ?? "").trim();

  return submit === viewer || current === viewer;
}

export function matchesOfficeFilter(
  filter: OfficeFilter,
  submitOffice: string,
  currentOffice: string | null
): boolean {
  if (filter === "all") {
    return true;
  }

  return matchesOfficeReportScope({
    viewerOffice: filter,
    submitOffice,
    currentOffice,
  });
}

export function filterReportsByOffice<
  T extends {
    office: string;
    currentTrack: string | null;
  },
>(reports: T[], office: OfficeOption): T[] {
  return reports.filter((report) =>
    matchesOfficeReportScope({
      viewerOffice: office,
      submitOffice: report.office,
      currentOffice: report.currentTrack,
    })
  );
}
