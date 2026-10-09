import { createApp } from "vue";
import {
  ElButton,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElTable,
  ElTableColumn,
  ElTag,
  ElDialog,
  ElForm,
  ElFormItem,
  ElSwitch,
  ElTabs,
  ElTabPane,
  ElPagination,
  ElEmpty,
  ElDatePicker,
  ElConfigProvider,
} from "element-plus";
import "element-plus/dist/index.css";
import "./style.css";
import "./setup.css";
import "./content-management.css";
import App from "./App.vue";
import router from "./router";
const app = createApp(App);
Object.entries({
  ElButton,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElTable,
  ElTableColumn,
  ElTag,
  ElDialog,
  ElForm,
  ElFormItem,
  ElSwitch,
  ElTabs,
  ElTabPane,
  ElPagination,
  ElEmpty,
  ElDatePicker,
  ElConfigProvider,
}).forEach(([name, component]) => app.component(name, component));
app.use(router).mount("#app");
