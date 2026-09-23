import type { LocationCard } from "../domain/rules";

interface Props {
  cards: LocationCard[];
  active: string | null;
  onToggle: (location: string) => void;
}

/** 采集地点信息卡：点击卡片可叠加地点筛选，再次点击取消。 */
export function LocationCards({ cards, active, onToggle }: Props) {
  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>采集地点信息卡</p>
          <h2>采集点（{cards.length}）</h2>
        </div>
        <small className="hint">点击卡片按地点筛选记录列表</small>
      </div>
      {cards.length === 0 ? (
        <p className="empty">暂无在册采集点。</p>
      ) : (
        <div className="loc-cards">
          {cards.map((card) => (
            <article
              key={card.location}
              className={card.location === active ? "loc-card active" : "loc-card"}
              onClick={() => onToggle(card.location)}
            >
              <h3>{card.location}</h3>
              <p>
                在册 {card.total} 份 · 待鉴定 {card.queue} · 已上柜 {card.shelved}
              </p>
              <p>
                海拔{" "}
                {card.elevationMin === null
                  ? "—"
                  : card.elevationMin === card.elevationMax
                    ? `${card.elevationMin} m`
                    : `${card.elevationMin}–${card.elevationMax} m`}
              </p>
              <p>采集人：{card.collectors.join("、")}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
