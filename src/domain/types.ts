export type PressingStatus = "待压制" | "已压制" | "需补照";
export type Identification = "待鉴定" | "鉴定接受";
export type SpecimenStatus = "在册" | "已作废";

export const PRESSING_OPTIONS: PressingStatus[] = ["待压制", "已压制", "需补照"];

export interface Specimen {
  id: string;
  collectionNo: string; // 采集号：一经登记永不回收
  speciesName: string;
  location: string;
  elevation: number | null;
  habitat: string;
  collector: string;
  pressing: PressingStatus;
  identification: Identification;
  slot: string | null; // 馆藏柜位，鉴定接受后才可登记
  status: SpecimenStatus;
  voidReason: string | null;
  voidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Archive {
  specimens: Specimen[];
  usedNumbers: string[]; // 所有使用过的采集号（含已作废），不可再分配
}

export interface RegisterDraft {
  collectionNo: string;
  speciesName: string;
  location: string;
  elevation: string; // 表单原始输入，规则层负责解析
  habitat: string;
  collector: string;
  pressing: PressingStatus;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = (error: string): Result<never> => ({ ok: false, error });
