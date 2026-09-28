// The Vue visual page; the scenes are in VueVisual.vue.
import "./theme";
import "@design-system/vue/styles.css";
import "./visual.css";
import { createApp } from "vue";
import VueVisual from "./VueVisual.vue";

createApp(VueVisual).mount("#app");
