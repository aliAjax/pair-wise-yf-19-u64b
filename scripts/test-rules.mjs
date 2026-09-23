import { buildSeedRegistry } from "../src/domain/seed.ts";
import {
  acceptIdentification,
  assignSlot,
  findSpecimen,
  isCollectionNoTaken,
  registerSpecimen,
  relocateSpecimen,
  voidSpecimen,
} from "../src/domain/rules.ts";
import { selectCabinet, selectSiteCards, computeMetrics } from "../src/domain/selectors.ts";

const ctx = () => ({ now: "2026-09-23 12:00", id: () => `t-${Math.random().toString(36).slice(2, 8)}` });
let pass = 0, fail = 0;
const check = (name, cond) => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}`); }
};

let r = buildSeedRegistry();

// 1. 采集号唯一：已有号（含作废）不可再分配
check("已分配采集号被判占用", isCollectionNoTaken(r, "HX-240615-01"));
check("作废采集号同样占用不可复用", isCollectionNoTaken(r, "HX-240614-05"));
const dup = registerSpecimen(r, { collectionNo: "HX-240615-01", species: "x", place: "y", elevation: "", habitat: "", collectors: "z", pressed: true }, ctx());
check("重复采集号注册被拒绝", dup.ok === false);
check("拒绝后 registry 保持原状（数量不变）", dup.ok === false && r.specimens.length === 6);

// 2. 新登记进入待鉴定队列，无柜位
const reg = registerSpecimen(r, { collectionNo: "HX-260923-99", species: "测试草本", place: "测试地点", elevation: "800", habitat: "路边", collectors: "测试员", pressed: false }, ctx());
check("合法登记成功", reg.ok === true);
if (reg.ok) {
  r = reg.registry;
  const sp = findSpecimen(r, r.specimens[0].id);
  check("新标本状态为 queued", sp.status === "queued");
  check("新标本无柜位", sp.slot === null);
}

// 3. 待鉴定不能直接上柜
const queuedId = r.specimens.find(s => s.collectionNo === "HX-260923-99").id;
const earlyAssign = assignSlot(r, queuedId, "A-01-01", ctx());
check("未鉴定标本上柜被拒绝", earlyAssign.ok === false);

// 4. 鉴定接受缺定名被拒
const noName = acceptIdentification(r, queuedId, "  ", ctx());
check("鉴定接受缺定名被拒绝", noName.ok === false);
const acc = acceptIdentification(r, queuedId, "测试学名", ctx());
check("鉴定接受成功", acc.ok === true);
if (acc.ok) r = acc.registry;

// 5. 占用柜位不能覆盖（A-03-02 被 seed-4 占用）
const conflict = assignSlot(r, queuedId, "a-03-02", ctx());
check("占用柜位上柜被拒绝并提示换位（小写也归一化）", conflict.ok === false && conflict.error.includes("占用"));
check("冲突时占用方记录未被覆盖", findSpecimen(r, "seed-4").slot === "A-03-02");
const okAssign = assignSlot(r, queuedId, "A-01-01", ctx());
check("空闲柜位上柜成功", okAssign.ok === true);
if (okAssign.ok) r = okAssign.registry;

// 6. 换位到占用柜位被拒
const rel = relocateSpecimen(r, queuedId, "B-12-04", ctx());
check("换位到已占用柜位被拒绝", rel.ok === false);
const relOk = relocateSpecimen(r, queuedId, "A-01-02", ctx());
check("换位到空闲柜位成功", relOk.ok === true);
if (relOk.ok) r = relOk.registry;
check("换位后原柜位释放", selectCabinet(r).find(c => c.code === "A-01-01").occupant === null);

// 7. 作废必须写原因
const noReason = voidSpecimen(r, queuedId, "   ", ctx());
check("无原因作废被拒绝", noReason.ok === false);
const before = findSpecimen(r, queuedId);
const voided = voidSpecimen(r, queuedId, "霉变损毁", ctx());
check("有原因作废成功", voided.ok === true);
if (voided.ok) r = voided.registry;
const after = findSpecimen(r, queuedId);
check("作废后状态为 void", after.status === "void");
check("作废后柜位释放", after.slot === null);
check("作废原因已记录", after.voidReason === "霉变损毁");
check("原记录与历史保留", after.history.length === before.history.length + 1 && after.collectionNo === "HX-260923-99");
check("作废后采集号仍不可分配", isCollectionNoTaken(r, "HX-260923-99"));
check("释放的柜位回到空闲", selectCabinet(r).find(c => c.code === "A-01-02").occupant === null);
check("作废标本不可再次鉴定", acceptIdentification(r, queuedId, "x", ctx()).ok === false);

// 8. 单一数据源：指标/地点卡/柜位全部来自同一 registry
const m = computeMetrics(r);
check("指标计数正确（queued=2 accepted=1 stored=2 void=2）",
  m.queued === 2 && m.accepted === 1 && m.stored === 2 && m.void === 2);
const sites = selectSiteCards(r);
check("地点卡不含作废标本地点聚合异常（作废标本地点仍可被有效标本共享）", sites.every(c => c.specimens.every(s => s.status !== "void")));

// 9. 海拔非法值
const bad = registerSpecimen(buildSeedRegistry(), { collectionNo: "X-1", species: "a", place: "b", elevation: "-5", habitat: "", collectors: "c", pressed: true }, ctx());
check("负海拔被拒绝", bad.ok === false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
