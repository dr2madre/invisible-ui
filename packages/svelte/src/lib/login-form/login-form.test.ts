import { render, fireEvent } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./login-form.fixture.svelte";

describe("LoginForm", () => {
  it("renders a form with email and password fields", () => {
    render(Fixture);
    expect(document.querySelector("form.login")).not.toBeNull();
    expect(document.querySelector('input[name="email"]')).not.toBeNull();
    expect(document.querySelector('input[name="password"]')).not.toBeNull();
  });

  it("submits the typed credentials", async () => {
    const onSubmit = vi.fn();
    render(Fixture, { props: { onSubmit } });
    const email = document.querySelector<HTMLInputElement>('input[name="email"]')!;
    const password = document.querySelector<HTMLInputElement>('input[name="password"]')!;
    await fireEvent.input(email, { target: { value: "a@b.com" } });
    await fireEvent.input(password, { target: { value: "secret" } });
    await fireEvent.submit(document.querySelector("form.login")!);
    expect(onSubmit).toHaveBeenCalledWith({ email: "a@b.com", password: "secret" });
  });

  it("renders social provider buttons when given", () => {
    render(Fixture, { props: { providers: [{ id: "google", label: "Google" }] } });
    expect(document.body.textContent).toContain("Continue with Google");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container)).toHaveNoViolations();
  });
});
