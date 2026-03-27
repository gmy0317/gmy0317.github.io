const isLocalPreview =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

export const APP_CONFIG = {
  // 本地预览时默认走内置接口；部署到 GitHub Pages 后，把这里改成你的 Cloudflare Worker 地址。
  // 例如: "https://dongxuan-huangli.yourname.workers.dev/"
  almanacEndpoint: isLocalPreview ? "/api/huangli" : "",
};
