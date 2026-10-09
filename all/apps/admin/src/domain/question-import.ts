import type { QuestionRecord } from "../../../../shared/contracts";
import { questionErrors } from "./content-model.ts";
export type DuplicateMode = "reject" | "replace";
export interface SheetRow {
  rowNumber: number;
  cells: string[];
  cellErrors?: Record<number, string>;
}
export interface ImportRow {
  rowNumber: number;
  question: QuestionRecord;
  errors: string[];
  replacesId?: string;
}
export type FieldKey =
  | "type"
  | "stem"
  | "answer"
  | "a"
  | "b"
  | "c"
  | "d"
  | "imageA"
  | "imageB"
  | "imageC"
  | "imageD"
  | "explanation"
  | "enabled"
  | "sortOrder";
export type FieldMapping = Partial<Record<FieldKey, number | null>>;
export const importFields: {
  key: FieldKey;
  label: string;
  aliases: string[];
}[] = [
  { key: "type", label: "题型", aliases: ["题型", "类型", "type"] },
  { key: "stem", label: "题干", aliases: ["题干", "题目", "题目内容", "stem"] },
  { key: "answer", label: "标准答案", aliases: ["标准答案", "答案", "answer"] },
  ...["a", "b", "c", "d"].map((letter) => ({
    key: letter as FieldKey,
    label: "选项" + letter.toUpperCase(),
    aliases: ["选项" + letter, "option" + letter, letter],
  })),
  ...["A", "B", "C", "D"].map((letter) => ({
    key: ("image" + letter) as FieldKey,
    label: "图片" + letter,
    aliases: ["图片" + letter.toLowerCase(), "image" + letter.toLowerCase()],
  })),
  {
    key: "explanation",
    label: "解析",
    aliases: ["解析", "说明", "explanation"],
  },
  { key: "enabled", label: "启用", aliases: ["启用", "状态", "enabled"] },
  { key: "sortOrder", label: "排序", aliases: ["排序", "序号", "sortorder"] },
];
const normal = (value: string) => value.replace(/\s/g, "").toLowerCase();
export function inferMapping(headers: string[]): FieldMapping {
  const result: FieldMapping = {};
  for (const field of importFields) {
    const matches = headers
      .map((header, index) =>
        field.aliases.includes(normal(header)) ? index : -1,
      )
      .filter((index) => index >= 0);
    result[field.key] = matches.length === 1 ? matches[0] : null;
  }
  return result;
}
const types: Record<string, QuestionRecord["type"]> = {
  idiom: "idiom",
  成语填空: "idiom",
  成语: "idiom",
  law: "law",
  法律单选: "law",
  法律: "law",
  image: "image",
  农牧民图片选择题: "image",
  农牧民图选: "image",
  图片选择: "image",
  图片选择题: "image",
  poetry: "poetry",
  诗词填空: "poetry",
  诗词: "poetry",
};
// [PRE-LAUNCH:PL-08] 此列映射/重复策略是前端初版。甲方模板确认后与 server import 校验同改；前端预览不能代替服务端重校验和原子提交。
// [CONTRACT:C-01] 输出完整 options/answers，与 Question Editor 和小程序契约一致。
export function previewQuestionRows(
  rows: SheetRow[],
  mapping: FieldMapping,
  existing: QuestionRecord[],
  mode: DuplicateMode,
): ImportRow[] {
  const seen = new Set<string>();
  const keys = Object.values(mapping).filter(
    (x): x is number => typeof x === "number",
  );
  return rows.map((row) => {
    const value = (key: FieldKey) => {
      const column = mapping[key];
      return typeof column === "number" ? (row.cells[column] || "").trim() : "";
    };
    const errors: string[] = [];
    if (new Set(keys).size !== keys.length)
      errors.push("多个字段不能映射同一列");
    for (const [column, message] of Object.entries(row.cellErrors || {}))
      if (keys.includes(Number(column))) errors.push(message);
    const type = types[normal(value("type"))] || ("" as QuestionRecord["type"]),
      choice = type === "law" || type === "image";
    const options = choice
      ? ["a", "b", "c", "d"]
          .map((id) => ({
            id,
            label: value(id as FieldKey),
            image: value(("image" + id.toUpperCase()) as FieldKey) || undefined,
          }))
          .filter((option) => option.label || option.image)
      : [];
    const tokens = value("answer")
      .split(/[|\n]/)
      .map((token) => token.trim())
      .filter(Boolean);
    const answers = choice
      ? tokens.map((token) => {
          const id = token.replace(/^(选项|option)\s*/i, "").toLowerCase();
          if (options.some((option) => option.id === id)) return id;
          const matches = options.filter((option) => option.label === token);
          return matches.length === 1 ? matches[0].id : token;
        })
      : [...new Set(tokens)];
    const enabledText = normal(value("enabled"));
    const enabled = ["true", "1", "是", "启用", "已启用"].includes(enabledText);
    if (
      enabledText &&
      ![
        "true",
        "1",
        "是",
        "启用",
        "已启用",
        "false",
        "0",
        "否",
        "草稿",
        "禁用",
        "关闭",
        "未启用",
      ].includes(enabledText)
    )
      errors.push("启用状态无法识别");
    const question: QuestionRecord = {
      id: "preview-" + row.rowNumber,
      type,
      stem: value("stem"),
      answers,
      options,
      explanation: value("explanation"),
      enabled,
      sortOrder: value("sortOrder") ? Number(value("sortOrder")) : 0,
      updatedAt: "",
    };
    errors.push(...questionErrors(question));
    const key = type + "\u0000" + question.stem;
    const match = existing.find(
      (item) => item.type === type && item.stem.trim() === question.stem,
    );
    if (seen.has(key)) errors.push("文件内题型和题干重复");
    seen.add(key);
    if (match && mode === "reject") errors.push("与现有题目重复");
    return {
      rowNumber: row.rowNumber,
      question,
      errors,
      replacesId: match?.id,
    };
  });
}
export function mergeQuestionImport(
  existing: QuestionRecord[],
  preview: ImportRow[],
  mode: DuplicateMode,
  id: () => string,
): QuestionRecord[] {
  if (!preview.length) throw Error("没有可导入数据");
  if (
    preview.some(
      (row) => row.errors.length || questionErrors(row.question).length,
    )
  )
    throw Error("存在错误，整批禁止导入");
  const next = JSON.parse(JSON.stringify(existing)) as QuestionRecord[];
  for (const row of preview) {
    const index = next.findIndex(
      (item) =>
        item.type === row.question.type &&
        item.stem.trim() === row.question.stem,
    );
    if (index >= 0 && mode === "reject")
      throw Error("出现重复题目，请重新预览");
    const record = {
      ...JSON.parse(JSON.stringify(row.question)),
      id: index >= 0 ? next[index].id : id(),
      updatedAt: new Date().toISOString(),
    };
    if (index >= 0) next[index] = record;
    else next.push(record);
  }
  return next;
}
