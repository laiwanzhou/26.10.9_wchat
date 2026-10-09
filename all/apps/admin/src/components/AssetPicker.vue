<script setup lang="ts">
import { computed, ref } from "vue";
import { demo, saveDemo } from "../stores/demo";
import { saveLocalImage } from "../domain/local-asset";
import { ElMessage } from "element-plus";
const localPicker = ref<HTMLInputElement>(),
  uploading = ref(false);
const props = defineProps<{ modelValue?: string; assetId?: string }>();
const emit = defineEmits<{
  "update:modelValue": [value: string | undefined];
  "update:assetId": [value: string | undefined];
}>();
const examples = [
  {
    id: "example:grassland",
    name: "内置示例：草原",
    url: "/demo-media/grassland.png",
  },
  {
    id: "example:mountain",
    name: "内置示例：雪山",
    url: "/demo-media/mountain.png",
  },
  { id: "example:lake", name: "内置示例：湖泊", url: "/demo-media/lake.png" },
  {
    id: "example:desert",
    name: "内置示例：沙漠",
    url: "/demo-media/desert.png",
  },
];
const items = computed(() => [...demo.value.assets, ...examples]);
const selected = computed(
  () =>
    props.assetId ||
    items.value.find((item) => item.url === props.modelValue)?.id ||
    "",
);
// [PRE-LAUNCH:PL-04] 现在使用本地 URL/Data URL。未来上传返回 assetId，公开响应返回 HTTPS URL；同步 C-01/C-02/C-03 与服务端引用校验。
function choose(id: string | undefined) {
  const image = items.value.find((item) => item.id === id);
  emit("update:modelValue", image?.url);
  emit(
    "update:assetId",
    image && !image.id.startsWith("example:") ? image.id : undefined,
  );
}
async function uploadLocal(event: Event) {
  const input = event.target as HTMLInputElement,
    file = input.files?.[0];
  if (!file || uploading.value) return;
  uploading.value = true;
  try {
    const asset = await saveLocalImage(file, (asset) =>
      saveDemo((data) => data.assets.unshift(asset)),
    );
    choose(asset.id);
    ElMessage.success("图片已加入本地演示库并选中");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "图片保存失败");
  } finally {
    input.value = "";
    uploading.value = false;
  }
}
</script>
<template>
  <div class="media-picker">
    <el-select
      :model-value="selected"
      clearable
      placeholder="选择图片资源或内置示例"
      @change="choose"
      @clear="choose(undefined)"
      ><el-option
        v-for="item in items"
        :key="item.id"
        :label="item.name"
        :value="item.id" /></el-select
    ><img v-if="modelValue" :src="modelValue" alt="所选图片预览" /><span
      v-else
      class="field-help"
      >选择已有本地图片或内置示例，也可在下方添加。</span
    >
    <el-button size="small" :loading="uploading" @click="localPicker?.click()"
      >添加本地演示图片</el-button
    >
    <input
      ref="localPicker"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      hidden
      @change="uploadLocal"
    />
    <small class="field-help"
      >供题目、课程和选手演示使用，仅保存在当前浏览器；首页服务图片请到图片资源上传。</small
    >
  </div>
</template>
