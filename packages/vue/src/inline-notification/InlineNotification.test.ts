import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Icon } from "../icon/Icon";
import { InlineNotification } from "./InlineNotification";

const baseProps = {
  title: "Heads up",
  description: "Something happened you should know about.",
};

const renderIt = (props: Record<string, unknown> = {}, slots?: Record<string, unknown>) =>
  render(InlineNotification, { props: { ...baseProps, ...props }, slots });

/** A rich body stand-in (the notifier can carry a component instead of text). */
const SampleBody = defineComponent({
  props: { name: { type: String, required: true } },
  setup(props) {
    return () => h("p", { "data-testid": "rich-body" }, `Hello ${props.name}`);
  },
});

describe("Vue InlineNotification (styled)", () => {
  it("renders a polite status region with title and body", () => {
    renderIt();
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("data-status", "info");
    expect(screen.getByText("Heads up")).toBeInTheDocument();
    expect(screen.getByText("Something happened you should know about.")).toBeInTheDocument();
  });

  it("reflects the status", () => {
    renderIt({ status: "danger" });
    expect(screen.getByRole("status")).toHaveAttribute("data-status", "danger");
  });

  it("supports an assertive alert role", () => {
    renderIt({ role: "alert" });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders a link when href is provided", () => {
    renderIt({ href: "/docs", linkText: "Read the docs" });
    const link = screen.getByRole("link", { name: "Read the docs" });
    expect(link).toHaveAttribute("href", "/docs");
  });

  it("is not dismissible by default", () => {
    renderIt();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a close button when closable and dismisses on click", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { emitted } = renderIt({ closable: true, onClose });
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(emitted("update:open")).toEqual([[false]]);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders action buttons in the actions slot", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderIt(
      {},
      {
        actions: () => [
          h("button", { type: "button", onClick: onRetry }, "Retry"),
          h("button", { type: "button" }, "Cancel"),
        ],
      },
    );
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("renders data-driven action buttons", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderIt({ actions: [{ label: "Retry", variant: "primary", onClick }] });
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is named by its title via aria-labelledby (region role included)", () => {
    renderIt({ role: "region", title: "Weekly digest" });
    expect(screen.getByRole("region", { name: "Weekly digest" })).toBeInTheDocument();
  });

  it("is controllable through the open prop", async () => {
    const { rerender } = renderIt({ open: false });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await rerender({ open: true });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("localizes the default close and link labels through the i18n catalog", () => {
    renderIt({ closable: true, href: "/changelog" });
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Learn more" })).toBeInTheDocument();
  });

  it("accepts a custom glyph through the icon slot", () => {
    const { container } = renderIt(
      {},
      {
        icon: () =>
          h(Icon, { size: "100%" }, { default: () => [h("path", { d: "M18 8A6 6 0 0 0 6 8" })] }),
      },
    );
    // The chip stays decorative (aria-hidden), so assert the slotted glyph in the DOM.
    expect(container.querySelector('.feedback-icon path[d^="M18 8A6"]')).not.toBeNull();
  });

  it("snack layout: single row, no description, icon box transparent", () => {
    const { container } = renderIt({
      snack: true,
      title: "File moved to trash",
      description: "This should not render in snack mode.",
      actions: [{ label: "Undo" }],
    });
    expect(container.querySelector(".inline-notification[data-snack]")).not.toBeNull();
    expect(screen.getByText("File moved to trash")).toBeInTheDocument();
    // Description is dropped in the snackbar layout.
    expect(container.querySelector(".inline-notification__body")).toBeNull();
    expect(screen.queryByText("This should not render in snack mode.")).not.toBeInTheDocument();
    // Icon has no box (transparent) and the action sits inline.
    expect(container.querySelector('.feedback-icon[data-box="transparent"]')).not.toBeNull();
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
  });

  it("renders a component as rich body, with its props, instead of the text", () => {
    renderIt({
      title: "Uploaded",
      description: "plain text that should be replaced",
      component: SampleBody,
      componentProps: { name: "Ada" },
    });
    expect(screen.getByTestId("rich-body")).toHaveTextContent("Hello Ada");
    expect(screen.queryByText("plain text that should be replaced")).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderIt({ status: "warning", href: "/docs", closable: true });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("snack layout has no accessibility violations", async () => {
    const { container } = renderIt({
      snack: true,
      title: "Saved",
      description: "",
      actions: [{ label: "Undo" }],
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
