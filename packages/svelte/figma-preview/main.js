import { mount } from "svelte";
import ButtonPreview from "./ButtonPreview.svelte";
import "../src/lib/styles/tokens.css";

mount(ButtonPreview, { target: document.getElementById("app") });
