interface CleanupPorts {
  readBatch(
    after: string | undefined,
    limit: number,
  ): Promise<{ objectKey: string }[]>;
  deleteObject(key: string): Promise<void>;
  deleteRecord(key: string): Promise<void>;
  onFailure(): void;
}
// [PRE-LAUNCH:PL-04] 有界轮询推进稳定键，单项失败保留数据库记录；多实例删除须保持幂等。
export class ObjectCleanup {
  private cursor?: string;
  private active?: Promise<void>;
  private stopped = false;
  constructor(private ports: CleanupPorts) {}
  run(): Promise<void> {
    if (this.stopped) return Promise.resolve();
    if (this.active) return this.active;
    this.active = this.batch().finally(() => {
      this.active = undefined;
    });
    return this.active;
  }
  private async batch() {
    let rows = await this.ports.readBatch(this.cursor, 100);
    if (!rows.length && this.cursor !== undefined) {
      this.cursor = undefined;
      rows = await this.ports.readBatch(undefined, 100);
    }
    for (const row of rows) {
      if (this.stopped) break;
      try {
        await this.ports.deleteObject(row.objectKey);
        await this.ports.deleteRecord(row.objectKey);
      } catch {
        this.ports.onFailure();
      }
      this.cursor = row.objectKey;
    }
  }
  async stop() {
    this.stopped = true;
    await this.active?.catch(() => {});
  }
}
