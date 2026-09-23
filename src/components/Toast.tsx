import type { ActionNotice } from "../state/useRegistry";

export function Toast({ notice }: { notice: ActionNotice | null }) {
  if (!notice) return null;
  return (
    <div className={`toast toast-${notice.tone}`} role="status">
      <span className="toast-icon">{notice.tone === "success" ? "✓" : "!"}</span>
      {notice.text}
    </div>
  );
}
