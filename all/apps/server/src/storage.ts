import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import type { ServerConfig } from "./config.js";
export class ObjectStorage {
  private client: S3Client;
  constructor(private config: ServerConfig) {
    this.client = new S3Client({
      endpoint: config.s3Endpoint,
      region: config.s3Region,
      forcePathStyle: true,
      maxAttempts: 2,
      requestHandler: { connectionTimeout: 2000, requestTimeout: 5000 },
      credentials: {
        accessKeyId: config.s3AccessKey,
        secretAccessKey: config.s3SecretKey,
      },
    });
  }
  async ready() {
    await this.client.send(
      new HeadBucketCommand({ Bucket: this.config.s3Bucket }),
    );
  }
  async put(key: string, bytes: Buffer, mime: string) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: key,
        Body: bytes,
        ContentType: mime,
      }),
    );
  }
  async get(key: string) {
    const object = await this.client.send(
      new GetObjectCommand({ Bucket: this.config.s3Bucket, Key: key }),
    );
    if (!object.Body) throw Error("图片内容缺失");
    return Buffer.from(await object.Body.transformToByteArray());
  }
  async delete(key: string) {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.config.s3Bucket, Key: key }),
    );
  }
  close() {
    this.client.destroy();
  }
}
