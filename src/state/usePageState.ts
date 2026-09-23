import { useState } from "react";
import type { DeskFilter } from "../domain/rules";

/**
 * 页面状态：筛选、选中、提示信息，与存档数据分开承载。
 */

export interface PageMessage {
  kind: "ok" | "error";
  text: string;
}

export function usePageState() {
  const [filter, setFilter] = useState<DeskFilter>("全部");
  const [location, setLocation] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<PageMessage | null>(null);

  const toggleLocation = (next: string) =>
    setLocation((current) => (current === next ? null : next));

  return {
    filter,
    setFilter,
    location,
    toggleLocation,
    clearLocation: () => setLocation(null),
    selectedId,
    setSelectedId,
    message,
    setMessage,
    clearMessage: () => setMessage(null),
  };
}
