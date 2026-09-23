import type { Registry } from "../domain/types";
import { CABINET_LAYOUT, displayName, selectCabinet } from "../domain/selectors";

interface Props {
  registry: Registry;
  onOpen: (id: string) => void;
}

/** 馆藏柜位记录：96 格逐格反映占用；点击占用格打开对应单份详情。 */
export function CabinetBoard({ registry, onOpen }: Props) {
  const cells = selectCabinet(registry);
  const { zones, columns, layers } = CABINET_LAYOUT;
  const occupied = cells.filter((c) => c.occupant).length;

  const gridFor = (zone: string) =>
    cells.filter((c) => c.code.startsWith(`${zone}-`));

  return (
    <section className="panel cabinet-panel">
      <div className="heading">
        <div>
          <p>馆藏柜位记录</p>
          <h2>柜位图</h2>
        </div>
        <div className="legend">
          <span><i className="dot dot-free" /> 空闲</span>
          <span><i className="dot dot-busy" /> 已占用 {occupied}</span>
          <span><i className="dot dot-total" /> 共 {cells.length} 柜位</span>
        </div>
      </div>

      <div className="cabinet-zones">
        {zones.map((zone) => (
          <div key={zone} className="cabinet-zone">
            <h3>柜区 {zone}</h3>
            <div
              className="cabinet-grid"
              style={{ gridTemplateColumns: `44px repeat(${columns}, 1fr)` }}
            >
              <div />
              {Array.from({ length: columns }, (_, i) => (
                <div key={i} className="col-head">{String(i + 1).padStart(2, "0")}</div>
              ))}

              {Array.from({ length: layers }, (_, layer) => (
                <LayerRow
                  key={layer}
                  layer={layer + 1}
                  cells={gridFor(zone).slice(layer * columns, layer * columns + columns)}
                  onOpen={onOpen}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LayerRow({
  layer,
  cells,
  onOpen,
}: {
  layer: number;
  cells: ReturnType<typeof selectCabinet>;
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <div className="layer-head">第{String(layer).padStart(2, "0")}层</div>
      {cells.map((cell) =>
        cell.occupant ? (
          <button
            key={cell.code}
            className="slot slot-busy"
            title={`${cell.code} · ${cell.occupant.collectionNo} · ${displayName(cell.occupant)}`}
            onClick={() => onOpen(cell.occupant!.id)}
          >
            <span className="slot-code">{cell.code}</span>
            <span className="slot-who">{cell.occupant.collectionNo}</span>
          </button>
        ) : (
          <div key={cell.code} className="slot slot-free" title={`${cell.code} · 空闲`}>
            <span className="slot-code">{cell.code}</span>
          </div>
        )
      )}
    </>
  );
}
