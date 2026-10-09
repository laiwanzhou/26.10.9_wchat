import type {
  QuestionRecord,
  WordRecord,
  VideoRecord,
  ActivityConfig,
  DemoData,
} from "../../../../shared/contracts";
const orderErrors = (value: number) =>
  Number.isSafeInteger(value) && value >= 0 ? [] : ["排序必须为非负整数"];
function validHttps(value: string): boolean {
  if (!/^https:\/\/[^/\s]/i.test(value) || /\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !!url.hostname &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
function validPreviewMedia(value: string): boolean {
  return (
    validHttps(value) ||
    /^\/(?!\/)[^\s]+$/.test(value) ||
    /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value)
  );
}
// [CONTRACT:C-01] 编辑和导入共用；未来 server questions DTO 必须实施同样规则。
export function questionErrors(value: QuestionRecord): string[] {
  const errors = orderErrors(value.sortOrder);
  if (!["idiom", "law", "image", "poetry"].includes(value.type))
    errors.push("题型不支持");
  if (!value.stem.trim() || value.stem.length > 1000)
    errors.push("题干不能为空且不能超过 1000 字");
  if (
    !value.answers.length ||
    value.answers.some((answer) => !answer.trim() || answer.length > 300)
  )
    errors.push("请填写有效标准答案");
  if (value.type === "law" || value.type === "image") {
    if (value.options.length < 2 || value.options.length > 8)
      errors.push("选择题需有 2–8 个选项");
    if (
      new Set(value.options.map((option) => option.id)).size !==
      value.options.length
    )
      errors.push("选项编号不能重复");
    if (
      value.options.some(
        (option) =>
          !option.id || !option.label.trim() || option.label.length > 300,
      )
    )
      errors.push("选项编号与内容不能为空，内容最多 300 字");
    if (value.answers.length !== 1) errors.push("单选题只能有一个标准答案");
    if (
      value.answers.some(
        (answer) => !value.options.some((option) => option.id === answer),
      )
    )
      errors.push("标准答案必须对应现有选项");
    if (value.type === "image" && value.options.some((option) => !option.image))
      errors.push("图片题每个选项必须选择图片");
    if (
      value.options.some(
        (option) => option.image && !validPreviewMedia(option.image),
      )
    )
      errors.push("图片地址格式不正确，仅支持 HTTPS、本地路径或合法图片数据");
  } else if (value.options.length) errors.push("填空题不能包含选择选项");
  return errors;
}
export function wordErrors(value: WordRecord): string[] {
  const errors = orderErrors(value.sortOrder);
  if (!value.text.trim() || value.text.length > 50)
    errors.push("词语不能为空且最多 50 字");
  if (!value.pinyin.trim() || value.pinyin.length > 100)
    errors.push("拼音不能为空且最多 100 字");
  if (!value.definition.trim() || value.definition.length > 1000)
    errors.push("释义不能为空且最多 1000 字");
  if (value.example.length > 300) errors.push("例句不能超过 300 字");
  return errors;
}
export function videoErrors(value: VideoRecord): string[] {
  const errors = orderErrors(value.sortOrder);
  if (!value.title.trim() || value.title.length > 100)
    errors.push("请填写有效课程标题");
  if (!value.category.trim()) errors.push("请填写课程分类");
  if (value.url && !validHttps(value.url))
    errors.push("视频地址必须为有效 HTTPS 地址");
  if (value.enabled && !value.url.trim())
    errors.push("启用课程前必须填写视频地址");
  return errors;
}
// [PRE-LAUNCH:PL-07] 当前只校验/预览配置；真实有效期与 IP 日额度须由 server 权威时钟和事务执行。
export function activityErrors(value: ActivityConfig): string[] {
  const errors: string[] = [];
  if (!value.title.trim() || value.title.length > 60)
    errors.push("请填写有效活动标题");
  if (!Number.isSafeInteger(value.dailyLimit) || value.dailyLimit < 1)
    errors.push("每日限额必须为正整数");
  if (value.enabled && (!value.startAt || !value.endAt))
    errors.push("开启活动需要完整起止时间");
  if (value.startAt && !Number.isFinite(Date.parse(value.startAt)))
    errors.push("开始时间无效");
  if (value.endAt && !Number.isFinite(Date.parse(value.endAt)))
    errors.push("结束时间无效");
  if (
    value.startAt &&
    value.endAt &&
    Date.parse(value.endAt) <= Date.parse(value.startAt)
  )
    errors.push("结束时间必须晚于开始时间");
  return errors;
}
export function beijingToUtc(value: string): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value))
    throw Error("北京时间格式不正确");
  const time = Date.parse(value + "+08:00");
  if (
    !Number.isFinite(time) ||
    new Date(time + 8 * 3600000).toISOString().slice(0, 19) !== value
  )
    throw Error("北京时间日期无效");
  return new Date(time).toISOString();
}
export function utcToBeijing(value: string | null): string {
  if (!value) return "";
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw Error("时间无效");
  return new Date(time + 8 * 3600000).toISOString().slice(0, 19);
}
export function stableSort<T extends { id: string; sortOrder: number }>(
  values: T[],
): T[] {
  return [...values].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}
export function formatQuestionAnswer(value: QuestionRecord): string {
  return value.options.length
    ? value.answers
        .map(
          (id) => value.options.find((option) => option.id === id)?.label || id,
        )
        .join(" / ")
    : value.answers.join(" / ");
}
export function assetReferences(data: DemoData, id: string): string[] {
  const references: string[] = [];
  if (data.home.bannerAssetId === id) references.push("首页");
  for (const question of data.questions)
    if (question.options.some((option) => option.imageAssetId === id))
      references.push("题目：" + question.stem);
  for (const candidate of data.candidates)
    if (candidate.photoAssetId === id)
      references.push("选手：" + candidate.name);
  for (const video of data.videos)
    if (video.coverAssetId === id) references.push("课程：" + video.title);
  return references;
}
