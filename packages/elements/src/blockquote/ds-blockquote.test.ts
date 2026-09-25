import { axe } from "vitest-axe";
import "../define";

const quote = () => document.querySelector<HTMLElement>("blockquote.blockquote__quote")!;
const caption = () => document.querySelector<HTMLElement>("figcaption.blockquote__cite");
const TEXT = "Simplicity is the ultimate sophistication.";

describe("<ds-blockquote>", () => {
  it("renders the quoted text in a <blockquote> inside a figure", () => {
    document.body.innerHTML = `<ds-blockquote>${TEXT}</ds-blockquote>`;
    expect(quote()).toHaveTextContent(TEXT);
    expect(quote().parentElement).toHaveClass("blockquote");
    expect(quote().parentElement!.localName).toBe("figure");
  });

  it("renders no attribution caption by default", () => {
    document.body.innerHTML = `<ds-blockquote>${TEXT}</ds-blockquote>`;
    expect(caption()).toBeNull();
  });

  it("shows the attribution when cite is given, and removes it with the attribute", () => {
    document.body.innerHTML = `<ds-blockquote cite="Leonardo da Vinci">${TEXT}</ds-blockquote>`;
    expect(caption()).toHaveTextContent("Leonardo da Vinci");
    expect(quote()).not.toHaveTextContent("Leonardo");
    document.querySelector("ds-blockquote")!.removeAttribute("cite");
    expect(caption()).toBeNull();
  });

  it("takes a rich attribution from the cite slot", () => {
    document.body.innerHTML = `<ds-blockquote><a slot="cite" href="#source">Leonardo</a>${TEXT}</ds-blockquote>`;
    expect(caption()!.querySelector("a")).toHaveTextContent("Leonardo");
    expect(quote()).toHaveTextContent(TEXT);
    expect(quote().querySelector("a")).toBeNull();
  });

  it("maps cite-url to the native cite attribute", () => {
    document.body.innerHTML = `<ds-blockquote cite-url="https://example.com/source">${TEXT}</ds-blockquote>`;
    expect(quote()).toHaveAttribute("cite", "https://example.com/source");
  });

  it("has no accessibility violations", async () => {
    document.body.innerHTML = `<ds-blockquote cite="Leonardo da Vinci">${TEXT}</ds-blockquote>`;
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
