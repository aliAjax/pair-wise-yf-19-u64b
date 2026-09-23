import { useCallback, useEffect, useRef, useState } from "react";
import type { RegistrationDraft, Registry, RuleContext, RuleResult } from "../domain/types";
import {
  acceptIdentification,
  assignSlot,
  registerSpecimen,
  relocateSpecimen,
  voidSpecimen,
} from "../domain/rules";
import { clearRegistry, loadRegistry, saveRegistry } from "../archive/storage";

/**
 * 页面状态层：唯一持有 registry 状态。
 * 登记规则全部委托给 domain 纯函数；存档由 archive 承担。
 * 规则不通过（{ ok: false }）时不调用 setState，页面保持原状并回传错误信息。
 */

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function stampNow(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface ActionNotice {
  tone: "success" | "error";
  text: string;
}

export function useRegistry() {
  const [registry, setRegistry] = useState<Registry>(() => loadRegistry());
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const noticeTimer = useRef<number | null>(null);

  useEffect(() => {
    saveRegistry(registry);
  }, [registry]);

  const flash = useCallback((next: ActionNotice) => {
    setNotice(next);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 3600);
  }, []);

  const apply = useCallback(
    (result: RuleResult, successText: string): boolean => {
      if (!result.ok) {
        flash({ tone: "error", text: result.error });
        return false;
      }
      setRegistry(result.registry);
      flash({ tone: "success", text: successText });
      return true;
    },
    [flash]
  );

  const ctx = useCallback((): RuleContext => ({ now: stampNow(), id: makeId }), []);

  const register = useCallback(
    (draft: RegistrationDraft) => apply(
      registerSpecimen(registry, draft, ctx()),
      `采集号 ${draft.collectionNo.trim()} 已登记，进入待鉴定队列`
    ),
    [registry, apply, ctx]
  );

  const accept = useCallback(
    (id: string, confirmedSpecies: string) =>
      apply(
        acceptIdentification(registry, id, confirmedSpecies, ctx()),
        "鉴定已接受，可以选择柜位"
      ),
    [registry, apply, ctx]
  );

  const assign = useCallback(
    (id: string, slot: string) =>
      apply(assignSlot(registry, id, slot, ctx()), `已上柜，柜位 ${slot.trim().toUpperCase()}`),
    [registry, apply, ctx]
  );

  const relocate = useCallback(
    (id: string, slot: string) =>
      apply(
        relocateSpecimen(registry, id, slot, ctx()),
        `已换位至 ${slot.trim().toUpperCase()}`
      ),
    [registry, apply, ctx]
  );

  const voidOne = useCallback(
    (id: string, reason: string) =>
      apply(voidSpecimen(registry, id, reason, ctx()), "标本已作废，原记录保留，柜位已释放"),
    [registry, apply, ctx]
  );

  const reset = useCallback(() => {
    setRegistry(clearRegistry());
    flash({ tone: "success", text: "存档已清空，恢复为初始示例数据" });
  }, [flash]);

  return { registry, notice, register, accept, assign, relocate, voidOne, reset };
}
