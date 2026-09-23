import type { PressingStatus, Specimen } from "../domain/types";

export const fmtDate = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");

export const fmtElev = (elevation: number | null) =>
  elevation === null ? "—" : `${elevation} m`;

export interface Badge {
  text: string;
  cls: string;
}

/** 标本在登记流程中的状态徽标（在册/待鉴定/待上柜/已上柜/已作废）。 */
export function stateBadge(s: Specimen): Badge {
  if (s.status === "已作废") return { text: "已作废", cls: "b-void" };
  if (s.slot) return { text: `已上柜 ${s.slot}`, cls: "b-shelved" };
  if (s.identification === "鉴定接受") return { text: "待上柜", cls: "b-accepted" };
  return { text: "待鉴定", cls: "b-pending" };
}

export function pressingBadge(pressing: PressingStatus): string {
  switch (pressing) {
    case "已压制":
      return "b-shelved";
    case "需补照":
      return "b-warn";
    default:
      return "b-neutral";
  }
}
