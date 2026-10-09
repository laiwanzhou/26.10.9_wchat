Component({
  properties: {
    status: { type: String, value: "loading" },
    title: { type: String, value: "暂无内容" },
    message: { type: String, value: "" },
  },
  methods: {
    retry() {
      this.triggerEvent("retry");
    },
  },
});
