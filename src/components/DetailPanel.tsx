import { useState } from "react";
import type { PressingStatus, Specimen } from "../domain/types";
import { PRESSING_OPTIONS } from "../domain/types";
import { fmtDate, fmtElev, stateBadge } from "./format";

interface Props {
  specimen: Specimen | null;
  onAccept: (id: string) => void;
  onAssign: (id: string, slot: string) => boolean;
  onPressing: (id: string, pressing: PressingStatus) => void;
  onVoid: (id: string, reason: string) => boolean;
}

/** 单份标本详情：同一存档数据的只读视图 + 可用操作。 */
export function DetailPanel({ specimen, onAccept, onAssign, onPressing, onVoid }: Props) {
  if (!specimen) {
    return (
      <section className="panel detail">
        <div className="heading">
          <div>
            <p>单份详情</p>
            <h2>未选择标本</h2>
          </div>
        </div>
        <p className="empty">从入库队列、记录列表或柜位记录中选择一份标本，在此查看完整信息。</p>
      </section>
    );
  }

  const badge = stateBadge(specimen);
  const voided = specimen.status === "已作废";

  return (
    <section className="panel detail">
      <div className="heading">
        <div>
          <p>单份详情</p>
          <h2 className="mono">{specimen.collectionNo}</h2>
        </div>
        <span className={`badge ${badge.cls}`}>{badge.text}</span>
      </div>

      {voided && (
        <div className="void-banner">
          <strong>已作废：{specimen.voidReason}</strong>
          <small>
            作废于 {fmtDate(specimen.voidedAt)} · 柜位已释放 · 原记录保留，采集号 {specimen.collectionNo}{" "}
            不可再分配
          </small>
        </div>
      )}

      <dl className="field-list">
        <div>
          <dt>物种名称</dt>
          <dd>{specimen.speciesName}</dd>
        </div>
        <div>
          <dt>采集地点</dt>
          <dd>{specimen.location}</dd>
        </div>
        <div>
          <dt>海拔</dt>
          <dd>{fmtElev(specimen.elevation)}</dd>
        </div>
        <div>
          <dt>采集人</dt>
          <dd>{specimen.collector}</dd>
        </div>
        <div className="span-2">
          <dt>生境描述</dt>
          <dd>{specimen.habitat || "—"}</dd>
        </div>
        <div>
          <dt>馆藏柜位</dt>
          <dd className="mono">{specimen.slot ?? "未上柜"}</dd>
        </div>
        <div>
          <dt>鉴定状态</dt>
          <dd>{specimen.identification}</dd>
        </div>
        <div>
          <dt>登记时间</dt>
          <dd>{fmtDate(specimen.createdAt)}</dd>
        </div>
        <div>
          <dt>最近更新</dt>
          <dd>{fmtDate(specimen.updatedAt)}</dd>
        </div>
      </dl>

      {!voided && (
        <div className="detail-actions">
          <label>
            <span>压制状态</span>
            <select
              value={specimen.pressing}
              onChange={(e) => onPressing(specimen.id, e.target.value as PressingStatus)}
            >
              {PRESSING_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          {specimen.identification === "待鉴定" ? (
            <div className="action-block">
              <button className="primary" onClick={() => onAccept(specimen.id)}>
                接受鉴定
              </button>
              <small>鉴定接受后才能选柜位</small>
            </div>
          ) : (
            <SlotAssigner
              key={specimen.id}
              current={specimen.slot}
              onAssign={(slot) => onAssign(specimen.id, slot)}
            />
          )}

          <VoidBox key={`void-${specimen.id}`} onVoid={(reason) => onVoid(specimen.id, reason)} />
        </div>
      )}
    </section>
  );
}

/** 柜位登记/更换：被占用时规则层拒绝，输入保持原状。 */
function SlotAssigner({
  current,
  onAssign,
}: {
  current: string | null;
  onAssign: (slot: string) => boolean;
}) {
  const [slot, setSlot] = useState(current ?? "");
  return (
    <div className="action-block">
      <label>
        <span>{current ? "更换柜位" : "登记柜位"}</span>
        <div className="inline">
          <input
            className="mono"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            placeholder="如 B-12-06"
          />
          <button
            className="primary"
            onClick={() => {
              if (onAssign(slot)) setSlot("");
            }}
          >
            {current ? "更换" : "登记"}
          </button>
        </div>
      </label>
    </div>
  );
}

/** 作废：两步确认，必须填写原因。 */
function VoidBox({ onVoid }: { onVoid: (reason: string) => boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!open) {
    return (
      <button className="danger-ghost" onClick={() => setOpen(true)}>
        作废该记录
      </button>
    );
  }

  return (
    <div className="void-box">
      <label>
        <span>作废原因（必填）</span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="如：标本损毁、重复登记"
        />
      </label>
      <div className="inline">
        <button
          className="danger"
          onClick={() => {
            if (onVoid(reason)) {
              setReason("");
              setOpen(false);
            }
          }}
        >
          确认作废
        </button>
        <button onClick={() => setOpen(false)}>取消</button>
      </div>
      <small>作废后柜位立即释放，原记录保留，采集号不可再分配。</small>
    </div>
  );
}
