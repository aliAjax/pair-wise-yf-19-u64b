// 馆藏柜位网格配置：柜区 A/B，列 01-12，层 01-04，共 96 个柜位。
// 柜位编码统一大写（如 A-03-02），规则层按编码判占。

export const CABINET_ZONES = ["A", "B"] as const;
export const CABINET_COLUMNS = 12;
export const CABINET_LAYERS = 4;

const pad2 = (n: number) => String(n).padStart(2, "0");

export const CABINET_SLOTS: readonly string[] = CABINET_ZONES.flatMap((zone) =>
  Array.from({ length: CABINET_COLUMNS }, (_, c) =>
    Array.from({ length: CABINET_LAYERS }, (_, l) => `${zone}-${pad2(c + 1)}-${pad2(l + 1)}`)
  ).flat()
);

export function normalizeSlot(raw: string): string {
  return raw.trim().toUpperCase();
}
