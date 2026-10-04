import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LoginForm, type LoginFormProps } from "./LoginForm";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const Example = (props: Partial<LoginFormProps>) => (
  <LoginForm heading="Sign in" subheading="Welcome back" {...props} />
);

const form = () => document.querySelector<HTMLFormElement>("form.login")!;
const email = () => screen.getByRole<HTMLInputElement>("textbox", { name: "Email" });
const password = () => document.querySelector<HTMLInputElement>('input[name="password"]')!;

/** Reset the form and wait past the restore, which runs one task after the event. */
const resetAndSettle = () =>
  act(async () => {
    form().reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe("React LoginForm", () => {
  it("renders a form with email and password fields", () => {
    render(<Example />);
    expect(form()).not.toBeNull();
    expect(email()).toHaveAttribute("name", "email");
    expect(email()).toHaveAttribute("type", "email");
    expect(password()).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Password")).toBe(password());
    expect(screen.getByRole("heading", { level: 2, name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("takes its default labels from the catalog", () => {
    render(<LoginForm />);
    expect(screen.getByRole("heading", { level: 2, name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toHaveAttribute("type", "submit");
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "#");
    expect(email()).toHaveAttribute("placeholder", "you@example.com");
  });

  it("leaves the forgot-password link out for an empty href", () => {
    render(<Example forgotHref="" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("submits the typed credentials", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Example onSubmit={onSubmit} />);
    await user.type(email(), "a@b.com");
    await user.type(password(), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ email: "a@b.com", password: "secret" });
  });

  it("a reset empties what it submits, not only the fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Example onSubmit={onSubmit} />);
    await user.type(email(), "a@b.com");
    await user.type(password(), "secret");

    await resetAndSettle();
    expect(email()).toHaveValue("");
    expect(password()).toHaveValue("");
    // A reset that left any copy standing would submit what the page no
    // longer shows.
    fireEvent.submit(form());
    expect(onSubmit).toHaveBeenCalledWith({ email: "", password: "" });
  });

  it("a cancelled reset leaves what it submits alone too", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Example onSubmit={onSubmit} />);
    await user.type(email(), "a@b.com");
    form().addEventListener("reset", (event) => event.preventDefault(), { once: true });

    await resetAndSettle();
    expect(email()).toHaveValue("a@b.com");
    fireEvent.submit(form());
    expect(onSubmit).toHaveBeenCalledWith({ email: "a@b.com", password: "" });
  });

  it("renders social provider buttons when given", () => {
    render(<Example providers={[{ id: "google", label: "Google" }]} />);
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument();
    expect(screen.getByText("or")).toBeInTheDocument();
  });

  it("renders no provider area or divider without providers", () => {
    render(<Example />);
    expect(document.querySelector(".login__providers")).toBeNull();
    expect(document.querySelector(".login__divider")).toBeNull();
  });

  it("calls onProvider with the id, and does not submit", async () => {
    const user = userEvent.setup();
    const onProvider = vi.fn();
    const onSubmit = vi.fn();
    render(
      <Example
        providers={[
          { id: "google", label: "Google" },
          { id: "github", label: "GitHub" },
        ]}
        onProvider={onProvider}
        onSubmit={onSubmit}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Continue with GitHub" }));
    expect(onProvider).toHaveBeenCalledTimes(1);
    expect(onProvider).toHaveBeenCalledWith("github");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders the logo and each provider's icon", () => {
    const renderProviderIcon = vi.fn((id: string) => <svg data-testid={`icon-${id}`} />);
    render(
      <Example
        logo={<svg data-testid="logo" />}
        providers={[{ id: "google", label: "Google" }]}
        renderProviderIcon={renderProviderIcon}
      />,
    );
    expect(document.querySelector(".login__logo")).toContainElement(screen.getByTestId("logo"));
    expect(screen.getByRole("button", { name: "Continue with Google" })).toContainElement(
      screen.getByTestId("icon-google"),
    );
    expect(renderProviderIcon).toHaveBeenCalledWith("google");
  });

  it("renders no logo area without a logo", () => {
    render(<Example />);
    expect(document.querySelector(".login__logo")).toBeNull();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Example providers={[{ id: "google", label: "Google" }]} />);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
