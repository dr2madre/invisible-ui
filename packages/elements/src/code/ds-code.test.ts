import { axe } from "vitest-axe";
import "../define";

const mount = (markup: string) => {
  document.body.innerHTML = markup;
  return document.querySelector("ds-code") as HTMLElement;
};

describe("<ds-code>", () => {
  it("renders its content inside a <code> element", () => {
    mount(`<p>Run <ds-code>npm install</ds-code> to get started.</p>`);
    const el = document.querySelector("code.code")!;
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent("npm install");
  });

  it("keeps a hostile string as text", () => {
    const host = document.createElement("ds-code");
    host.textContent = `<img src=x onerror="window.__pwned = true">`;
    document.body.replaceChildren(host);
    const code = host.querySelector("code.code")!;
    expect(code.querySelector("img")).toBeNull();
    expect(code).toHaveTextContent(`<img src=x onerror="window.__pwned = true">`);
  });

  it("wraps its content once across reconnection", () => {
    const host = mount(`<p><ds-code>--force</ds-code></p>`);
    const parent = host.parentElement!;
    host.remove();
    parent.appendChild(host);
    expect(host.querySelectorAll("code")).toHaveLength(1);
    expect(host).toHaveTextContent("--force");
  });

  it("has no accessibility violations", async () => {
    mount(`<main><p>Run <ds-code>npm install</ds-code> to get started.</p></main>`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
