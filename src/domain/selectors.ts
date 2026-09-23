// 只读派生：鉴定筛选、指标、采集地点卡、柜位占用、单份详情全部从同一份 registry 计算。
// 视图层不各自保存筛选结果副本，保证“引用同一份数据”。

import type { LifeStatus, Registry, Specimen } from "./types";
import { CABINET_SLOTS, CABINET_COLUMNS, CABINET_LAYERS, CABINET_ZONES } from "./cabinet";
import { displayName } from "./rules";

export interface StatusMeta {
  label: string;
  tone: "queued" | "accepted" | "stored" | "void";
}

export const STATUS_META: Record<LifeStatus, StatusMeta> = {
  queued: { label: "待鉴定", tone: "queued" },
  accepted: { label: "鉴定接受·待上柜", tone: "accepted" },
  stored: { label: "已上柜", tone: "stored" },
  void: { label: "已作废", tone: "void" },
};

export type IdFilter = "queued" | "accepted" | "stored" | "void" | "all";

export const ID_FILTERS: { value: IdFilter; label: string }[] = [
  { value: "all", label: "全部状态" },
  { value: "queued", label: "待鉴定" },
  { value: "accepted", label: "鉴定接受" },
  { value: "stored", label: "已上柜" },
  { value: "void", label: "已作废" },
];

export function filterSpecimens(registry: Registry, filter: IdFilter): Specimen[] {
  if (filter === "all") return registry.specimens;
  return registry.specimens.filter((s) => s.status === filter);
}

export interface RegistryMetrics {
  queued: number;
  accepted: number;
  stored: number;
  void: number;
  sites: number;
  occupancyRate: number;
}

export function computeMetrics(registry: Registry): RegistryMetrics {
  const by = (st: LifeStatus) => registry.specimens.filter((s) => s.status === st).length;
  const stored = by("stored");
  const sites = new Set(
    registry.specimens
      .filter((s) => s.status !== "void")
      .map((s) => s.place.trim())
      .filter(Boolean)
  ).size;
  return {
    queued: by("queued"),
    accepted: by("accepted"),
    stored,
    void: by("void"),
    sites,
    occupancyRate: CABINET_SLOTS.length ? stored / CABINET_SLOTS.length : 0,
  };
}

export interface SiteCard {
  place: string;
  count: number;
  elevations: number[];
  specimens: Specimen[];
}

/** 采集地点卡：按地点聚合有效标本（作废标本不参与馆藏地点统计） */
export function selectSiteCards(registry: Registry): SiteCard[] {
  const map = new Map<string, Specimen[]>();
  for (const s of registry.specimens) {
    if (s.status === "void") continue;
    const place = s.place.trim();
    if (!place) continue;
    const list = map.get(place) ?? [];
    list.push(s);
    map.set(place, list);
  }
  return [...map.entries()]
    .map(([place, specimens]) => ({
      place,
      count: specimens.length,
      elevations: specimens
        .map((s) => s.elevation)
        .filter((n): n is number => n !== null)
        .sort((a, b) => a - b),
      specimens,
    }))
    .sort((a, b) => b.count - a.count || a.place.localeCompare(b.place, "zh-Hans-CN"));
}

export interface SlotCell {
  code: string;
  occupant: Specimen | null;
}

/** 柜位记录：逐格反映占用情况；作废释放后格子自动回到空闲 */
export function selectCabinet(registry: Registry): SlotCell[] {
  const bySlot = new Map<string, Specimen>();
  for (const s of registry.specimens) {
    if (s.status === "stored" && s.slot) bySlot.set(s.slot, s);
  }
  return CABINET_SLOTS.map((code) => ({ code, occupant: bySlot.get(code) ?? null }));
}

export const CABINET_LAYOUT = { zones: CABINET_ZONES, columns: CABINET_COLUMNS, layers: CABINET_LAYERS };

export function nextPendingSlot(registry: Registry, avoid?: string): string | null {
  const cells = selectCabinet(registry);
  const free = cells.find((c) => !c.occupant && c.code !== (avoid ?? ""));
  return free ? free.code : null;
}

export { displayName };
