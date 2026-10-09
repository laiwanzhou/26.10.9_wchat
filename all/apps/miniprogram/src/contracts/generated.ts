// 自动生成：唯一来源 all/shared/contracts.ts；禁止手工编辑。参见唯一 plan 的 C-01..C-04。
// [CONTRACT:C-01..C-04] 唯一来源；两端类型/校验由这里派生。修改时同步唯一 plan 的接口清单和未来后端 DTO。
// [CONTRACT:C-01] 编辑器、导入、静态题目、答题页与未来 questions DTO 必须同步。
export type QuestionType = "idiom" | "law" | "image" | "poetry";
export type AnswerKind = "choice" | "fill";
export interface QuestionOption {
  id: string;
  label: string;
  image?: string;
  imageAssetId?: string;
}
export interface QuestionContent {
  id: string;
  type: QuestionType;
  stem: string;
  answers: string[];
  options: QuestionOption[];
  explanation: string;
}
export interface QuestionRecord extends QuestionContent {
  enabled: boolean;
  sortOrder: number;
  updatedAt: string;
  migrationNote?: string;
}
// [CONTRACT:C-02] 学习聚合、词条详情、课程/媒体管理和后端公开 DTO 同改。
export interface WordContent {
  id: string;
  text: string;
  pinyin: string;
  definition: string;
  example: string;
}
export interface WordRecord extends WordContent {
  enabled: boolean;
  sortOrder: number;
}
export interface VideoContent {
  id: string;
  title: string;
  category: string;
  duration: string;
  url: string;
  cover?: string;
  color?: string;
  mark?: string;
}
export interface VideoRecord extends VideoContent {
  enabled: boolean;
  sortOrder: number;
  coverAssetId?: string;
}
// [CONTRACT:C-03] 选手照片/排序与活动 UTC 时间；未来 server 的公开模型与管理写模型在此约定转换。
export interface CandidateContent {
  id: string;
  number: string;
  name: string;
  intro: string;
  color: string;
  mark: string;
  photo?: string;
}
export interface CandidateRecord extends CandidateContent {
  enabled: boolean;
  sortOrder: number;
  votes: number;
  photoAssetId?: string;
}
export interface ActivityConfig {
  title: string;
  startAt: string | null;
  endAt: string | null;
  dailyLimit: number;
  enabled: boolean;
}
export interface ImageAsset {
  id: string;
  name: string;
  url: string;
  mime: string;
  size: number;
  createdAt: string;
}
export interface HomeContent {
  title: string;
  subtitle: string;
  banner: { id: string; url: string } | null;
}
// [CONTRACT:C-02/C-04] 管理端服务模式、server 首页读写与小程序公开首页必须一起修改。
export interface HomeConfig {
  title: string;
  subtitle: string;
  bannerAssetId: string | null;
}
export interface AdminIdentity {
  username: string;
}
export function decodeHomeConfig(value: unknown): HomeConfig {
  const row = dto(value, "首页配置");
  if (row.bannerAssetId !== null && typeof row.bannerAssetId !== "string")
    throw Error("首页配置格式异常：bannerAssetId");
  return {
    title: stringField(row, "title", "首页配置"),
    subtitle: stringField(row, "subtitle", "首页配置"),
    bannerAssetId: row.bannerAssetId as string | null,
  };
}
export function decodeIdentity(value: unknown): AdminIdentity {
  return { username: stringField(dto(value, "管理员"), "username", "管理员") };
}
export function decodeAsset(value: unknown): ImageAsset {
  const row = dto(value, "图片");
  if (!Number.isInteger(row.size) || (row.size as number) <= 0)
    throw Error("图片格式异常：size");
  return {
    id: stringField(row, "id", "图片"),
    name: stringField(row, "name", "图片"),
    url: stringField(row, "url", "图片"),
    mime: stringField(row, "mime", "图片"),
    size: row.size as number,
    createdAt: stringField(row, "createdAt", "图片"),
  };
}
export function decodeAssets(value: unknown): ImageAsset[] {
  const row = dto(value, "图片列表");
  if (!Array.isArray(row.items)) throw Error("图片列表格式异常");
  return row.items.map(decodeAsset);
}
export interface LearningContent {
  words: WordContent[];
  lessons: VideoContent[];
}
export interface VotingContent {
  title: string;
  candidates: CandidateContent[];
}
export interface DemoData {
  version: 2;
  home: { title: string; subtitle: string; bannerAssetId: string | null };
  questions: QuestionRecord[];
  words: WordRecord[];
  videos: VideoRecord[];
  candidates: CandidateRecord[];
  assets: ImageAsset[];
  activity: ActivityConfig;
}
// [CONTRACT:C-04] Mock/HTTP/未来后端共用包装。真实服务必须生成 requestId，Mock 缺省时客户端允许省略。
export interface ApiError {
  code: string;
  message: string;
  requestId?: string;
}
export type ApiResponse<T> =
  | { data: T; error?: never }
  | { error: ApiError; data?: never };
function dto(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error(name + "格式异常");
  return value as Record<string, unknown>;
}
function stringField(
  value: Record<string, unknown>,
  key: string,
  name: string,
): string {
  if (typeof value[key] !== "string") throw Error(name + "格式异常：" + key);
  return value[key] as string;
}
// [PRE-LAUNCH:PL-04] 当前校验媒体字段类型；生产 HTTP 响应还需 HTTPS/可访问性/引用权限校验，与上传和公开媒体 API 一起落实。
function optionalString(
  value: Record<string, unknown>,
  key: string,
  name: string,
): string | undefined {
  if (value[key] === undefined) return undefined;
  return stringField(value, key, name);
}
export function decodeHome(value: unknown): HomeContent | null {
  if (value === null) return null;
  const row = dto(value, "首页内容");
  const banner = row.banner === null ? null : dto(row.banner, "首页图片");
  return {
    title: stringField(row, "title", "首页内容"),
    subtitle: stringField(row, "subtitle", "首页内容"),
    banner: banner
      ? {
          id: stringField(banner, "id", "首页图片"),
          url: stringField(banner, "url", "首页图片"),
        }
      : null,
  };
}
export function decodeWord(value: unknown): WordContent {
  const row = dto(value, "词条");
  return {
    id: stringField(row, "id", "词条"),
    text: stringField(row, "text", "词条"),
    pinyin: stringField(row, "pinyin", "词条"),
    definition: stringField(row, "definition", "词条"),
    example: stringField(row, "example", "词条"),
  };
}
function decodeVideo(value: unknown): VideoContent {
  const row = dto(value, "课程");
  return {
    id: stringField(row, "id", "课程"),
    title: stringField(row, "title", "课程"),
    category: stringField(row, "category", "课程"),
    duration: stringField(row, "duration", "课程"),
    url: stringField(row, "url", "课程"),
    cover: optionalString(row, "cover", "课程"),
    color: optionalString(row, "color", "课程") || "green",
    mark: optionalString(row, "mark", "课程") || "课",
  };
}
export function decodeLearning(value: unknown): LearningContent {
  const row = dto(value, "学习资源");
  if (!Array.isArray(row.words) || !Array.isArray(row.lessons))
    throw Error("学习资源格式异常");
  return {
    words: row.words.map(decodeWord),
    lessons: row.lessons.map(decodeVideo),
  };
}
export function decodeCandidate(value: unknown): CandidateContent {
  const row = dto(value, "选手");
  const name = stringField(row, "name", "选手");
  const color = stringField(row, "color", "选手");
  const palette: Record<string, string> = {
    green: "#e9efe2",
    blue: "#e8edf4",
    amber: "#f3e9de",
    purple: "#e9e4f1",
  };
  if (!/^#[0-9a-f]{6}$/i.test(color) && !palette[color])
    throw Error("选手格式异常：color");
  return {
    id: stringField(row, "id", "选手"),
    number: stringField(row, "number", "选手"),
    name,
    intro: stringField(row, "intro", "选手"),
    color: palette[color] || color,
    mark: optionalString(row, "mark", "选手") || name.slice(-1),
    photo: optionalString(row, "photo", "选手"),
  };
}
export function decodeVoting(value: unknown): VotingContent {
  const row = dto(value, "投票内容");
  if (!Array.isArray(row.candidates)) throw Error("投票内容格式异常");
  return {
    title: stringField(row, "title", "投票内容"),
    candidates: row.candidates.map(decodeCandidate),
  };
}
