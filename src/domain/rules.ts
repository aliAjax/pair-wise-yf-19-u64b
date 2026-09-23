import type { Archive, PressingStatus, RegisterDraft, Result, Specimen } from "./types";
import { err, ok } from "./types";

/**
 * 登记规则层：纯函数，不碰存储、不碰页面状态。
 * 每个动作返回 Result<Archive>：成功给出新存档，失败时调用方保持原状。
 */

const normCode = (raw: string) => raw.trim().toUpperCase();
const normText = (raw: string) => raw.trim();

function replaceSpecimen(archive: Archive, next: Specimen): Archive {
  return {
    ...archive,
    specimens: archive.specimens.map((s) => (s.id === next.id ? next : s)),
  };
}

/** 登记：采集号查重后即入队（待鉴定），不允许直接带柜位。 */
export function registerSpecimen(
  archive: Archive,
  draft: RegisterDraft,
  now: string,
  id: string
): Result<Archive> {
  const collectionNo = normCode(draft.collectionNo);
  const speciesName = normText(draft.speciesName);
  const location = normText(draft.location);
  const collector = normText(draft.collector);
  const habitat = normText(draft.habitat);

  if (!collectionNo) return err("采集号不能为空");
  if (archive.usedNumbers.includes(collectionNo)) {
    return err(`采集号 ${collectionNo} 已使用过，用过的采集号不可再分配`);
  }
  if (!speciesName) return err("物种名称不能为空");
  if (!location) return err("采集地点不能为空");
  if (!collector) return err("采集人不能为空");

  let elevation: number | null = null;
  const rawElevation = draft.elevation.trim();
  if (rawElevation) {
    const parsed = Number(rawElevation);
    if (!Number.isFinite(parsed)) return err("海拔需为数字，可留空");
    elevation = Math.round(parsed);
  }

  const specimen: Specimen = {
    id,
    collectionNo,
    speciesName,
    location,
    elevation,
    habitat,
    collector,
    pressing: draft.pressing,
    identification: "待鉴定",
    slot: null,
    status: "在册",
    voidReason: null,
    voidedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  return ok({
    specimens: [...archive.specimens, specimen],
    usedNumbers: [...archive.usedNumbers, collectionNo],
  });
}

/** 鉴定接受：仅队列中（待鉴定）的在册标本可接受。 */
export function acceptIdentification(archive: Archive, id: string, now: string): Result<Archive> {
  const target = archive.specimens.find((s) => s.id === id);
  if (!target) return err("未找到该标本记录");
  if (target.status === "已作废") return err("已作废的记录不可再鉴定");
  if (target.identification !== "待鉴定") return err("仅待鉴定标本可接受鉴定");
  return ok(replaceSpecimen(archive, { ...target, identification: "鉴定接受", updatedAt: now }));
}

/** 登记/更换柜位：须鉴定接受；柜位被占用时拒绝，不覆盖已有记录。 */
export function assignSlot(archive: Archive, id: string, rawSlot: string, now: string): Result<Archive> {
  const target = archive.specimens.find((s) => s.id === id);
  if (!target) return err("未找到该标本记录");
  if (target.status === "已作废") return err("已作废的记录不可分配柜位");
  if (target.identification !== "鉴定接受") return err("鉴定接受后才能选柜位");

  const slot = normCode(rawSlot);
  if (!slot) return err("柜位不能为空");

  const occupant = archive.specimens.find(
    (s) => s.status === "在册" && s.slot === slot && s.id !== id
  );
  if (occupant) {
    return err(`柜位 ${slot} 已被 ${occupant.collectionNo}（${occupant.speciesName}）占用，请换位`);
  }

  return ok(replaceSpecimen(archive, { ...target, slot, updatedAt: now }));
}

/** 更新压制状态：仅在册标本可改。 */
export function updatePressing(
  archive: Archive,
  id: string,
  pressing: PressingStatus,
  now: string
): Result<Archive> {
  const target = archive.specimens.find((s) => s.id === id);
  if (!target) return err("未找到该标本记录");
  if (target.status === "已作废") return err("已作废的记录不可修改");
  if (target.pressing === pressing) return err("压制状态未变化，保持原状");
  return ok(replaceSpecimen(archive, { ...target, pressing, updatedAt: now }));
}

/** 作废：必须写原因；释放柜位；原记录保留，采集号留在 usedNumbers 中不回收。 */
export function voidSpecimen(archive: Archive, id: string, rawReason: string, now: string): Result<Archive> {
  const target = archive.specimens.find((s) => s.id === id);
  if (!target) return err("未找到该标本记录");
  if (target.status === "已作废") return err("该记录已作废，原记录保留");

  const reason = normText(rawReason);
  if (!reason) return err("作废必须填写原因");

  return ok(
    replaceSpecimen(archive, {
      ...target,
      status: "已作废",
      voidReason: reason,
      voidedAt: now,
      slot: null, // 释放柜位
      updatedAt: now,
    })
  );
}

/* ---------- 视图选择器：所有页面引用同一份存档数据 ---------- */

export type DeskFilter = "全部" | "待鉴定" | "待上柜" | "已上柜" | "已作废";
export const DESK_FILTERS: DeskFilter[] = ["全部", "待鉴定", "待上柜", "已上柜", "已作废"];

const byCreatedAsc = (a: Specimen, b: Specimen) => a.createdAt.localeCompare(b.createdAt);
const byCreatedDesc = (a: Specimen, b: Specimen) => b.createdAt.localeCompare(a.createdAt);

/** 入库队列：在册且待鉴定，按登记先后排列。 */
export function selectQueue(archive: Archive): Specimen[] {
  return archive.specimens
    .filter((s) => s.status === "在册" && s.identification === "待鉴定")
    .sort(byCreatedAsc);
}

function matchesFilter(s: Specimen, filter: DeskFilter): boolean {
  switch (filter) {
    case "待鉴定":
      return s.status === "在册" && s.identification === "待鉴定";
    case "待上柜":
      return s.status === "在册" && s.identification === "鉴定接受" && s.slot === null;
    case "已上柜":
      return s.status === "在册" && s.slot !== null;
    case "已作废":
      return s.status === "已作废";
    case "全部":
      return true;
  }
}

/** 鉴定状态筛选（可叠加地点条件），不含条件时返回空数组而非改动数据。 */
export function filterSpecimens(archive: Archive, filter: DeskFilter, location: string | null): Specimen[] {
  return archive.specimens
    .filter((s) => matchesFilter(s, filter) && (!location || s.location === location))
    .sort(byCreatedDesc);
}

export function countForFilter(archive: Archive, filter: DeskFilter): number {
  return archive.specimens.filter((s) => matchesFilter(s, filter)).length;
}

export interface LocationCard {
  location: string;
  total: number;
  queue: number;
  shelved: number;
  elevationMin: number | null;
  elevationMax: number | null;
  collectors: string[];
}

/** 采集地点信息卡：按地点聚合在册标本。 */
export function selectLocationCards(archive: Archive): LocationCard[] {
  const groups = new Map<string, Specimen[]>();
  for (const s of archive.specimens) {
    if (s.status !== "在册") continue;
    const list = groups.get(s.location) ?? [];
    list.push(s);
    groups.set(s.location, list);
  }
  return [...groups.entries()]
    .map(([location, list]) => {
      const elevations = list.map((s) => s.elevation).filter((e): e is number => e !== null);
      return {
        location,
        total: list.length,
        queue: list.filter((s) => s.identification === "待鉴定").length,
        shelved: list.filter((s) => s.slot !== null).length,
        elevationMin: elevations.length ? Math.min(...elevations) : null,
        elevationMax: elevations.length ? Math.max(...elevations) : null,
        collectors: [...new Set(list.map((s) => s.collector))],
      };
    })
    .sort((a, b) => b.total - a.total || a.location.localeCompare(b.location, "zh-Hans-CN"));
}

export interface SlotRecord {
  slot: string;
  specimenId: string;
  collectionNo: string;
  speciesName: string;
  location: string;
}

/** 柜位记录：在册且已上柜，按柜位排序。 */
export function selectSlotRecords(archive: Archive): SlotRecord[] {
  return archive.specimens
    .filter((s): s is Specimen & { slot: string } => s.status === "在册" && s.slot !== null)
    .map((s) => ({
      slot: s.slot,
      specimenId: s.id,
      collectionNo: s.collectionNo,
      speciesName: s.speciesName,
      location: s.location,
    }))
    .sort((a, b) => a.slot.localeCompare(b.slot));
}

export function findSpecimen(archive: Archive, id: string): Specimen | null {
  return archive.specimens.find((s) => s.id === id) ?? null;
}

export interface DeskMetrics {
  active: number;
  queue: number;
  shelved: number;
  locations: number;
  voided: number;
}

export function selectMetrics(archive: Archive): DeskMetrics {
  const active = archive.specimens.filter((s) => s.status === "在册");
  return {
    active: active.length,
    queue: active.filter((s) => s.identification === "待鉴定").length,
    shelved: active.filter((s) => s.slot !== null).length,
    locations: new Set(active.map((s) => s.location)).size,
    voided: archive.specimens.length - active.length,
  };
}
