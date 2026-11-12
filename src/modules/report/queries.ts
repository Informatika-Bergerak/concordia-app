import { mockReports } from "./mock";
import type { ReportItem } from "./types";

export async function getReports(): Promise<ReportItem[]> {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("concordia_reports_v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...parsed, ...mockReports];
      } catch {
        return mockReports;
      }
    }
  }
  return mockReports;
}
