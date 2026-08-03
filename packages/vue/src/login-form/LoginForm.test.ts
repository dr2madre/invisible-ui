import { fireEvent, render } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LoginForm } from "./LoginForm";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Vue LoginForm", () => {
  it("renders a form with email and password fields", () => {
    render(LoginForm);
    expect(document.querySelector("form.login")).not.toBeNull();
    expect(document.querySelector('input[name="email"]')).not.toBeNull();
    expect(document.querySelector('input[name="password"]')).not.toBeNull();
  });

  it("submits the typed credentials", async () => {
    const onSubmit = vi.fn();
    render(LoginForm, { props: { onSubmit } });
    const email = document.querySelector<HTMLInputElement>('input[name="email"]')!;
    const password = document.querySelector<HTMLInputElement>('input[name="password"]')!;
    await fireEvent.update(email, "a@b.com");
    await fireEvent.update(password, "secret");
    await fireEvent.submit(document.querySelector("form.login")!);
    expect(onSubmit).toHaveBeenCalledWith({ email: "a@b.com", password: "secret" });
  });

  it("renders social provider buttons when given", () => {
    render(LoginForm, { props: { providers: [{ id: "google", label: "Google" }] } });
    expect(document.body.textContent).toContain("Continue with Google");
  });

  it("calls onProvider when a provider button is pressed", async () => {
    const onProvider = vi.fn();
    render(LoginForm, {
      props: { providers: [{ id: "google", label: "Google" }], onProvider },
    });
    await fireEvent.click(document.querySelector(".login__providers button")!);
    expect(onProvider).toHaveBeenCalledWith("google");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(LoginForm);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
