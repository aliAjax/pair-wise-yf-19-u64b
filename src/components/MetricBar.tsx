import type { RegistryMetrics } from "../domain/selectors";

const ITEMS: { key: keyof RegistryMetrics; label: string; hint: string }[] = [
  { key: "queued", label: "待鉴定", hint: "在鉴定队列中" },
  { key: "accepted", label: "待上柜", hint: "鉴定已接受" },
  { key: "stored", label: "已上柜", hint: "占用柜位" },
  { key: "sites", label: "采集点", hint: "有效标本地点数" },
];

export function MetricBar({ metrics }: { metrics: RegistryMetrics }) {
  return (
    <section className="metrics">
      {ITEMS.map((item) => (
        <article key={item.key}>
          <small>{item.label}</small>
          <strong>{metrics[item.key]}</strong>
          <em>{item.hint}</em>
        </article>
      ))}
    </section>
  );
}
