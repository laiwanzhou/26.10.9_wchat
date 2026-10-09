import { summarize } from "../domain/practice";
export interface PracticeRecord {
  id: string;
  title: string;
  time: string;
  total: number;
  answered: number;
  correct: number;
  wrong: number;
  accuracy: number;
}
const key = "yanxi-mini-history-v1";
export function readHistory(): PracticeRecord[] {
  try {
    const value: unknown = wx.getStorageSync(key);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (r): r is PracticeRecord =>
        r &&
        typeof r.id === "string" &&
        typeof r.title === "string" &&
        typeof r.time === "string" &&
        ["total", "answered", "correct", "wrong", "accuracy"].every(
          (k) => typeof r[k] === "number" && Number.isFinite(r[k]),
        ),
    );
  } catch {
    return [];
  }
}
export function saveRecord(
  title: string,
  results: (boolean | null)[],
): PracticeRecord | null {
  const now = new Date();
  const record = {
    id: `${now.getTime()}`,
    title,
    time: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    ...summarize(results),
  };
  try {
    wx.setStorageSync(key, [record, ...readHistory()].slice(0, 30));
    return record;
  } catch {
    wx.showToast({ title: "本地记录保存失败", icon: "none" });
    return null;
  }
}
export function clearHistory() {
  try {
    wx.removeStorageSync(key);
    return true;
  } catch {
    wx.showToast({ title: "记录清除失败", icon: "none" });
    return false;
  }
}
