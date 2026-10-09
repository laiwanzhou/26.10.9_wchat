// 用代码生成独立静态插画，不依赖网络、外部图片或图片处理库。
import { deflateSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const width = 480,
  height = 300;
const directory = resolve(
  import.meta.dirname,
  "../apps/miniprogram/src/assets/questions",
);
const color = (hex) =>
  [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, bytes) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(bytes.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, bytes])));
  return Buffer.concat([length, name, bytes, crc]);
}
function pixel(scene, x, y) {
  let shade = "#dcebdc";
  if (scene === "mountain") shade = "#dce9ee";
  if (scene === "desert") shade = "#f1e2c6";
  if (scene === "lake") shade = "#dbe9e5";
  if ((x - 382) ** 2 + (y - 57) ** 2 < 25 ** 2) shade = "#f3ddb0";
  if (y > 166 + 16 * Math.sin(x / 82))
    shade = scene === "desert" ? "#d9b777" : "#a5ba91";
  if (scene === "grassland") {
    if (y > 192 + 22 * Math.sin(x / 115)) shade = "#84a16a";
    if (y > 254 + 20 * Math.sin(x / 83 + 1.1)) shade = "#64864e";
    if (y > 214 && y < 257 && x > 20 && x < 460 && (x * 13 + y * 7) % 137 === 0)
      shade = "#c7d5a0";
  }
  if (scene === "mountain") {
    for (const [center, peak, span] of [
      [180, 57, 140],
      [357, 92, 120],
    ]) {
      const ridge = peak + Math.abs(x - center) * 1.18;
      if (Math.abs(x - center) < span && y > ridge)
        shade = y < peak + 57 ? "#f8faf6" : "#8a9b9d";
    }
    if (y > 257) shade = "#becbca";
  }
  if (scene === "desert") {
    if (y > 173 + 25 * Math.sin(x / 111 + 0.8)) shade = "#d9b576";
    if (y > 221 + 27 * Math.sin(x / 121 + 2)) shade = "#cba161";
    if (y > 269 + 23 * Math.sin(x / 110 + 3)) shade = "#ba8e52";
  }
  if (scene === "lake") {
    if (y > 153 + 22 * Math.sin(x / 73)) shade = "#819b72";
    if (((x - 247) / 232) ** 2 + ((y - 239) / 71) ** 2 < 1) shade = "#80b7be";
    if (((x - 248) / 203) ** 2 + ((y - 247) / 48) ** 2 < 1) shade = "#69a5b0";
    if (y > 215 && y < 264 && y % 18 === 0 && x > 170 && x < 310)
      shade = "#aad4d4";
  }
  return color(shade);
}
await mkdir(directory, { recursive: true });
for (const scene of ["grassland", "mountain", "desert", "lake"]) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const offset = y * (width * 4 + 1) + 1 + x * 4;
      const rgb = pixel(scene, x, y);
      raw[offset] = rgb[0];
      raw[offset + 1] = rgb[1];
      raw[offset + 2] = rgb[2];
      raw[offset + 3] = 255;
    }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  await writeFile(resolve(directory, scene + ".png"), png);
}
console.log("已生成 4 张本地静态题目图片（480×300 PNG）。");
