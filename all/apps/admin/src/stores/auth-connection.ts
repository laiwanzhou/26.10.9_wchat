import { ref } from "vue";
export const authConnectionIssue = ref<{
  path: string;
  message: string;
} | null>(null);
