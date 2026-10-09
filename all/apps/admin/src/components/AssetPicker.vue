<script setup lang="ts">
import { computed } from "vue";
import { demo } from "../stores/demo";
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
      >先在图片资源中上传，也可使用内置示例。</span
    >
  </div>
</template>
