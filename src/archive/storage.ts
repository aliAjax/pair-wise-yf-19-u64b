import type { Registry } from "../domain/types";
import { buildSeedRegistry } from "../domain/seed";

/**
 * 存档层：只负责序列化与读取 localStorage，不引用 React、不包含登记规则。
 * 与页面状态解耦：规则函数在状态层执行，这里只保存它们产出的 registry。
 */

const STORAGE_KEY = "herbarium-registry-v1";

export function loadRegistry(): Registry {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeedRegistry();
    const parsed = JSON.parse(raw) as unknown;
    if (!isRegistry(parsed)) return buildSeedRegistry();
    return parsed;
  } catch {
    return buildSeedRegistry();
  }
}

export function saveRegistry(registry: Registry): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  } catch {
    // 存储不可用时静默降级：页面状态仍在内存中可用
  }
}

export function clearRegistry(): Registry {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return buildSeedRegistry();
}

function isRegistry(value: unknown): value is Registry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { version?: unknown; specimens?: unknown };
  return v.version === 1 && Array.isArray(v.specimens);
}
