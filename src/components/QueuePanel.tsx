import { useMemo, useState } from "react";
import type { Registry } from "../domain/types";
import {
  ID_FILTERS,
  displayName,
  filterSpecimens,
  type IdFilter,
} from "../domain/selectors";
import { StatusBadge } from "./StatusBadge";

interface Props {
  registry: Registry;
  selectedId: string | null;
  onOpen: (id: string) => void;
}

export function QueuePanel({ registry, selectedId, onOpen }: Props) {
  const [filter, setFilter] = useState<IdFilter>("queued");
  const [keyword, setKeyword] = useState("");

  const list = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return filterSpecimens(registry, filter).filter((s) => {
      if (!kw) return true;
      return (
        s.collectionNo.toLowerCase().includes(kw) ||
        displayName(s).toLowerCase().includes(kw) ||
        s.place.toLowerCase().includes(kw) ||
        s.collectors.toLowerCase().includes(kw)
      );
    });
  }, [registry, filter, keyword]);

  return (
    <section className="panel queue-panel">
      <div className="heading">
        <div>
          <p>入库队列 · 鉴定筛选</p>
          <h2>馆藏工作台</h2>
        </div>
        <input
          className="search-box"
          value={keyword}
          placeholder="搜索采集号 / 物种 / 地点"
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <div className="chips filter-chips" role="tablist" aria-label="鉴定状态筛选">
        {ID_FILTERS.map((f) => {
          const count =
            f.value === "all"
              ? registry.specimens.length
              : registry.specimens.filter((s) => s.status === f.value).length;
          return (
            <button
              key={f.value}
              className={filter === f.value ? "chip-on" : ""}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
              <b>{count}</b>
            </button>
          );
        })}
      </div>

      <div className="record-list">
        {list.length === 0 && (
          <p className="empty-hint">当前筛选下没有标本，条件不满足时列表保持原状。</p>
        )}
        {list.map((s) => (
          <article
            key={s.id}
            className={`record-row ${selectedId === s.id ? "row-selected" : ""} row-${s.status}`}
            onClick={() => onOpen(s.id)}
          >
            <div className="record-main">
              <h3>{s.collectionNo}</h3>
              <p>
                <b className="species-name">{displayName(s)}</b>
                <span> · {s.place}</span>
                {s.elevation !== null && <span> · {s.elevation}m</span>}
              </p>
              <p className="record-meta">
                <span>{s.pressed ? "已压制" : "待压制"}</span>
                <span> · 采集人 {s.collectors}</span>
                {s.slot && <span> · 柜位 {s.slot}</span>}
                {s.status === "void" && s.voidReason && (
                  <span className="void-reason-inline"> · 作废：{s.voidReason}</span>
                )}
              </p>
            </div>
            <div className="record-side">
              <StatusBadge status={s.status} />
              <span className="open-link">单份详情 →</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
