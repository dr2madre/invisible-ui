import { fireEvent, render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Button } from "../button/Button";
import { LocaleProvider } from "../i18n/i18n";
import { Dialog } from "./Dialog";
import { useDialog, type DialogRole } from "./use-dialog";

// Native <dialog>: backdrop presses target the element itself, with
// coordinates outside its box.
const pressBackdrop = (panel: HTMLElement) =>
  fireEvent.pointerDown(panel, { clientX: -10, clientY: -10 });

const basicProps = {
  title: "Share this file",
  description: "Anyone with the link can view it.",
  trigger: "Open dialog",
};

const renderBasic = (props: Record<string, unknown> = {}) =>
  render(Dialog, {
    props: { ...basicProps, ...props },
    slots: { default: () => h("p", "Body content") },
  });

describe("Vue Dialog (styled)", () => {
  it("is closed by default with the trigger advertising the dialog", () => {
    renderBasic();
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as a modal, named and described, with focus moved inside", async () => {
    const user = userEvent.setup();
    renderBasic();

    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    const panel = screen.getByRole("dialog", { name: "Share this file" });
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect(panel).toHaveAccessibleDescription("Anyone with the link can view it.");
    // Focus lands on the panel itself, never on the close button.
    expect(panel).toHaveFocus();
  });

  it("is a native <dialog> shown modally (the inert background is the browser's)", async () => {
    const user = userEvent.setup();
    renderBasic();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    const panel = screen.getByRole("dialog") as HTMLDialogElement;
    expect(panel.tagName).toBe("DIALOG");
    expect(panel.open).toBe(true);
  });

  it("is modal from the start when mounted already open", async () => {
    renderBasic({ open: true });

    // showModal() must run for a panel that exists at mount, exactly as for a
    // later open: the platform's top layer and inert background, not a bare
    // rendered <dialog>.
    const panel = (await screen.findByRole("dialog", {
      name: "Share this file",
    })) as HTMLDialogElement;
    expect(panel.open).toBe(true);
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect(panel).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("opens and closes when the open prop changes", async () => {
    const { rerender } = renderBasic({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await rerender({ ...basicProps, open: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await rerender({ ...basicProps, open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("supports v-model:open: emits update:open on both edges", async () => {
    const user = userEvent.setup();
    const { emitted } = renderBasic();

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await user.keyboard("{Escape}");
    expect(emitted("update:open")).toEqual([[true], [false]]);
  });

  it("locks body scroll while open and restores it on close", async () => {
    const user = userEvent.setup();
    renderBasic();

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderBasic();
    const trigger = screen.getByRole("button", { name: "Open dialog" });

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes via the close button", async () => {
    const user = userEvent.setup();
    renderBasic();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("takes the close label from the locale catalog", async () => {
    const user = userEvent.setup();
    render(LocaleProvider, {
      props: { messages: { "dialog.close": "Chiudi" } },
      slots: { default: () => h(Dialog, { ...basicProps }) },
    });

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("button", { name: "Chiudi" })).toBeInTheDocument();
  });

  it("closes on a backdrop press", async () => {
    const user = userEvent.setup();
    renderBasic();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    await pressBackdrop(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the dialog open on a backdrop press when opted out", async () => {
    const user = userEvent.setup();
    renderBasic({ closeOnOutsideClick: false });
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    await pressBackdrop(screen.getByRole("dialog"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("honours initialFocus", async () => {
    const user = userEvent.setup();
    render(Dialog, {
      props: { title: "Rename", trigger: "Open dialog", initialFocus: ".target" },
      slots: { default: () => h("input", { class: "target", "aria-label": "New name" }) },
    });

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("textbox", { name: "New name" })).toHaveFocus();
  });

  it("reports open-state changes", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderBasic({ onOpenChange });

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps a hidden title as the accessible name", async () => {
    const user = userEvent.setup();
    renderBasic({ hideTitle: true });
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    const panel = screen.getByRole("dialog", { name: "Share this file" });
    expect(panel.querySelector(".dialog__title")).toHaveClass("dialog__title--hidden");
  });

  it("renders footer actions and an optional footer close", async () => {
    const user = userEvent.setup();
    render(Dialog, {
      props: { ...basicProps, footerClose: true },
      slots: {
        default: () => h("p", "Body content"),
        footer: () => h(Button, { variant: "primary" }, { default: () => "Save" }),
      },
    });
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    // Two "Close": the header ✕ and the footer button.
    expect(screen.getAllByRole("button", { name: "Close" })).toHaveLength(2);
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { container } = renderBasic();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Vue Dialog (stacked)", () => {
  /** An outer dialog whose footer opens a second, confirming dialog. */
  const Nested = defineComponent({
    setup() {
      const confirmOpen = ref(false);
      return () =>
        h(
          Dialog,
          { title: "Edit profile", trigger: "Open dialog" },
          {
            default: () => h("p", "Body content"),
            footer: () => [
              h(
                Button,
                { onPress: () => (confirmOpen.value = true) },
                { default: () => "Discard" },
              ),
              h(
                Dialog,
                {
                  title: "Discard changes?",
                  trigger: "hidden",
                  open: confirmOpen.value,
                  "onUpdate:open": (next: boolean) => (confirmOpen.value = next),
                },
                { default: () => h("p", "Your edits will be lost.") },
              ),
            ],
          },
        );
    },
  });

  it("stacks a second dialog; Escape closes only the innermost", async () => {
    const user = userEvent.setup();
    render(Nested);

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(2);

    // The core stops Escape from bubbling, so only the inner dialog closes.
    await user.keyboard("{Escape}");
    const remaining = screen.getAllByRole("dialog");
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toHaveAccessibleName("Edit profile");
  });
});

/**
 * The headless layer with markup the consumer owns, the reason the composable
 * is exported. Nothing here uses the styled `Dialog`.
 */
const Bare = defineComponent({
  props: {
    role: { type: String as () => DialogRole, default: undefined },
    describedBy: { type: Boolean, default: false },
  },
  setup(props) {
    const { api, open, triggerRef, panelRef } = useDialog(() => ({
      role: props.role,
      describedBy: props.describedBy,
    }));

    return () => [
      h("button", { ...api.value.triggerProps, ref: triggerRef, type: "button" }, "Open"),
      open.value
        ? h("dialog", { ...api.value.contentProps, ref: panelRef }, [
            h("h2", api.value.titleProps, "Careful"),
            props.describedBy ? h("p", api.value.descriptionProps, "This cannot be undone.") : null,
            h("button", { ...api.value.closeProps, type: "button" }, "Close"),
          ])
        : null,
    ];
  },
});

describe("useDialog (headless)", () => {
  it("drives a consumer's own markup", async () => {
    const user = userEvent.setup();
    render(Bare);

    await user.click(screen.getByRole("button", { name: "Open" }));
    const panel = screen.getByRole("dialog", { name: "Careful" });
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect((panel as HTMLDialogElement).open).toBe(true);
  });

  it("opts into the alertdialog role", async () => {
    const user = userEvent.setup();
    render(Bare, { props: { role: "alertdialog" } });

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("alertdialog", { name: "Careful" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("wires aria-describedby only when a description is present", async () => {
    const user = userEvent.setup();
    const { rerender } = render(Bare);

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-describedby");

    await user.keyboard("{Escape}");
    await rerender({ describedBy: true });
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription("This cannot be undone.");
  });

  it("closes through the close prop bag", async () => {
    const user = userEvent.setup();
    render(Bare);

    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
