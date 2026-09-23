import type { Archive } from "../domain/types";

/**
 * 存档层：负责持久化与初始数据，不含登记规则、不含页面状态。
 * 读取失败或数据残缺时回退到种子存档，不抛错、不改写规则。
 */

const STORAGE_KEY = "hxyfront-62007:archive:v1";

export function seedArchive(): Archive {
  return {
    usedNumbers: ["HX-240615-01", "HX-240615-08", "HX-240616-03", "HX-240617-11", "HX-240618-02"],
    specimens: [
      {
        id: "seed-01",
        collectionNo: "HX-240615-01",
        speciesName: "槭属 Acer sp.",
        location: "云南·高黎贡山",
        elevation: 1420,
        habitat: "常绿阔叶林缘，溪边半阴处",
        collector: "李岚",
        pressing: "已压制",
        identification: "待鉴定",
        slot: null,
        status: "在册",
        voidReason: null,
        voidedAt: null,
        createdAt: "2024-06-15T02:30:00.000Z",
        updatedAt: "2024-06-15T02:30:00.000Z",
      },
      {
        id: "seed-02",
        collectionNo: "HX-240615-08",
        speciesName: "鳞毛蕨属 Dryopteris sp.",
        location: "云南·高黎贡山",
        elevation: 1650,
        habitat: "阴湿沟谷，岩壁苔藓丛生",
        collector: "王澍",
        pressing: "待压制",
        identification: "待鉴定",
        slot: null,
        status: "在册",
        voidReason: null,
        voidedAt: null,
        createdAt: "2024-06-15T09:10:00.000Z",
        updatedAt: "2024-06-15T09:10:00.000Z",
      },
      {
        id: "seed-03",
        collectionNo: "HX-240616-03",
        speciesName: "蒿属 Artemisia sp.",
        location: "四川·峨眉山",
        elevation: 890,
        habitat: "路旁灌丛，阳坡",
        collector: "李岚",
        pressing: "已压制",
        identification: "鉴定接受",
        slot: "B-12-04",
        status: "在册",
        voidReason: null,
        voidedAt: null,
        createdAt: "2024-06-16T03:20:00.000Z",
        updatedAt: "2024-06-18T01:00:00.000Z",
      },
      {
        id: "seed-04",
        collectionNo: "HX-240617-11",
        speciesName: "杜鹃花属 Rhododendron sp.",
        location: "四川·峨眉山",
        elevation: 2100,
        habitat: "亚高山灌丛，云雾带",
        collector: "陈默",
        pressing: "需补照",
        identification: "鉴定接受",
        slot: "B-12-05",
        status: "在册",
        voidReason: null,
        voidedAt: null,
        createdAt: "2024-06-17T07:45:00.000Z",
        updatedAt: "2024-06-19T08:20:00.000Z",
      },
      {
        id: "seed-05",
        collectionNo: "HX-240618-02",
        speciesName: "报春花属 Primula sp.",
        location: "云南·高黎贡山",
        elevation: 1880,
        habitat: "林下水边湿地",
        collector: "王澍",
        pressing: "已压制",
        identification: "待鉴定",
        slot: null, // 作废时已释放
        status: "已作废",
        voidReason: "标本霉变，无法继续保存",
        voidedAt: "2024-06-20T07:00:00.000Z",
        createdAt: "2024-06-18T06:40:00.000Z",
        updatedAt: "2024-06-20T07:00:00.000Z",
      },
    ],
  };
}

function isArchive(value: unknown): value is Archive {
  if (!value || typeof value !== "object") return false;
  const v = value as Archive;
  return Array.isArray(v.specimens) && Array.isArray(v.usedNumbers);
}

export function loadArchive(): Archive {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedArchive();
    const parsed: unknown = JSON.parse(raw);
    return isArchive(parsed) ? parsed : seedArchive();
  } catch {
    return seedArchive();
  }
}

export function saveArchive(archive: Archive): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(archive));
  } catch {
    // 存档写入失败时保持原状，不打断登记台操作
  }
}
