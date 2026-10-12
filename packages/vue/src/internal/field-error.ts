import { h, type VNode } from "vue";
import { HazardGlyph, Icon } from "../icon/Icon";
import { useStableId } from "./use-stable-id";

/**
 * The error message of a value control, rendered the way `TextField` renders
 * its own: a `role="alert"` paragraph led by the hazard glyph. Call it during
 * setup; the returned function, called while rendering, gives the id the
 * controls name in `aria-describedby` and the paragraph, both only while
 * `text` is non-empty.
 */
export function useFieldError(
  prefix: string,
  text: () => string | undefined,
): () => [id?: string, message?: VNode] {
  const id = `${useStableId(prefix)}-error`;
  return () => {
    const error = text();
    return error
      ? [
          id,
          h("p", { id, class: "field__error field__message", role: "alert" }, [
            h("span", { class: "field__msg-icon", "aria-hidden": "true" }, [
              h(Icon, { size: "1em" }, { default: HazardGlyph }),
            ]),
            error,
          ]),
        ]
      : [];
  };
}
