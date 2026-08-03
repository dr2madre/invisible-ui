/**
 * Shared reading layer over the generated API manifests
 * (packages/docs/src/generated/props/<component>.json, written by
 * `pnpm api:generate`). PropsTable and ImportSnippet both build their tab strip
 * from the frameworks a manifest carries, so a component page shows exactly the
 * adapters that ship it.
 */

export type FrameworkId = "svelte" | "vue" | "react" | "elements";

export interface PropRow {
  name: string;
  type: string;
  default: string | null;
  required: boolean;
  description: string;
}

export interface EmitRow {
  name: string;
  payload: string;
}

export interface AttributeRow {
  name: string;
  reactive: boolean;
  required: boolean;
  description: string;
}

export interface ImportInfo {
  /** `default` (Svelte file import), `named` (Vue, React) or `element` (a `ds-*` tag). */
  kind: "default" | "named" | "element";
  /** Component name, or the tag name for a custom element. */
  name: string;
  specifier: string;
}

export interface FrameworkApi {
  import: ImportInfo;
  props?: PropRow[];
  emits?: EmitRow[];
  slots?: string[];
  /** Interfaces the React props extend, e.g. the native button attributes. */
  extends?: string[];
  attributes?: AttributeRow[];
  /** Properties and events of a custom element, as written in its source. */
  notes?: string[];
}

export interface Manifest {
  component: string;
  selected: boolean;
  frameworks: Partial<Record<FrameworkId, FrameworkApi>>;
}

/** Tab order. Svelte comes first and is the default tab. */
export const FRAMEWORK_ORDER: FrameworkId[] = ["svelte", "vue", "react", "elements"];

export const FRAMEWORK_LABELS: Record<FrameworkId, string> = {
  svelte: "Svelte",
  vue: "Vue",
  react: "React",
  elements: "Web components",
};

/** Highlighting language for each adapter's import snippet. */
export const FRAMEWORK_LANGUAGES: Record<FrameworkId, string> = {
  svelte: "svelte",
  vue: "vue",
  react: "tsx",
  elements: "html",
};

const manifests = import.meta.glob<{ default: Manifest }>("../generated/props/*.json", {
  eager: true,
});

export const loadManifest = (component: string): Manifest | undefined =>
  manifests[`../generated/props/${component}.json`]?.default;

/** The adapters a component ships in, in tab order. */
export const frameworksOf = (manifest: Manifest): FrameworkId[] =>
  FRAMEWORK_ORDER.filter((id) => manifest.frameworks[id]);

/**
 * Descriptions are prose that may mention HTML (`<fieldset>`) and inline code
 * (`false`); escape everything, then turn markdown inline code into <code>.
 */
export const renderDescription = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
