import { useState } from "react";
import type { Registry, Specimen } from "../domain/types";
import { CABINET_SLOTS } from "../domain/cabinet";
import { displayName, selectCabinet } from "../domain/selectors";
import { StatusBadge } from "./StatusBadge";

interface Props {
  registry: Registry;
  specimen: Specimen;
  onBack: () => void;
  onAccept: (id: string, name: string) => boolean;
  onAssign: (id: string, slot: string) => boolean;
  onRelocate: (id: string, slot: string) => boolean;
  onVoid: (id: string, reason: string) => boolean;
}

/** 单份标本详情：登记信息、鉴定/上柜/换位/作废操作、完整记录历史。 */
export function SpecimenDetail({
  registry,
  specimen,
  onBack,
  onAccept,
  onAssign,
  onRelocate,
  onVoid,
}: Props) {
  return (
    <section className="panel detail-panel">
      <div className="heading">
        <div>
          <p>单份标本详情</p>
          <h2>{specimen.collectionNo}</h2>
        </div>
        <div className="detail-head-right">
          <StatusBadge status={specimen.status} />
          <button className="ghost" onClick={onBack}>← 返回工作台</button>
        </div>
      </div>

      <div className="detail-grid">
        <dl className="detail-fields">
          <Field label="采集号" value={specimen.collectionNo} />
          <Field label="登记物种" value={specimen.species} />
          <Field label="鉴定定名" value={specimen.confirmedSpecies ?? "尚未鉴定"} muted={!specimen.confirmedSpecies} />
          <Field label="当前名称" value={displayName(specimen)} />
          <Field label="采集地点" value={specimen.place} />
          <Field label="海拔" value={specimen.elevation === null ? "未记录" : `${specimen.elevation} m`} />
          <Field label="生境描述" value={specimen.habitat || "未记录"} muted={!specimen.habitat} />
          <Field label="采集人" value={specimen.collectors} />
          <Field label="压制状态" value={specimen.pressed ? "已压制" : "待压制"} />
          <Field label="馆藏柜位" value={specimen.slot ?? (specimen.status === "void" ? "已释放" : "未分配")} muted={!specimen.slot} />
          <Field label="登记时间" value={specimen.createdAt} />
          {specimen.status === "void" && (
            <Field label="作废原因" value={specimen.voidReason ?? ""} danger />
          )}
        </dl>

        <div className="detail-side">
          {specimen.status !== "void" && (
            <ActionCard
              registry={registry}
              specimen={specimen}
              onAccept={onAccept}
              onAssign={onAssign}
              onRelocate={onRelocate}
              onVoid={onVoid}
            />
          )}

          <div className="history-card">
            <h3>记录历史（原始记录保留）</h3>
            <ol className="history-list">
              {specimen.history.map((h, i) => (
                <li key={`${h.at}-${i}`} className={`hist-kind-${h.kind}`}>
                  <time>{h.at}</time>
                  <span className="hist-tag">{historyKindLabel(h.kind)}</span>
                  <p>{h.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function historyKindLabel(kind: Specimen["history"][number]["kind"]): string {
  switch (kind) {
    case "register":
      return "登记";
    case "accept":
      return "鉴定";
    case "assign":
      return "柜位";
    case "void":
      return "作废";
  }
}

function Field({ label, value, muted, danger }: { label: string; value: string; muted?: boolean; danger?: boolean }) {
  return (
    <div className={`detail-field ${danger ? "field-danger" : ""}`}>
      <dt>{label}</dt>
      <dd className={muted ? "muted" : ""}>{value}</dd>
    </div>
  );
}

function ActionCard({
  registry,
  specimen,
  onAccept,
  onAssign,
  onRelocate,
  onVoid,
}: Omit<Props, "onBack">) {
  const [name, setName] = useState("");
  const [slot, setSlot] = useState("");
  const [reason, setReason] = useState("");
  const [voidOpen, setVoidOpen] = useState(false);

  const occupied = new Set(selectCabinet(registry).filter((c) => c.occupant).map((c) => c.code));

  return (
    <div className="action-card">
      <h3>业务操作</h3>

      {specimen.status === "queued" && (
        <div className="action-block">
          <p className="action-hint">标本在待鉴定队列中，鉴定接受后才能选择柜位。</p>
          <label>
            <span>鉴定定名 *</span>
            <input
              value={name}
              placeholder="填写接受的物种学名/中文名"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button
            className="primary"
            onClick={() => {
              if (onAccept(specimen.id, name)) setName("");
            }}
          >
            接受鉴定
          </button>
        </div>
      )}

      {specimen.status === "accepted" && (
        <div className="action-block">
          <p className="action-hint">
            已定名 <b>{specimen.confirmedSpecies}</b>，请选择柜位；被占用的柜位不可选。
          </p>
          <label>
            <span>选择柜位 *</span>
            <select value={slot} onChange={(e) => setSlot(e.target.value)}>
              <option value="">— 请选择空闲柜位 —</option>
              {CABINET_SLOTS.map((code) => (
                <option key={code} value={code} disabled={occupied.has(code)}>
                  {code}
                  {occupied.has(code) ? "（已占用）" : " · 空闲"}
                </option>
              ))}
            </select>
          </label>
          {slot && (
            <button
              className="primary"
              onClick={() => {
                if (onAssign(specimen.id, slot)) setSlot("");
              }}
            >
              确认上柜到 {slot}
            </button>
          )}
        </div>
      )}

      {specimen.status === "stored" && (
        <div className="action-block">
          <p className="action-hint">
            当前在柜 <b>{specimen.slot}</b>。换位不允许覆盖已有记录，占用柜位会被拒绝并提示换位。
          </p>
          <label>
            <span>换到柜位 *</span>
            <select value={slot} onChange={(e) => setSlot(e.target.value)}>
              <option value="">— 请选择空闲柜位 —</option>
              {CABINET_SLOTS.map((code) => {
                const busy = occupied.has(code) && code !== specimen.slot;
                const self = code === specimen.slot;
                return (
                  <option key={code} value={code} disabled={busy}>
                    {code}
                    {self ? "（当前位置）" : busy ? "（已占用）" : " · 空闲"}
                  </option>
                );
              })}
            </select>
          </label>
          {slot && (
            <button
              className="primary"
              onClick={() => {
                if (onRelocate(specimen.id, slot)) setSlot("");
              }}
            >
              确认换位到 {slot}
            </button>
          )}
        </div>
      )}

      <div className="action-block void-block">
        {!voidOpen ? (
          <button className="danger-btn" onClick={() => setVoidOpen(true)}>
            作废这份标本…
          </button>
        ) : (
          <>
            <label>
              <span>作废原因 *（必填，提交后释放柜位，原记录保留；采集号不可再分配）</span>
              <textarea
                rows={3}
                value={reason}
                placeholder="如：标本霉变损毁 / 采集信息缺失，不符合入库标准"
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <div className="inline-actions">
              <button
                className="danger-btn"
                onClick={() => {
                  if (onVoid(specimen.id, reason)) {
                    setReason("");
                    setVoidOpen(false);
                  }
                }}
              >
                确认作废
              </button>
              <button className="ghost" onClick={() => { setVoidOpen(false); setReason(""); }}>
                取消
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
