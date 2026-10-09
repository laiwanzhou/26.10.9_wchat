import { request, RequestError } from "./request";
import {
  decodeHome,
  decodeLearning,
  decodeVoting,
  decodeWord,
  decodeCandidate,
} from "../contracts/generated";
export type {
  HomeContent,
  LearningContent,
  VotingContent,
} from "../contracts/generated";
// [CONTRACT:C-02/C-03/C-04] 路径、DTO、聚合例外与 shared/contracts、mock-transport 和未来 server 必须一起修改。
async function content<T>(
  path: string,
  decode: (value: unknown) => T,
): Promise<T> {
  const value = await request<unknown>({ path });
  try {
    return decode(value);
  } catch (error) {
    throw new RequestError(
      "INVALID_CONTENT",
      error instanceof Error ? error.message : "内容格式异常",
    );
  }
}
export const getHome = () => content("/api/public/home", decodeHome);
export const getLearning = () =>
  content("/api/public/learning", decodeLearning);
export const getVoting = () => content("/api/public/voting", decodeVoting);
export async function getWord(id: string) {
  try {
    return await content(
      "/api/public/words/" + encodeURIComponent(id),
      decodeWord,
    );
  } catch (error) {
    if (error instanceof RequestError && error.statusCode === 404) return null;
    throw error;
  }
}
export async function getCandidate(id: string) {
  try {
    return await content(
      "/api/public/candidates/" + encodeURIComponent(id),
      decodeCandidate,
    );
  } catch (error) {
    if (error instanceof RequestError && error.statusCode === 404) return null;
    throw error;
  }
}
