import { defineComponent, h, ref, watch, type PropType } from "vue";

/** Derive up to two initials from a name (first + last word). */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export interface AvatarProps {
  /** Required: accessible name + initials fallback. */
  name: string;
  /** Image URL. When absent or it fails to load, initials are shown. */
  src?: string;
  /** Accessible name; defaults to `name`. */
  alt?: string;
  size?: "sm" | "md" | "lg";
  shape?: "circle" | "square";
}

/**
 * Avatar: a small account image that falls back to the account's initials
 * when no image is set or the image fails to load.
 *
 * `name` is required: it provides both the accessible name and the initials
 * fallback. The whole avatar is exposed as a single image to assistive tech
 * (`role="img"` + `aria-label`), so it reads the same whether the photo or the
 * initials are showing. Size/shape/colors are themeable (`--ds-avatar-*`).
 */
export const Avatar = defineComponent({
  name: "Avatar",
  props: {
    name: { type: String, required: true },
    src: { type: String, default: undefined },
    alt: { type: String, default: undefined },
    size: { type: String as PropType<"sm" | "md" | "lg">, default: "md" },
    shape: { type: String as PropType<"circle" | "square">, default: "circle" },
  },
  setup(props) {
    const failed = ref(false);

    // Reset the failure flag if the src changes.
    watch(
      () => props.src,
      () => {
        failed.value = false;
      },
    );

    return () => {
      const showImage = Boolean(props.src) && !failed.value;

      return h(
        "span",
        {
          class: "avatar",
          "data-size": props.size,
          "data-shape": props.shape,
          role: "img",
          "aria-label": props.alt ?? props.name,
        },
        [
          showImage
            ? h("img", {
                class: "avatar__img",
                src: props.src,
                alt: "",
                onError: () => {
                  failed.value = true;
                },
              })
            : h(
                "span",
                { class: "avatar__initials", "aria-hidden": "true" },
                initialsOf(props.name),
              ),
        ],
      );
    };
  },
});
