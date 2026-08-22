// Expressive Code configuration (auto-loaded by Starlight).
//
// Expressive Code already toggles focus on its code blocks at runtime: a
// block that scrolls gets tabindex and role="region", one that fits loses
// them again. What it never provides is an accessible NAME for the region,
// and without JavaScript it provides nothing at all.
//
// This plugin fills both holes: at build time every <pre> gets the full
// focusable, named region markup (the no-JS default), and a small script
// mirrors Expressive Code's own toggling for the label, so a block that
// stops scrolling does not keep an aria-label on a role-less <pre>.
const syncLabelWithTabindex = `try{(()=>{
const sync=(pre)=>{
  const label=pre.getAttribute("data-code-sample-label");
  if(!label)return;
  const focusable=pre.getAttribute("tabindex")!==null;
  if(focusable&&pre.getAttribute("aria-label")===null)pre.setAttribute("aria-label",label);
  if(!focusable&&pre.getAttribute("aria-label")!==null)pre.removeAttribute("aria-label");
};
const observer=new MutationObserver((muts)=>muts.forEach((m)=>sync(m.target)));
const start=()=>{
  observer.observe(document.body,{subtree:true,attributeFilter:["tabindex"]});
  document.querySelectorAll(".expressive-code pre[data-code-sample-label]").forEach(sync);
};
start();
document.addEventListener("astro:page-load",start);
})();}catch(e){console.error("[docs] code-sample label sync failed:",e)}`;

export default {
  plugins: [
    {
      name: "focusable-pre",
      hooks: {
        postprocessRenderedBlock: ({ codeBlock, renderData }) => {
          const label = codeBlock.language ? `Code sample, ${codeBlock.language}` : "Code sample";
          const visit = (node) => {
            if (node.tagName === "pre") {
              node.properties ??= {};
              node.properties.tabindex = 0;
              node.properties.role = "region";
              node.properties["aria-label"] = label;
              node.properties["data-code-sample-label"] = label;
            }
            for (const child of node.children ?? []) {
              if (child.type === "element") visit(child);
            }
          };
          visit(renderData.blockAst);
        },
      },
      jsModules: [syncLabelWithTabindex],
    },
  ],
};
