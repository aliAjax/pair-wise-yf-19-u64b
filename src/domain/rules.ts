import type {
  RegistrationDraft,
  Registry,
  RegistryEvent,
  RuleContext,
  RuleResult,
  Specimen,
} from "./types";
import { normalizeSlot } from "./cabinet";

/**
 * 登记规则层：全部是纯函数。
 * 不依赖 React、localStorage；入参 registry 永不被修改，只返回新 registry。
 * 任何前置条件不满足都返回 { ok: false, error }，调用方据此保持原状。
 */

const fail = (error: string): RuleResult => ({ ok: false, error });
const pass = (registry: Registry): RuleResult => ({ ok: true, registry });

const event = (ctx: RuleContext, kind: RegistryEvent["kind"], text: string): RegistryEvent => ({
  at: ctx.now,
  kind,
  text,
});

function withSpecimen(
  registry: Registry,
  id: string,
  patch: (s: Specimen) => Specimen
): Registry {
  return {
    ...registry,
    specimens: registry.specimens.map((s) => (s.id === id ? patch(s) : s)),
  };
}

/** 采集号是否曾被分配（作废记录同样占位，因此采集号不可复用） */
export function isCollectionNoTaken(registry: Registry, collectionNo: string): boolean {
  const key = collectionNo.trim();
  return registry.specimens.some((s) => s.collectionNo === key);
}

export function findSpecimen(registry: Registry, id: string): Specimen | null {
  return registry.specimens.find((s) => s.id === id) ?? null;
}

/** 柜位当前是否被已上柜标本占用（作废标本已释放柜位，不占柜） */
export function findSlotOccupant(
  registry: Registry,
  slot: string,
  exceptId?: string
): Specimen | null {
  const key = normalizeSlot(slot);
  return (
    registry.specimens.find(
      (s) => s.status === "stored" && s.slot === key && s.id !== exceptId
    ) ?? null
  );
}

/** 登记入队：采集号唯一校验；新标本一律先入待鉴定队列，柜位不能直接指定 */
export function registerSpecimen(
  registry: Registry,
  draft: RegistrationDraft,
  ctx: RuleContext
): RuleResult {
  const collectionNo = draft.collectionNo.trim();
  if (!collectionNo) return fail("采集号不能为空");
  if (isCollectionNoTaken(registry, collectionNo))
    return fail(`采集号 ${collectionNo} 已分配（含作废记录），不可再次使用`);
  if (!draft.species.trim()) return fail("物种名称不能为空");
  if (!draft.place.trim()) return fail("采集地点不能为空");
  if (!draft.collectors.trim()) return fail("采集人不能为空");

  const elevationRaw = draft.elevation.trim();
  let elevation: number | null = null;
  if (elevationRaw) {
    const n = Number(elevationRaw);
    if (!Number.isFinite(n) || n < 0) return fail("海拔必须是非负数字（米）");
    elevation = Math.round(n);
  }

  const id = ctx.id();
  const specimen: Specimen = {
    id,
    collectionNo,
    species: draft.species.trim(),
    confirmedSpecies: null,
    place: draft.place.trim(),
    elevation,
    habitat: draft.habitat.trim(),
    collectors: draft.collectors.trim(),
    pressed: draft.pressed,
    status: "queued",
    slot: null,
    voidReason: null,
    createdAt: ctx.now,
    history: [event(ctx, "register", `登记入队，采集号 ${collectionNo}`)],
  };
  return pass({ ...registry, specimens: [specimen, ...registry.specimens] });
}

/** 鉴定接受：只有待鉴定标本可以接受；接受时记录定名 */
export function acceptIdentification(
  registry: Registry,
  id: string,
  confirmedSpecies: string,
  ctx: RuleContext
): RuleResult {
  const target = findSpecimen(registry, id);
  if (!target) return fail("标本不存在");
  if (target.status === "void") return fail("已作废标本不能再鉴定");
  if (target.status !== "queued") return fail("仅待鉴定标本可以接受鉴定");
  const name = confirmedSpecies.trim();
  if (!name) return fail("鉴定接受必须填写定名");

  return pass(
    withSpecimen(registry, id, (s) => ({
      ...s,
      status: "accepted",
      confirmedSpecies: name,
      history: [
        ...s.history,
        event(ctx, "accept", `鉴定接受，定名：${name}`),
      ],
    }))
  );
}

/** 选择柜位（上柜）：仅鉴定接受后的标本可选；柜位被占则提示换位，绝不覆盖 */
export function assignSlot(
  registry: Registry,
  id: string,
  rawSlot: string,
  ctx: RuleContext
): RuleResult {
  const target = findSpecimen(registry, id);
  if (!target) return fail("标本不存在");
  if (target.status === "void") return fail("已作废标本不能上柜");
  if (target.status === "queued") return fail("标本尚待鉴定，鉴定接受后才能选择柜位");
  if (target.status === "stored") return fail("标本已在柜中，请使用换位操作");

  const slot = normalizeSlot(rawSlot);
  if (!slot) return fail("请选择柜位");
  const occupant = findSlotOccupant(registry, slot);
  if (occupant)
    return fail(`柜位 ${slot} 已被 ${occupant.collectionNo}（${displayName(occupant)}）占用，请选择其他柜位`);

  return pass(
    withSpecimen(registry, id, (s) => ({
      ...s,
      status: "stored",
      slot,
      history: [...s.history, event(ctx, "assign", `上柜，柜位 ${slot}`)],
    }))
  );
}

/** 换位：柜位被占则提示换位，不能覆盖已有记录 */
export function relocateSpecimen(
  registry: Registry,
  id: string,
  rawSlot: string,
  ctx: RuleContext
): RuleResult {
  const target = findSpecimen(registry, id);
  if (!target) return fail("标本不存在");
  if (target.status !== "stored") return fail("只有已上柜标本可以换位");

  const slot = normalizeSlot(rawSlot);
  if (!slot) return fail("请选择柜位");
  if (slot === target.slot) return fail("新柜位与当前柜位相同");

  const occupant = findSlotOccupant(registry, slot, id);
  if (occupant)
    return fail(`柜位 ${slot} 已被 ${occupant.collectionNo}（${displayName(occupant)}）占用，请选择其他柜位`);

  const previous = target.slot;
  return pass(
    withSpecimen(registry, id, (s) => ({
      ...s,
      slot,
      history: [...s.history, event(ctx, "assign", `换位：${previous} → ${slot}`)],
    }))
  );
}

/** 作废：必须写原因；作废后释放柜位，原记录（含历史）保留 */
export function voidSpecimen(
  registry: Registry,
  id: string,
  reason: string,
  ctx: RuleContext
): RuleResult {
  const target = findSpecimen(registry, id);
  if (!target) return fail("标本不存在");
  if (target.status === "void") return fail("标本已经作废");
  const why = reason.trim();
  if (!why) return fail("作废必须填写原因");

  const freed = target.status === "stored" ? target.slot : null;
  return pass(
    withSpecimen(registry, id, (s) => ({
      ...s,
      status: "void",
      slot: null,
      voidReason: why,
      history: [
        ...s.history,
        event(
          ctx,
          "void",
          freed
            ? `作废：${why}；释放柜位 ${freed}`
            : `作废：${why}`
        ),
      ],
    }))
  );
}

/** 页面各视图统一引用的物种名：优先鉴定定名，其次登记名 */
export function displayName(s: Specimen): string {
  return s.confirmedSpecies ?? s.species;
}
