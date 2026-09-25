import { HTMLElementBase, upgradeProperty } from "../internal/base";

/** A social sign-in provider rendered as a button above the fields. */
export interface LoginFormProvider {
  id: string;
  label: string;
}

/** The credentials a submit reports. */
export interface LoginFormValue {
  email: string;
  password: string;
}

/**
 * `<ds-login-form>` is a sign-in form composed from `ds-text-field` and
 * `ds-button`, which must be registered too: an optional logo, optional
 * social-login buttons, the email and password fields, a "forgot password"
 * link and the submit button.
 *
 * Light DOM: a real `<form>` with native inputs named `email` and `password`,
 * so the browser owns autofill, form data and reset. A submit emits a
 * cancelable `submit` CustomEvent. Without `action` the page handles it and
 * the native submission never runs. With `action`, the form submits natively
 * to that URL unless a listener cancels the event.
 *
 * A child with `slot="logo"` fills the logo area. A child with
 * `slot="provider-icon"` and `data-provider="<id>"` becomes that provider's
 * button icon.
 *
 * Attributes: `heading`, `subheading`, `submit-label`, `forgot-href` (an empty
 * value hides the link), `forgot-label`, `action`, `method`.
 * Properties: `providers` (`{ id, label }[]`).
 * Emits: bubbling, cancelable `submit` CustomEvent with `detail.email` and
 * `detail.password`; bubbling `provider` CustomEvent with `detail.id` when a
 * provider button is pressed.
 */
export class DsLoginForm extends HTMLElementBase {
  static observedAttributes = [
    "heading",
    "subheading",
    "submit-label",
    "forgot-href",
    "forgot-label",
    "action",
    "method",
  ];

  #form: HTMLFormElement | null = null;
  #head: HTMLDivElement | null = null;
  #heading: HTMLHeadingElement | null = null;
  #subheading: HTMLParagraphElement | null = null;
  #providersList: HTMLDivElement | null = null;
  #divider: HTMLDivElement | null = null;
  #passwordField: HTMLDivElement | null = null;
  #forgot: HTMLAnchorElement | null = null;
  #submitLabel: Text | null = null;
  #providers: LoginFormProvider[] = [];
  #providerIcons = new Map<string, Element>();

  connectedCallback() {
    upgradeProperty(this, "providers");
    if (!this.#form) this.#render();
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#form) this.#sync();
  }

  get providers(): LoginFormProvider[] {
    return this.#providers;
  }
  set providers(value: LoginFormProvider[]) {
    this.#providers = Array.isArray(value) ? value : [];
    if (this.#form) this.#renderProviders();
  }

  #render() {
    const logo: Node[] = [];
    for (const node of Array.from(this.childNodes)) {
      const slot = node instanceof Element ? node.getAttribute("slot") : null;
      if (slot === "logo") {
        (node as Element).removeAttribute("slot");
        logo.push(node);
      } else if (slot === "provider-icon") {
        const id = (node as Element).getAttribute("data-provider");
        (node as Element).removeAttribute("slot");
        if (id) this.#providerIcons.set(id, node as Element);
      }
    }
    this.textContent = "";

    const form = document.createElement("form");
    form.className = "login";
    form.addEventListener("submit", (event) => this.#onSubmit(event));

    if (logo.length) {
      const wrap = document.createElement("div");
      wrap.className = "login__logo";
      wrap.append(...logo);
      form.appendChild(wrap);
    }

    const head = document.createElement("div");
    head.className = "login__head";
    const heading = document.createElement("h2");
    heading.className = "login__heading";
    head.appendChild(heading);
    form.appendChild(head);

    const providers = document.createElement("div");
    providers.className = "login__providers";
    const divider = document.createElement("div");
    divider.className = "login__divider";
    const or = document.createElement("span");
    or.textContent = "or";
    divider.appendChild(or);

    const email = document.createElement("ds-text-field");
    email.setAttribute("label", "Email");
    email.setAttribute("type", "email");
    email.setAttribute("name", "email");
    email.setAttribute("placeholder", "you@example.com");
    form.appendChild(email);

    const passwordField = document.createElement("div");
    passwordField.className = "login__field";
    const password = document.createElement("ds-text-field");
    password.setAttribute("label", "Password");
    password.setAttribute("type", "password");
    password.setAttribute("name", "password");
    passwordField.appendChild(password);
    form.appendChild(passwordField);

    const submit = document.createElement("ds-button");
    submit.setAttribute("variant", "primary");
    submit.setAttribute("type", "submit");
    // Held as a text node: ds-button moves its children into its own button,
    // and the node keeps working wherever it ends up.
    const submitLabel = document.createTextNode("");
    submit.appendChild(submitLabel);
    form.appendChild(submit);

    this.appendChild(form);
    this.#form = form;
    this.#heading = heading;
    this.#head = head;
    this.#providersList = providers;
    this.#divider = divider;
    this.#passwordField = passwordField;
    this.#submitLabel = submitLabel;
    this.#renderProviders();
  }

  #sync() {
    const form = this.#form!;
    this.#heading!.textContent = this.getAttribute("heading") ?? "Sign in";

    const subheading = this.getAttribute("subheading");
    if (subheading) {
      this.#subheading ??= document.createElement("p");
      this.#subheading.className = "login__subheading";
      this.#subheading.textContent = subheading;
      this.#head!.appendChild(this.#subheading);
    } else {
      this.#subheading?.remove();
      this.#subheading = null;
    }

    const href = this.getAttribute("forgot-href") ?? "#";
    if (href) {
      this.#forgot ??= document.createElement("a");
      this.#forgot.className = "login__forgot";
      this.#forgot.href = href;
      this.#forgot.textContent = this.getAttribute("forgot-label") ?? "Forgot password?";
      this.#passwordField!.appendChild(this.#forgot);
    } else {
      this.#forgot?.remove();
      this.#forgot = null;
    }

    this.#submitLabel!.data = this.getAttribute("submit-label") ?? "Sign in";

    for (const attr of ["action", "method"] as const) {
      const value = this.getAttribute(attr);
      if (value != null) form.setAttribute(attr, value);
      else form.removeAttribute(attr);
    }
  }

  #renderProviders() {
    const list = this.#providersList!;
    list.textContent = "";
    for (const provider of this.#providers) {
      const button = document.createElement("ds-button");
      button.setAttribute("variant", "default");
      const icon = this.#providerIcons.get(provider.id);
      if (icon) {
        const wrap = document.createElement("span");
        wrap.className = "button__icon";
        wrap.appendChild(icon.cloneNode(true));
        button.appendChild(wrap);
      }
      button.append(`Continue with ${provider.label}`);
      button.addEventListener("click", () => {
        this.dispatchEvent(
          new CustomEvent("provider", { detail: { id: provider.id }, bubbles: true }),
        );
      });
      list.appendChild(button);
    }
    // The list and its "or" divider exist only while there are providers.
    if (this.#providers.length) this.#head!.after(list, this.#divider!);
    else {
      list.remove();
      this.#divider!.remove();
    }
  }

  #onSubmit(event: SubmitEvent) {
    // The host reports a typed, cancelable `submit`; the native one stays inside.
    event.stopPropagation();
    const form = this.#form!;
    const read = (name: string) =>
      form.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.value ?? "";
    const detail: LoginFormValue = { email: read("email"), password: read("password") };
    const report = new CustomEvent<LoginFormValue>("submit", {
      detail,
      bubbles: true,
      cancelable: true,
    });
    const proceed = this.dispatchEvent(report);
    if (!proceed || !form.hasAttribute("action")) event.preventDefault();
  }
}
