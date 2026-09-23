import type { Registry, Specimen } from "./types";

// 首次启动的示例馆藏：覆盖待鉴定、已鉴定待上柜、已上柜、作废四种状态。
const t = "2026-09-";

function s(partial: Specimen): Specimen {
  return partial;
}

export function buildSeedRegistry(): Registry {
  const specimens: Specimen[] = [
    s({
      id: "seed-1",
      collectionNo: "HX-240615-01",
      species: "槭属待定",
      confirmedSpecies: null,
      place: "天目山三里亭沟谷",
      elevation: 1420,
      habitat: "落叶阔叶林下阴坡，溪旁",
      collectors: "林知远 / 何小满",
      pressed: true,
      status: "queued",
      slot: null,
      voidReason: null,
      createdAt: `${t}01 09:12`,
      history: [{ at: `${t}01 09:12`, kind: "register", text: "登记入队，采集号 HX-240615-01" }],
    }),
    s({
      id: "seed-2",
      collectionNo: "HX-240615-08",
      species: "蕨类",
      confirmedSpecies: "华东蹄盖蕨",
      place: "天目山三里亭沟谷",
      elevation: 1380,
      habitat: "阴湿沟谷石缝",
      collectors: "何小满",
      pressed: true,
      status: "accepted",
      slot: null,
      voidReason: null,
      createdAt: `${t}01 09:40`,
      history: [
        { at: `${t}01 09:40`, kind: "register", text: "登记入队，采集号 HX-240615-08" },
        { at: `${t}10 14:05`, kind: "accept", text: "鉴定接受，定名：华东蹄盖蕨" },
      ],
    }),
    s({
      id: "seed-3",
      collectionNo: "HX-240616-03",
      species: "菊科",
      confirmedSpecies: "天目山菊",
      place: "天目山仙人顶草甸",
      elevation: 1506,
      habitat: "山顶灌草丛",
      collectors: "林知远",
      pressed: true,
      status: "stored",
      slot: "B-12-04",
      voidReason: null,
      createdAt: `${t}02 08:20`,
      history: [
        { at: `${t}02 08:20`, kind: "register", text: "登记入队，采集号 HX-240616-03" },
        { at: `${t}08 11:02`, kind: "accept", text: "鉴定接受，定名：天目山菊" },
        { at: `${t}11 16:30`, kind: "assign", text: "上柜，柜位 B-12-04" },
      ],
    }),
    s({
      id: "seed-4",
      collectionNo: "HX-240616-07",
      species: "壳斗科",
      confirmedSpecies: "短柄枹栎",
      place: "天目山禅源寺后山",
      elevation: 430,
      habitat: "常绿阔叶-落叶阔叶混交林缘",
      collectors: "周苓 / 林知远",
      pressed: true,
      status: "stored",
      slot: "A-03-02",
      voidReason: null,
      createdAt: `${t}02 10:05`,
      history: [
        { at: `${t}02 10:05`, kind: "register", text: "登记入队，采集号 HX-240616-07" },
        { at: `${t}09 15:18`, kind: "accept", text: "鉴定接受，定名：短柄枹栎" },
        { at: `${t}12 09:41`, kind: "assign", text: "上柜，柜位 A-03-02" },
      ],
    }),
    s({
      id: "seed-5",
      collectionNo: "HX-240617-02",
      species: "兰科",
      confirmedSpecies: null,
      place: "清凉峰南坡",
      elevation: 980,
      habitat: "毛竹林下腐殖质层",
      collectors: "何小满",
      pressed: false,
      status: "queued",
      slot: null,
      voidReason: null,
      createdAt: `${t}03 13:50`,
      history: [{ at: `${t}03 13:50`, kind: "register", text: "登记入队，采集号 HX-240617-02" }],
    }),
    s({
      id: "seed-6",
      collectionNo: "HX-240614-05",
      species: "未知草本",
      confirmedSpecies: null,
      place: "天目山三里亭沟谷",
      elevation: null,
      habitat: "标签受潮，信息不全",
      collectors: "周苓",
      pressed: false,
      status: "void",
      slot: null,
      voidReason: "压制霉变且采集记录缺失，不符合入库标准",
      createdAt: "2026-08-30 16:22",
      history: [
        { at: "2026-08-30 16:22", kind: "register", text: "登记入队，采集号 HX-240614-05" },
        {
          at: "2026-09-05 10:10",
          kind: "void",
          text: "作废：压制霉变且采集记录缺失，不符合入库标准",
        },
      ],
    }),
  ];
  return { version: 1, specimens };
}
