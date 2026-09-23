import { useState } from "react";
import type { RegistrationDraft } from "../domain/types";

interface Props {
  takenNos: string[];
  onSubmit: (draft: RegistrationDraft) => boolean;
}

const EMPTY: RegistrationDraft = {
  collectionNo: "",
  species: "",
  place: "",
  elevation: "",
  habitat: "",
  collectors: "",
  pressed: false,
};

/**
 * 新增登记：采集号失焦即查重（作废记录也占用采集号）。
 * 提交成功由状态层返回 true 后清空；规则不满足时表单内容保持原状。
 */
export function RegistrationForm({ takenNos, onSubmit }: Props) {
  const [draft, setDraft] = useState<RegistrationDraft>(EMPTY);
  const [dupWarn, setDupWarn] = useState<string | null>(null);

  const patch = <K extends keyof RegistrationDraft>(key: K, value: RegistrationDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (key === "collectionNo") setDupWarn(null);
  };

  const checkDuplicate = () => {
    const no = draft.collectionNo.trim();
    if (no && takenNos.includes(no)) {
      setDupWarn(`采集号 ${no} 已分配过（含作废记录），不可再次使用`);
    } else {
      setDupWarn(null);
    }
  };

  const submit = () => {
    if (onSubmit(draft)) {
      setDraft(EMPTY);
      setDupWarn(null);
    }
  };

  const elevationInvalid = draft.elevation.trim() !== "" &&
    (!Number.isFinite(Number(draft.elevation)) || Number(draft.elevation) < 0);

  return (
    <section className="panel form-panel">
      <div className="heading">
        <div>
          <p>馆藏登记台</p>
          <h2>新标本登记入队</h2>
        </div>
        <span className="rule-note">新登记一律先进待鉴定队列，鉴定接受后才能选柜位</span>
      </div>

      <div className="field-grid">
        <label className={dupWarn ? "field-error" : ""}>
          <span>采集号 *（一经分配不可复用）</span>
          <input
            value={draft.collectionNo}
            placeholder="如 HX-260923-01"
            onChange={(e) => patch("collectionNo", e.target.value)}
            onBlur={checkDuplicate}
          />
          {dupWarn && <small className="warn-text">{dupWarn}</small>}
        </label>

        <label>
          <span>物种名称 / 类群 *</span>
          <input
            value={draft.species}
            placeholder="可填待定类群，如 槭属待定"
            onChange={(e) => patch("species", e.target.value)}
          />
        </label>

        <label>
          <span>采集地点 *</span>
          <input
            value={draft.place}
            placeholder="如 天目山三里亭沟谷"
            onChange={(e) => patch("place", e.target.value)}
          />
        </label>

        <label className={elevationInvalid ? "field-error" : ""}>
          <span>海拔（米）</span>
          <input
            value={draft.elevation}
            inputMode="numeric"
            placeholder="如 1420"
            onChange={(e) => patch("elevation", e.target.value)}
          />
          {elevationInvalid && <small className="warn-text">海拔必须是非负数字</small>}
        </label>

        <label>
          <span>采集人 *</span>
          <input
            value={draft.collectors}
            placeholder="多人用 / 分隔"
            onChange={(e) => patch("collectors", e.target.value)}
          />
        </label>

        <label>
          <span>生境描述</span>
          <input
            value={draft.habitat}
            placeholder="如 落叶阔叶林下阴坡"
            onChange={(e) => patch("habitat", e.target.value)}
          />
        </label>

        <label className="check-label">
          <span>压制状态</span>
          <div className="check-row">
            <input
              id="pressed-check"
              type="checkbox"
              checked={draft.pressed}
              onChange={(e) => patch("pressed", e.target.checked)}
            />
            <label htmlFor="pressed-check" className="inline-check">
              {draft.pressed ? "已压制" : "待压制"}
            </label>
          </div>
        </label>
      </div>

      <div className="form-actions">
        <button className="primary" onClick={submit}>
          登记并入队
        </button>
        <button
          className="ghost"
          onClick={() => {
            setDraft(EMPTY);
            setDupWarn(null);
          }}
        >
          清空表单
        </button>
      </div>
    </section>
  );
}
