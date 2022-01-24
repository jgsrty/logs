import { createApp } from "vue";
import App from "./App.vue";

import errorLog from "@swhy/bw-logs/src/index";
errorLog.init({ appkey: "rty-test", isApp: true, cacheNum: 5 }, () => {
  // return store.state.userinfo;
});

createApp(App).mount("#app");