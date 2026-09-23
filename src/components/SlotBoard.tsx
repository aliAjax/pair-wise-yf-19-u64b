import type { SlotRecord } from "../domain/rules";

interface Props {
  records: SlotRecord[];
  onSelect: (id: string) => void;
}

/** 馆藏柜位记录：占用中的柜位一览，占位不可覆盖。 */
export function SlotBoard({ records, onSelect }: Props) {
  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>柜位被占用时提示换位，不覆盖已有记录</p>
          <h2>馆藏柜位记录（{records.length}）</h2>
        </div>
      </div>
      {records.length === 0 ? (
        <p className="empty">暂无柜位占用，鉴定接受后即可登记柜位。</p>
      ) : (
        <div className="slot-table">
          <div className="slot-row head">
            <span>柜位</span>
            <span>采集号</span>
            <span>物种名称</span>
            <span>采集地点</span>
            <span />
          </div>
          {records.map((r) => (
            <div key={r.slot} className="slot-row">
              <span className="mono slot">{r.slot}</span>
              <span className="mono">{r.collectionNo}</span>
              <span>{r.speciesName}</span>
              <span>{r.location}</span>
              <button onClick={() => onSelect(r.specimenId)}>查看</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
