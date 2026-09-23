import { useState } from "react";
import type { RegisterDraft } from "../domain/types";
import { PRESSING_OPTIONS } from "../domain/types";

interface Props {
  onRegister: (draft: RegisterDraft) => boolean;
}

const emptyDraft: RegisterDraft = {
  collectionNo: "",
  speciesName: "",
  location: "",
  elevation: "",
  habitat: "",
  collector: "",
  pressing: "待压制",
};

/** 登记台：录入新标本。登记成功才清空表单，失败保持原状。 */
export function RegisterForm({ onRegister }: Props) {
  const [draft, setDraft] = useState<RegisterDraft>(emptyDraft);

  const set =
    (key: keyof RegisterDraft) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setDraft((d) => ({ ...d, [key]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRegister(draft)) setDraft(emptyDraft);
  };

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>馆藏登记台</p>
          <h2>新标本登记</h2>
        </div>
      </div>
      <form onSubmit={submit} className="field-grid">
        <label>
          <span>采集号 *（用过不可再分配）</span>
          <input
            className="mono"
            value={draft.collectionNo}
            onChange={set("collectionNo")}
            placeholder="如 HX-240620-01"
          />
        </label>
        <label>
          <span>物种名称 *</span>
          <input value={draft.speciesName} onChange={set("speciesName")} placeholder="如 槭属 Acer sp." />
        </label>
        <label>
          <span>采集地点 *</span>
          <input value={draft.location} onChange={set("location")} placeholder="如 云南·高黎贡山" />
        </label>
        <label>
          <span>海拔（m，可留空）</span>
          <input inputMode="numeric" value={draft.elevation} onChange={set("elevation")} placeholder="如 1420" />
        </label>
        <label>
          <span>采集人 *</span>
          <input value={draft.collector} onChange={set("collector")} placeholder="姓名" />
        </label>
        <label>
          <span>压制状态</span>
          <select value={draft.pressing} onChange={set("pressing")}>
            {PRESSING_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="span-2">
          <span>生境描述</span>
          <textarea rows={2} value={draft.habitat} onChange={set("habitat")} placeholder="植被类型、坡向、伴生种等" />
        </label>
        <div className="span-2 form-foot">
          <small>登记后先进入入库队列，鉴定接受后才能选柜位。</small>
          <button type="submit" className="primary">
            登记入队
          </button>
        </div>
      </form>
    </section>
  );
}
