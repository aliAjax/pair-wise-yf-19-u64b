// 馆藏登记的领域模型。登记规则、存档、页面状态三层共用这些类型。

export type LifeStatus = "queued" | "accepted" | "stored" | "void";

export interface RegistryEvent {
  at: string;
  kind: "register" | "accept" | "assign" | "void";
  text: string;
}

export interface Specimen {
  id: string;
  /** 采集号：一经分配（含作废）永远不可再次使用 */
  collectionNo: string;
  /** 登记时填写的物种名称（可能是“待定”） */
  species: string;
  /** 鉴定接受后的定名，未鉴定为 null */
  confirmedSpecies: string | null;
  /** 采集地点 */
  place: string;
  /** 海拔（米），未填为 null */
  elevation: number | null;
  /** 生境描述 */
  habitat: string;
  /** 采集人 */
  collectors: string;
  /** 压制状态：true=已压制，false=待压制 */
  pressed: boolean;
  /** queued 待鉴定 / accepted 鉴定接受待上柜 / stored 已上柜 / void 已作废 */
  status: LifeStatus;
  /** 馆藏柜位，仅 stored 持有；作废后释放为 null */
  slot: string | null;
  /** 作废原因，原记录保留但不再参与业务 */
  voidReason: string | null;
  createdAt: string;
  history: RegistryEvent[];
}

export interface Registry {
  version: 1;
  specimens: Specimen[];
}

export interface RegistrationDraft {
  collectionNo: string;
  species: string;
  place: string;
  elevation: string;
  habitat: string;
  collectors: string;
  pressed: boolean;
}

export interface RuleContext {
  now: string;
  id: () => string;
}

export type RuleResult =
  | { ok: true; registry: Registry }
  | { ok: false; error: string };
