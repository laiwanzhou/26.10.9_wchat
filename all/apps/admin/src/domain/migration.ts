import type { DemoData, QuestionType } from "../../../../shared/contracts";
import { questionErrors } from "./content-model.ts";
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("缓存记录格式错误");
  return value as Record<string, unknown>;
}
function text(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "string") throw Error("缓存字段类型错误");
  return value;
}
function list(value: Record<string, unknown>, key: string): unknown[] {
  if (!Array.isArray(value[key])) throw Error("缓存列表格式错误：" + key);
  return value[key] as unknown[];
}
export function isDemoData(value: unknown): value is DemoData {
  try {
    const d = record(value) as unknown as DemoData;
    return (
      d.version === 2 &&
      typeof d.home.title === "string" &&
      typeof d.home.subtitle === "string" &&
      (d.home.bannerAssetId === null ||
        typeof d.home.bannerAssetId === "string") &&
      Array.isArray(d.questions) &&
      d.questions.every(
        (q) =>
          typeof q.id === "string" &&
          ["idiom", "law", "image", "poetry"].includes(q.type) &&
          typeof q.stem === "string" &&
          Array.isArray(q.answers) &&
          q.answers.every((a) => typeof a === "string") &&
          Array.isArray(q.options) &&
          q.options.every(
            (o) =>
              typeof o.id === "string" &&
              typeof o.label === "string" &&
              (o.image === undefined || typeof o.image === "string"),
          ) &&
          typeof q.explanation === "string" &&
          typeof q.enabled === "boolean" &&
          Number.isSafeInteger(q.sortOrder) &&
          typeof q.updatedAt === "string",
      ) &&
      Array.isArray(d.words) &&
      d.words.every(
        (w) =>
          [w.id, w.text, w.pinyin, w.definition, w.example].every(
            (x) => typeof x === "string",
          ) &&
          typeof w.enabled === "boolean" &&
          Number.isSafeInteger(w.sortOrder),
      ) &&
      Array.isArray(d.videos) &&
      d.videos.every(
        (v) =>
          [v.id, v.title, v.category, v.duration, v.url].every(
            (x) => typeof x === "string",
          ) &&
          typeof v.enabled === "boolean" &&
          Number.isSafeInteger(v.sortOrder),
      ) &&
      Array.isArray(d.candidates) &&
      d.candidates.every(
        (c) =>
          [c.id, c.number, c.name, c.intro, c.color, c.mark].every(
            (x) => typeof x === "string",
          ) &&
          typeof c.enabled === "boolean" &&
          Number.isSafeInteger(c.sortOrder) &&
          Number.isFinite(c.votes),
      ) &&
      Array.isArray(d.assets) &&
      d.assets.every(
        (a) =>
          [a.id, a.name, a.url, a.mime, a.createdAt].every(
            (x) => typeof x === "string",
          ) && Number.isFinite(a.size),
      ) &&
      typeof d.activity.title === "string" &&
      Number.isSafeInteger(d.activity.dailyLimit) &&
      d.activity.dailyLimit > 0 &&
      typeof d.activity.enabled === "boolean" &&
      (d.activity.startAt === null || typeof d.activity.startAt === "string") &&
      (d.activity.endAt === null || typeof d.activity.endAt === "string")
    );
  } catch {
    return false;
  }
}
// [PRE-LAUNCH:PL-02] 只迁移前端旧缓存；正式上线仍需数据库迁移、备份和跨端一致性验证。
export function migrateDemoData(value: unknown): DemoData {
  const source = record(value);
  if (source.version === 2) {
    if (!isDemoData(source)) throw Error("新版缓存结构错误");
    return JSON.parse(JSON.stringify(source)) as DemoData;
  }
  if (source.version !== 1) throw Error("缓存版本不支持");
  const home = record(source.home),
    activity = record(source.activity);
  const next: DemoData = {
    version: 2,
    home: {
      title: text(home.title),
      subtitle: text(home.subtitle),
      bannerAssetId:
        home.bannerAssetId === null ? null : text(home.bannerAssetId),
    },
    questions: list(source, "questions").map((item, index) => {
      const q = record(item);
      const type = text(q.type) as QuestionType;
      if (!["idiom", "law", "image", "poetry"].includes(type))
        throw Error("旧题型无效");
      const answer = text(q.answer);
      const choice = type === "law" || type === "image";
      const migrated = {
        id: text(q.id),
        type,
        stem: text(q.stem),
        answers: answer ? [choice ? "a" : answer] : [],
        options: choice && answer ? [{ id: "a", label: answer }] : [],
        explanation: "",
        enabled: q.enabled === true,
        sortOrder: index,
        updatedAt: text(q.updatedAt),
      };
      if (questionErrors(migrated).length)
        return { ...migrated, enabled: false, migrationNote: "旧题资料待补全" };
      return migrated;
    }),
    words: list(source, "words").map((item, index) => {
      const w = record(item);
      return {
        id: text(w.id),
        text: text(w.text),
        pinyin: text(w.pinyin),
        definition: text(w.definition),
        example: text(w.example),
        enabled: true,
        sortOrder: index,
      };
    }),
    videos: list(source, "videos").map((item, index) => {
      const v = record(item);
      return {
        id: text(v.id),
        title: text(v.title),
        category: text(v.category),
        duration: text(v.duration),
        url: text(v.url),
        enabled: false,
        sortOrder: index,
      };
    }),
    candidates: list(source, "candidates").map((item, index) => {
      const c = record(item);
      return {
        id: text(c.id),
        number: text(c.number),
        name: text(c.name),
        intro: text(c.intro),
        color: text(c.color),
        mark: text(c.name).slice(-1),
        votes: typeof c.votes === "number" ? c.votes : 0,
        enabled: c.enabled === true,
        sortOrder: index,
      };
    }),
    assets: list(source, "assets").map((item) => {
      const a = record(item);
      return {
        id: text(a.id),
        name: text(a.name),
        url: text(a.url),
        mime: text(a.mime),
        size: typeof a.size === "number" ? a.size : 0,
        createdAt: text(a.createdAt),
      };
    }),
    activity: {
      title: text(activity.title),
      dailyLimit:
        typeof activity.dailyLimit === "number" ? activity.dailyLimit : 3,
      enabled: false,
      startAt: null,
      endAt: null,
    },
  };
  if (!isDemoData(next)) throw Error("旧数据无法安全升级");
  return next;
}
