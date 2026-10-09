import sharp from "sharp";
export async function normalizeImage(bytes: Buffer) {
  if (!bytes.length || bytes.length > 5 * 1024 * 1024)
    throw Error("图片最大为 5 MiB");
  try {
    const image = sharp(bytes, {
      limitInputPixels: 20_000_000,
      failOn: "warning",
      animated: false,
    });
    const meta = await image.metadata();
    if (
      !["jpeg", "png", "webp"].includes(meta.format || "") ||
      (meta.pages || 1) !== 1
    )
      throw Error("unsupported");
    const output = await image.rotate().png().toBuffer();
    if (output.length > 5 * 1024 * 1024) throw Error("too large");
    return { bytes: output, mime: "image/png" };
  } catch {
    throw Error(
      "图片无效：仅支持可解码的 JPEG、PNG、WebP 静态图片（最多 2000 万像素／5 MiB）",
    );
  }
}
