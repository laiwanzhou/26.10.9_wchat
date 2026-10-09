export type PreviewScenario = "normal" | "slow" | "empty" | "error";
export type PreviewBanner =
  | "grassland"
  | "mountain"
  | "lake"
  | "desert"
  | "none";
export interface PreviewSettings {
  scenario: PreviewScenario;
  title: string;
  subtitle: string;
  banner: PreviewBanner;
}
export const defaultPreviewSettings: PreviewSettings = {
  scenario: "normal",
  title: "每天一点，表达更好。",
  subtitle: "学普通话，读经典，让每一句话更有力量。",
  banner: "grassland",
};
const key = "yanxi-mini-preview-v1";
export function readPreviewSettings(): PreviewSettings {
  try {
    const value = wx.getStorageSync(key) as
      | Partial<PreviewSettings>
      | undefined;
    if (
      value &&
      ["normal", "slow", "empty", "error"].includes(value.scenario || "") &&
      ["grassland", "mountain", "lake", "desert", "none"].includes(
        value.banner || "",
      ) &&
      typeof value.title === "string" &&
      value.title.trim() &&
      value.title.length <= 60 &&
      typeof value.subtitle === "string" &&
      value.subtitle.length <= 150
    )
      return { ...value } as PreviewSettings;
  } catch {
    /* 使用默认配置 */
  }
  return { ...defaultPreviewSettings };
}
export function savePreviewSettings(settings: PreviewSettings): void {
  if (!settings.title.trim()) throw Error("请填写首页标题");
  wx.setStorageSync(key, {
    ...settings,
    title: settings.title.trim(),
    subtitle: settings.subtitle.trim(),
  });
}
