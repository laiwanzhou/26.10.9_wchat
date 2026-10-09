import test from "node:test";
import assert from "node:assert/strict";
const workerModule = async () => {
  const module = await import(
    "../dist/apps/server/src/object-cleanup.js"
  ).catch(() => null);
  assert.ok(module, "对象清理修复尚未实现");
  return module;
};
function fixture(keys: string[], fail: (key: string) => boolean) {
  const rows = new Set(keys),
    objects = new Set(keys);
  const ports = {
    readBatch: async (after: string | undefined, limit: number) =>
      [...rows]
        .sort()
        .filter((key) => !after || key > after)
        .slice(0, limit)
        .map((objectKey) => ({ objectKey })),
    deleteObject: async (key: string) => {
      if (fail(key)) throw Error("临时存储故障");
      objects.delete(key);
    },
    deleteRecord: async (key: string) => {
      rows.delete(key);
    },
    onFailure: () => {},
  };
  return { ports, rows, objects };
}
test("R-04 单项失败不阻止同批健康对象清理，重建 worker 后仍会重试失败项", async () => {
  const { ObjectCleanup } = await workerModule();
  let failing = true;
  const state = fixture(["bad", "good"], (key) => key === "bad" && failing);
  const worker = new ObjectCleanup(state.ports);
  await worker.run();
  assert.deepEqual([...state.rows], ["bad"]);
  assert.deepEqual([...state.objects], ["bad"]);
  failing = false;
  await new ObjectCleanup(state.ports).run();
  assert.equal(state.rows.size, 0);
  assert.equal(state.objects.size, 0);
});
test("R-04 前 100 条持续失败不饿死后续任务，每轮处理有界且轮次会回头重试", async () => {
  const { ObjectCleanup } = await workerModule();
  const bad = Array.from(
    { length: 100 },
    (_, i) => "bad-" + String(i).padStart(3, "0"),
  );
  let failing = true;
  const state = fixture(
    [...bad, "zz-good"],
    (key) => failing && key.startsWith("bad"),
  );
  const worker = new ObjectCleanup(state.ports);
  await worker.run();
  assert.equal(state.rows.size, 101);
  await worker.run();
  assert.equal(state.objects.has("zz-good"), false);
  assert.equal(state.rows.size, 100);
  failing = false;
  await worker.run();
  assert.equal(state.rows.size, 0);
});
