import type { LifeStatus } from "../domain/types";
import { STATUS_META } from "../domain/selectors";

export function StatusBadge({ status }: { status: LifeStatus }) {
  const meta = STATUS_META[status];
  return <span className={`badge badge-${meta.tone}`}>{meta.label}</span>;
}
