import { useMemo, useState } from "react";
import "./styles.css";
import { useRegistry } from "./state/useRegistry";
import { findSpecimen } from "./domain/rules";
import { computeMetrics } from "./domain/selectors";
import { MetricBar } from "./components/MetricBar";
import { RegistrationForm } from "./components/RegistrationForm";
import { QueuePanel } from "./components/QueuePanel";
import { SiteCards } from "./components/SiteCards";
import { CabinetBoard } from "./components/CabinetBoard";
import { SpecimenDetail } from "./components/SpecimenDetail";
import { Toast } from "./components/Toast";

type Tab = "queue" | "sites" | "cabinet";

const TABS: { value: Tab; label: string }[] = [
  { value: "queue", label: "入库队列 / 鉴定筛选" },
  { value: "sites", label: "采集地点卡" },
  { value: "cabinet", label: "馆藏柜位记录" },
];

function App() {
  const { registry, notice, register, accept, assign, relocate, voidOne, reset } =
    useRegistry();
  const [tab, setTab] = useState<Tab>("queue");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const metrics = useMemo(() => computeMetrics(registry), [registry]);
  const selected = selectedId ? findSpecimen(registry, selectedId) : null;
  const takenNos = useMemo(() => registry.specimens.map((s) => s.collectionNo), [registry]);

  const openDetail = (id: string) => {
    setSelectedId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="app">
      <Toast notice={notice} />

      <section className="hero">
        <div className="hero-row">
          <p>植物标本馆 · 馆藏登记台</p>
          <button className="ghost reset-btn" onClick={reset}>
            清空存档并恢复示例
          </button>
        </div>
        <h1>压制标本入库管理</h1>
        <span>
          采集号一经分配即永久占用，作废须写明原因并释放柜位、原记录保留；待鉴定标本先入队，
          鉴定接受后方可上柜，柜位被占用时提示换位，任何记录都不会被覆盖。
        </span>
        <ul className="rule-strip">
          <li>登记规则（纯函数）</li>
          <li>存档（localStorage）</li>
          <li>页面状态（React）分层承载</li>
        </ul>
      </section>

      <MetricBar metrics={metrics} />

      {selected ? (
        <SpecimenDetail
          registry={registry}
          specimen={selected}
          onBack={() => setSelectedId(null)}
          onAccept={accept}
          onAssign={assign}
          onRelocate={relocate}
          onVoid={voidOne}
        />
      ) : (
        <>
          <RegistrationForm takenNos={takenNos} onSubmit={register} />

          <nav className="tabs" aria-label="馆藏视图切换">
            {TABS.map((t) => (
              <button
                key={t.value}
                className={tab === t.value ? "tab-on" : ""}
                onClick={() => setTab(t.value)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {tab === "queue" && (
            <QueuePanel registry={registry} selectedId={selectedId} onOpen={openDetail} />
          )}
          {tab === "sites" && <SiteCards registry={registry} onOpen={openDetail} />}
          {tab === "cabinet" && <CabinetBoard registry={registry} onOpen={openDetail} />}
        </>
      )}

      <footer className="app-footer">
        队列、鉴定筛选、采集地点卡、柜位记录与单份详情引用同一份馆藏数据 ·
        条件不满足时操作被拒绝，界面保持原状
      </footer>
    </main>
  );
}

export default App;
