import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
const derive = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(password: string, hash: string) {
  const [kind, salt, value] = hash.split(":");
  if (
    kind !== "scrypt" ||
    !/^[0-9a-f]{32}$/.test(salt || "") ||
    !/^[0-9a-f]{128}$/.test(value || "")
  )
    return false;
  return timingSafeEqual(
    await derive(password, salt),
    Buffer.from(value, "hex"),
  );
}
