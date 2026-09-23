import type { Registry } from "../domain/types";
import { displayName, selectSiteCards } from "../domain/selectors";

interface Props {
  registry: Registry;
  onOpen: (id: string) => void;
}

/** 采集地点信息卡：与队列、柜位、详情引用同一份 registry，经 selectSiteCards 派生。 */
export function SiteCards({ registry, onOpen }: Props) {
  const cards = selectSiteCards(registry);

  return (
    <section className="panel sites-panel">
      <div className="heading">
        <div>
          <p>采集地点卡</p>
          <h2>采集地点聚合</h2>
        </div>
        <span className="rule-note">作废标本不计入地点统计</span>
      </div>

      {cards.length === 0 && <p className="empty-hint">暂无有效采集地点。</p>}

      <div className="site-grid">
        {cards.map((card) => {
          const elevationText =
            card.elevations.length === 0
              ? "未记录海拔"
              : card.elevations[0] === card.elevations[card.elevations.length - 1]
              ? `${card.elevations[0]}m`
              : `${card.elevations[0]}–${card.elevations[card.elevations.length - 1]}m`;
          return (
            <article key={card.place} className="site-card">
              <header>
                <h3>{card.place}</h3>
                <span className="site-count">{card.count} 份</span>
              </header>
              <p className="site-elevation">海拔 {elevationText}</p>
              <ul>
                {card.specimens.map((s) => (
                  <li key={s.id} onClick={() => onOpen(s.id)}>
                    <span className="site-coll-no">{s.collectionNo}</span>
                    <span className="site-species">{displayName(s)}</span>
                    {s.slot && <span className="site-slot">柜 {s.slot}</span>}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
