import "./styles.css";
import type { Result } from "./domain/types";
import type { Archive, PressingStatus, RegisterDraft } from "./domain/types";
import {
  countForFilter,
  filterSpecimens,
  findSpecimen,
  selectLocationCards,
  selectMetrics,
  selectQueue,
  selectSlotRecords,
  DESK_FILTERS,
} from "./domain/rules";
import { useArchiveStore } from "./state/useArchiveStore";
import { usePageState } from "./state/usePageState";
import { RegisterForm } from "./components/RegisterForm";
import { QueuePanel } from "./components/QueuePanel";
import { SpecimenList } from "./components/SpecimenList";
import { LocationCards } from "./components/LocationCards";
import { SlotBoard } from "./components/SlotBoard";
import { DetailPanel } from "./components/DetailPanel";

function App() {
  // 三层分开承载：规则（domain）· 存档（data）· 页面状态（state）
  const store = useArchiveStore();
  const page = usePageState();
  const { archive } = store;

  // 所有视图引用同一份存档数据
  const metrics = selectMetrics(archive);
  const queue = selectQueue(archive);
  const specimens = filterSpecimens(archive, page.filter, page.location);
  const counts = Object.fromEntries(
    DESK_FILTERS.map((f) => [f, countForFilter(archive, f)])
  ) as Record<(typeof DESK_FILTERS)[number], number>;
  const locationCards = selectLocationCards(archive);
  const slotRecords = selectSlotRecords(archive);
  const selected = page.selectedId ? findSpecimen(archive, page.selectedId) : null;

  // 规则失败时不提交新存档，仅提示原因 —— 条件不满足，保持原状
  const notify = (result: Result<Archive>, okText: string): boolean => {
    page.setMessage(result.ok ? { kind: "ok", text: okText } : { kind: "error", text: result.error });
    return result.ok;
  };

  const handleRegister = (draft: RegisterDraft) =>
    notify(store.register(draft), `采集号 ${draft.collectionNo.trim().toUpperCase()} 已入队，等待鉴定`);

  const handleAccept = (id: string) =>
    notify(store.acceptIdentification(id), "鉴定已接受，现在可以登记柜位");

  const handleAssign = (id: string, slot: string) =>
    notify(store.assignSlot(id, slot), `柜位 ${slot.trim().toUpperCase()} 已登记`);

  const handlePressing = (id: string, pressing: PressingStatus) =>
    notify(store.updatePressing(id, pressing), `压制状态已更新为「${pressing}」`);

  const handleVoid = (id: string, reason: string) =>
    notify(store.voidSpecimen(id, reason), "记录已作废：柜位已释放，原记录保留");

  return (
    <main className="app">
      <header className="hero">
        <p>植物标本馆 · 馆藏登记台</p>
        <h1>压制标本入库登记</h1>
        <span>
          登记后先入队，鉴定接受后再选柜位；采集号用过不再分配，作废须写原因并保留原记录；
          柜位被占用时提示换位，不覆盖已有记录。
        </span>
      </header>

      <section className="metrics">
        <article>
          <small>在册标本</small>
          <strong>{metrics.active}</strong>
        </article>
        <article>
          <small>入库队列</small>
          <strong>{metrics.queue}</strong>
        </article>
        <article>
          <small>已上柜</small>
          <strong>{metrics.shelved}</strong>
        </article>
        <article>
          <small>采集点</small>
          <strong>{metrics.locations}</strong>
        </article>
        <article>
          <small>已作废</small>
          <strong>{metrics.voided}</strong>
        </article>
      </section>

      {page.message && (
        <div className={`notice ${page.message.kind}`} role="status">
          <span>{page.message.text}</span>
          <button onClick={page.clearMessage} aria-label="关闭提示">
            ×
          </button>
        </div>
      )}

      <div className="desk-grid">
        <div className="desk-col">
          <RegisterForm onRegister={handleRegister} />
          <QueuePanel queue={queue} onAccept={handleAccept} onSelect={page.setSelectedId} />
        </div>
        <DetailPanel
          specimen={selected}
          onAccept={handleAccept}
          onAssign={handleAssign}
          onPressing={handlePressing}
          onVoid={handleVoid}
        />
      </div>

      <SpecimenList
        specimens={specimens}
        filter={page.filter}
        counts={counts}
        location={page.location}
        selectedId={page.selectedId}
        onFilter={page.setFilter}
        onClearLocation={page.clearLocation}
        onSelect={page.setSelectedId}
      />

      <LocationCards cards={locationCards} active={page.location} onToggle={page.toggleLocation} />

      <SlotBoard records={slotRecords} onSelect={page.setSelectedId} />
    </main>
  );
}

export default App;
