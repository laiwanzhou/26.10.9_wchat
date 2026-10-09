export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export class LocalRepository<T> {
  private storage: StoragePort;
  private key: string;
  private validate: (value: unknown) => value is T;
  private value: T;
  constructor(
    storage: StoragePort,
    key: string,
    fallback: T,
    validate: (value: unknown) => value is T,
  ) {
    this.storage = storage;
    this.key = key;
    this.validate = validate;
    this.value = structuredClone(fallback);
    try {
      const cached = storage.getItem(key);
      if (cached) {
        const parsed: unknown = JSON.parse(cached);
        if (validate(parsed)) this.value = parsed;
      }
    } catch {
      /* 本地缓存不可用时，仍允许查看演示。 */
    }
  }
  read(): T {
    return structuredClone(this.value);
  }
  save(value: T): void {
    if (!this.validate(value)) throw new Error("数据格式不正确");
    const encoded = JSON.stringify(value);
    this.storage.setItem(this.key, encoded);
    this.value = JSON.parse(encoded) as T;
  }
}
export function validateImage(bytes: Uint8Array, size: number): string {
  // [PRE-LAUNCH:PL-04] 魔数不是完整图片解码或权限校验；上线服务端需要大小/格式/解码与引用检查，同 AssetsView 和存储 API 一起落实。
  if (size > 5 * 1024 * 1024) throw new Error("图片不能超过 5 MiB");
  if (size <= 0) throw new Error("图片格式不支持");
  const begins = (header: number[]) => header.every((b, i) => bytes[i] === b);
  if (begins([137, 80, 78, 71, 13, 10, 26, 10])) return "image/png";
  if (begins([255, 216, 255])) return "image/jpeg";
  if (
    begins([82, 73, 70, 70]) &&
    bytes[8] === 87 &&
    bytes[9] === 69 &&
    bytes[10] === 66 &&
    bytes[11] === 80
  )
    return "image/webp";
  throw new Error("仅支持真实 JPEG、PNG、WebP 图片格式");
}
