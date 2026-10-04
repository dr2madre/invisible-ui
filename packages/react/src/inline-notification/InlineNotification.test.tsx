import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Button } from "../button/Button";
import { Icon } from "../icon/Icon";
import { InlineNotification, type InlineNotificationProps } from "./InlineNotification";

const Example = (props: Partial<InlineNotificationProps>) => (
  <InlineNotification
    title="Heads up"
    description="Something happened you should know about."
    {...props}
  />
);

describe("React InlineNotification", () => {
  it("renders a polite status region named by its title, with the body", () => {
    render(<Example />);
    const region = screen.getByRole("status", { name: "Heads up" });
    expect(region).toHaveAttribute("data-status", "info");
    expect(screen.getByText("Something happened you should know about.")).toHaveClass(
      "inline-notification__body",
    );
    // The icon is decorative and transparent on the tinted surface.
    const icon = region.querySelector(".feedback-icon")!;
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("data-box", "transparent");
  });

  it("reflects the status", () => {
    render(<Example status="danger" />);
    expect(screen.getByRole("status")).toHaveAttribute("data-status", "danger");
  });

  it("supports an assertive alert role", () => {
    render(<Example role="alert" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("is a named group, not a live region, with the group role", () => {
    render(<Example role="group" />);
    expect(screen.getByRole("group", { name: "Heads up" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renders a link when href is provided", () => {
    render(<Example href="/docs" linkText="Read the docs" />);
    expect(screen.getByRole("link", { name: "Read the docs" })).toHaveAttribute("href", "/docs");
  });

  it("takes link markup of its own", () => {
    render(<Example href="/ignored" link={<a href="/custom">Custom link</a>} />);
    expect(screen.getByRole("link", { name: "Custom link" })).toHaveAttribute("href", "/custom");
    expect(screen.queryByRole("link", { name: "Learn more" })).toBeNull();
  });

  it("is not dismissible by default", () => {
    render(<Example />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a close button when closable and dismisses on click", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onOpenChange = vi.fn();
    render(<Example closable onClose={onClose} onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders action markup of its own", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <Example
        status="danger"
        title="Payment failed"
        actions={
          <>
            <Button variant="primary" onPress={onRetry}>
              Retry
            </Button>
            <Button variant="ghost">Cancel</Button>
          </>
        }
      />,
    );
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Cancel" }).parentElement).toHaveClass(
      "inline-notification__actions",
    );
  });

  it("renders data-driven action buttons, ghost by default", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Example actions={[{ label: "Retry", variant: "primary", onClick }, { label: "Later" }]} />,
    );
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Later" })).toHaveAttribute("data-variant", "ghost");
  });

  it("is named by its title via aria-labelledby (region role included)", () => {
    render(<Example role="region" title="Weekly digest" />);
    expect(screen.getByRole("region", { name: "Weekly digest" })).toBeInTheDocument();
  });

  it("is controllable through the open prop", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Show
          </button>
          <Example closable open={open} onOpenChange={setOpen} />
        </>
      );
    }
    render(<Controlled />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show" }));
    expect(screen.getByRole("status")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    // Shown again once the parent sets it back.
    await user.click(screen.getByRole("button", { name: "Show" }));
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("localizes the default close and link labels through the catalog", () => {
    render(<Example closable href="/changelog" />);
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Learn more" })).toBeInTheDocument();
  });

  it("accepts a custom glyph for the icon, on a plain surface with a tinted chip", () => {
    render(
      <Example
        plain
        icon={
          <Icon label="bell">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          </Icon>
        }
      />,
    );
    expect(document.querySelector(".inline-notification")).toHaveAttribute("data-plain");
    expect(
      document.querySelector('.feedback-icon[data-box="tint"] path[d^="M18 8A6"]'),
    ).not.toBeNull();
  });

  it("snack layout: single row, no description, icon box transparent", () => {
    const { container } = render(
      <Example
        snack
        inverted
        title="File moved to trash"
        description="This should not render in snack mode."
        actions={[{ label: "Undo" }]}
      />,
    );
    expect(
      container.querySelector(".inline-notification[data-snack][data-inverted]"),
    ).not.toBeNull();
    expect(screen.getByText("File moved to trash")).toBeInTheDocument();
    expect(container.querySelector(".inline-notification__body")).toBeNull();
    expect(container.querySelector('.feedback-icon[data-box="transparent"]')).not.toBeNull();
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
  });

  it("renders a component as rich body, with its props, instead of the text", () => {
    const SampleBody = ({ name }: { name: string }) => <p data-testid="rich-body">Hello {name}</p>;
    render(
      <Example
        title="Uploaded"
        description="plain text that should be replaced"
        component={SampleBody}
        componentProps={{ name: "Ada" }}
      />,
    );
    expect(screen.getByTestId("rich-body")).toHaveTextContent("Hello Ada");
    expect(screen.queryByText("plain text that should be replaced")).not.toBeInTheDocument();
  });

  it("renders children as rich body in place of the description", () => {
    render(
      <Example>
        <strong>Rich</strong> body
      </Example>,
    );
    expect(document.querySelector(".inline-notification__body")).toHaveTextContent("Rich body");
    expect(screen.queryByText("Something happened you should know about.")).toBeNull();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Example status="warning" href="/docs" closable />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("snack layout has no accessibility violations", async () => {
    const { container } = render(<Example snack title="Saved" actions={[{ label: "Undo" }]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
