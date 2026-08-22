// Expressive Code configuration (auto-loaded by Starlight).
//
// A keyboard user must be able to scroll a wide code block: every rendered
// <pre> becomes a focusable, named region (WCAG 2.1.1 for scrollable areas).
export default {
  plugins: [
    {
      name: "focusable-pre",
      hooks: {
        postprocessRenderedBlock: ({ codeBlock, renderData }) => {
          const visit = (node) => {
            if (node.tagName === "pre") {
              node.properties ??= {};
              node.properties.tabindex = 0;
              node.properties.role = "region";
              node.properties["aria-label"] = codeBlock.language
                ? `Code sample, ${codeBlock.language}`
                : "Code sample";
            }
            for (const child of node.children ?? []) {
              if (child.type === "element") visit(child);
            }
          };
          visit(renderData.blockAst);
        },
      },
    },
  ],
};
