import { checkIcon, dashIcon } from "./icons";

describe("Elements SVG icons", () => {
  it.each([
    ["check", checkIcon("checkbox__glyph checkbox__check")],
    ["dash", dashIcon("checkbox__glyph checkbox__dash")],
  ])("renders one class attribute on the %s glyph", (_name, markup) => {
    expect(markup.match(/\sclass=/g)).toHaveLength(1);
  });
});
