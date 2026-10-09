import { validateImage } from "./local-repository.ts";
import type { ImageAsset } from "../../../../shared/contracts";
// [PRE-LAUNCH:PL-02/PL-04] 演示编辑器保存 Data URL；服务首页只使用服务图片库，不把私有预览 URL 混入本地缓存。
export async function saveLocalImage(
  file: File,
  save: (asset: ImageAsset) => boolean,
): Promise<ImageAsset> {
  const mime = validateImage(
    new Uint8Array(await file.slice(0, 12).arrayBuffer()),
    file.size,
  );
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pieces: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 32768)
    pieces.push(String.fromCharCode(...bytes.subarray(offset, offset + 32768)));
  const asset: ImageAsset = {
    id: crypto.randomUUID(),
    name: file.name,
    mime,
    size: file.size,
    createdAt: new Date().toISOString(),
    url: `data:${mime};base64,${btoa(pieces.join(""))}`,
  };
  if (!save(asset)) throw Error("图片未能保存，原有数据已保留");
  return asset;
}
