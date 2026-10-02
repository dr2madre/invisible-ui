import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsLoginForm, LoginFormValue } from "./ds-login-form";

const mount = (attrs = `heading="Sign in" subheading="Welcome back"`, body = "") => {
  document.body.innerHTML = `<ds-login-form ${attrs}>${body}</ds-login-form>`;
  return document.querySelector("ds-login-form") as DsLoginForm;
};

const form = () => document.querySelector<HTMLFormElement>("form.login")!;
const email = () => screen.getByRole("textbox", { name: "Email" }) as HTMLInputElement;
const password = () => screen.getByLabelText("Password") as HTMLInputElement;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("<ds-login-form>", () => {
  it("renders a form with named email and password inputs", () => {
    mount();
    expect(form()).not.toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Sign in" })).toBeVisible();
    expect(screen.getByText("Welcome back")).toHaveClass("login__subheading");
    expect(email()).toHaveAttribute("name", "email");
    expect(email()).toHaveAttribute("type", "email");
    expect(password()).toHaveAttribute("name", "password");
    expect(password()).toHaveAttribute("type", "password");
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "#");
    expect(screen.getByRole("button", { name: "Sign in" })).toHaveAttribute("type", "submit");
  });

  it("reports the typed credentials and keeps them in the form data", async () => {
    const user = userEvent.setup();
    const host = mount();
    const seen: LoginFormValue[] = [];
    host.addEventListener("submit", (event) => {
      if (event instanceof CustomEvent) seen.push(event.detail);
    });

    await user.type(email(), "a@b.com");
    await user.type(password(), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(seen).toEqual([{ email: "a@b.com", password: "secret" }]);
    const data = new FormData(form());
    expect(data.get("email")).toBe("a@b.com");
    expect(data.get("password")).toBe("secret");
  });

  it("submits natively to its action unless a listener cancels", () => {
    const host = mount(`action="/session" method="post"`);
    expect(form()).toHaveAttribute("method", "post");
    expect(form().getAttribute("action")).toBe("/session");

    const native = new Event("submit", { bubbles: true, cancelable: true });
    form().dispatchEvent(native);
    expect(native.defaultPrevented).toBe(false);

    host.addEventListener("submit", (event) => event.preventDefault(), { once: true });
    const cancelled = new Event("submit", { bubbles: true, cancelable: true });
    form().dispatchEvent(cancelled);
    expect(cancelled.defaultPrevented).toBe(true);
  });

  it("keeps the native submission inside when there is no action", () => {
    const host = mount();
    const listener = vi.fn();
    host.addEventListener("submit", listener);
    const native = new Event("submit", { bubbles: true, cancelable: true });
    form().dispatchEvent(native);
    expect(native.defaultPrevented).toBe(true);
    // Only the typed report reaches the host.
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]![0]).toBeInstanceOf(CustomEvent);
  });

  it("a form reset empties the fields and the next report", async () => {
    const user = userEvent.setup();
    const host = mount();
    const seen: LoginFormValue[] = [];
    host.addEventListener("submit", (event) => {
      if (event instanceof CustomEvent) seen.push(event.detail);
    });
    await user.type(email(), "a@b.com");
    await user.type(password(), "secret");

    form().reset();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(email()).toHaveValue("");
    expect(password()).toHaveValue("");
    form().requestSubmit();
    expect(seen).toEqual([{ email: "", password: "" }]);
  });

  it("reacts to label attributes and hides the forgot link on an empty href", () => {
    const host = mount();
    host.setAttribute("submit-label", "Log in");
    host.setAttribute("forgot-label", "Reset password");
    host.setAttribute("forgot-href", "/reset");
    expect(screen.getByRole("button", { name: "Log in" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Reset password" })).toHaveAttribute("href", "/reset");
    host.setAttribute("forgot-href", "");
    expect(screen.queryByRole("link")).toBeNull();
    host.removeAttribute("subheading");
    expect(document.querySelector(".login__subheading")).toBeNull();
  });

  it("renders provider buttons with their icons and reports the chosen one", async () => {
    const user = userEvent.setup();
    const host = mount(
      "",
      `<img slot="logo" src="/logo.svg" alt="Acme">
       <svg slot="provider-icon" data-provider="google" aria-hidden="true"></svg>`,
    );
    expect(document.querySelector(".login__divider")).toBeNull();
    host.providers = [
      { id: "google", label: "Google" },
      { id: "github", label: "GitHub" },
    ];
    const onProvider = vi.fn();
    host.addEventListener("provider", (event) => onProvider((event as CustomEvent).detail.id));

    expect(document.querySelector(".login__logo")).toContainElement(
      screen.getByRole("img", { name: "Acme" }),
    );
    expect(document.querySelector(".login__divider")).toHaveTextContent("or");
    const google = screen.getByRole("button", { name: "Continue with Google" });
    expect(google.querySelector(".button__icon svg")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Continue with GitHub" }).querySelector(".button__icon"),
    ).toBeNull();
    // Provider buttons do not submit the form.
    expect(google).toHaveAttribute("type", "button");

    await user.click(google);
    expect(onProvider).toHaveBeenCalledWith("google");

    host.providers = [];
    expect(document.querySelector(".login__providers")).toBeNull();
  });

  it("has no accessibility violations", async () => {
    mount().providers = [{ id: "google", label: "Google" }];
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("<ds-login-form> input purpose", () => {
  it("names the purpose of the email and password fields for autofill", () => {
    document.body.innerHTML = `<ds-login-form></ds-login-form>`;
    const form = document.querySelector("ds-login-form")!;
    expect(form.querySelector('input[name="email"]')).toHaveAttribute("autocomplete", "username");
    expect(form.querySelector('input[name="password"]')).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
  });
});
