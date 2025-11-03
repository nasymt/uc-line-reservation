import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", {
  state: () => ({
    loadingCount: 0,
    message: "" as string,
  }),
  getters: {
    isLoading: (s) => s.loadingCount > 0,
  },
  actions: {
    start(msg?: string) {
      if (msg) this.message = msg;
      this.loadingCount++;
    },
    stop() {
      this.loadingCount = Math.max(0, this.loadingCount - 1);
      if (!this.loadingCount) this.message = "";
    },
    async withLoading<T>(task: () => Promise<T>, msg?: string) {
      try {
        this.start(msg);
        return await task();
      } finally {
        this.stop();
      }
    },
    setMessage(msg: string) {
      this.message = msg;
    },
  },
});
