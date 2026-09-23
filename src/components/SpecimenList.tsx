import type { Specimen } from "../domain/types";
import type { DeskFilter } from "../domain/rules";
import { DESK_FILTERS } from "../domain/rules";
import { fmtElev, stateBadge } from "./format";

interface Props {
  specimens: Specimen[];
  filter: DeskFilter;
  counts: Record<DeskFilter, number>;
  location: string | null;
  selectedId: string | null;
  onFilter: (filter: DeskFilter) => void;
  onClearLocation: () => void;
  onSelect: (id: string) => void;
}

/** 鉴定状态筛选 + 记录列表：与队列、柜位、详情引用同一份数据。 */
export function SpecimenList({
  specimens,
  filter,
  counts,
  location,
  selectedId,
  onFilter,
  onClearLocation,
  onSelect,
}: Props) {
  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>鉴定状态筛选</p>
          <h2>标本记录</h2>
        </div>
        <div className="chips">
          {DESK_FILTERS.map((f) => (
            <button
              key={f}
              className={f === filter ? "chip active" : "chip"}
              onClick={() => onFilter(f)}
            >
              {f} {counts[f]}
            </button>
          ))}
          {location && (
            <button className="chip location" onClick={onClearLocation} title="清除地点筛选">
              地点：{location} ×
            </button>
          )}
        </div>
      </div>
      {specimens.length === 0 ? (
        <p className="empty">
          没有符合「{filter}
          {location ? ` · ${location}` : ""}」的记录，已保持当前筛选条件。
        </p>
      ) : (
        <div className="spec-rows">
          {specimens.map((s) => {
            const badge = stateBadge(s);
            return (
              <article
                key={s.id}
                className={s.id === selectedId ? "spec-row selected" : "spec-row"}
                onClick={() => onSelect(s.id)}
              >
                <span className="mono no">{s.collectionNo}</span>
                <span className="name">{s.speciesName}</span>
                <span className="where">
                  {s.location} · {fmtElev(s.elevation)}
                </span>
                <span className={`badge ${badge.cls}`}>{badge.text}</span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
