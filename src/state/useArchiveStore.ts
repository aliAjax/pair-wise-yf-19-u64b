import { useEffect, useState } from "react";
import type { Archive, PressingStatus, RegisterDraft, Result } from "../domain/types";
import * as rules from "../domain/rules";
import { loadArchive, saveArchive } from "../data/archive";

/**
 * 存档状态：持有唯一一份馆藏数据，动作全部委托给规则层。
 * 规则失败时不提交新存档 —— 条件不满足即保持原状。
 */

const now = () => new Date().toISOString();
const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `sp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function useArchiveStore() {
  const [archive, setArchive] = useState<Archive>(loadArchive);

  useEffect(() => {
    saveArchive(archive);
  }, [archive]);

  const commit = (result: Result<Archive>): Result<Archive> => {
    if (result.ok) setArchive(result.value);
    return result;
  };

  return {
    archive,
    register: (draft: RegisterDraft) => commit(rules.registerSpecimen(archive, draft, now(), genId())),
    acceptIdentification: (id: string) => commit(rules.acceptIdentification(archive, id, now())),
    assignSlot: (id: string, slot: string) => commit(rules.assignSlot(archive, id, slot, now())),
    updatePressing: (id: string, pressing: PressingStatus) =>
      commit(rules.updatePressing(archive, id, pressing, now())),
    voidSpecimen: (id: string, reason: string) => commit(rules.voidSpecimen(archive, id, reason, now())),
  };
}
