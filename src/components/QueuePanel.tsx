import type { Specimen } from "../domain/types";
import { fmtElev, pressingBadge } from "./format";

interface Props {
  queue: Specimen[];
  onAccept: (id: string) => void;
  onSelect: (id: string) => void;
}

/** 入库队列：待鉴定标本先入队，鉴定接受后才离开队列。 */
export function QueuePanel({ queue, onAccept, onSelect }: Props) {
  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>待鉴定先入队</p>
          <h2>入库队列（{queue.length}）</h2>
        </div>
      </div>
      {queue.length === 0 ? (
        <p className="empty">队列已清空，新登记的标本会先进入这里。</p>
      ) : (
        <div className="queue-list">
          {queue.map((s, index) => (
            <article key={s.id}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <div className="queue-main">
                <h3 className="mono">{s.collectionNo}</h3>
                <p>
                  {s.speciesName} · {s.location} {fmtElev(s.elevation)} · {s.collector}
                </p>
                <span className={`badge ${pressingBadge(s.pressing)}`}>{s.pressing}</span>
              </div>
              <div className="row-actions">
                <button className="primary" onClick={() => onAccept(s.id)}>
                  接受鉴定
                </button>
                <button onClick={() => onSelect(s.id)}>详情</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
