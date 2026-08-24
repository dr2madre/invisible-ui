// Expressive Code configuration (auto-loaded by Starlight).
//
// Expressive Code already toggles focus on its code blocks at runtime: a
// block that scrolls gets tabindex and role="region", one that fits loses
// them again. Two problems remain. It never gives the block a name, and
// without JavaScript it gives it nothing at all; and "region" makes every
// scrollable sample a landmark, so a page with several samples of the same
// language fills the landmark list with identical entries.
//
// This plugin renders the full focusable, named markup at build time (the
// no-JS default) and keeps it correct at runtime: the sample is a named
// group, which assistive technology still announces, and never a landmark.
const CODE_SAMPLE_ROLE = "group";
const syncWithTabindex = `try{(()=>{
const ROLE=${JSON.stringify(CODE_SAMPLE_ROLE)};
const sync=(pre)=>{
  const label=pre.getAttribute("data-code-sample-label");
  if(!label)return;
  const focusable=pre.getAttribute("tabindex")!==null;
  if(focusable){
    if(pre.getAttribute("role")!==ROLE)pre.setAttribute("role",ROLE);
    if(pre.getAttribute("aria-label")===null)pre.setAttribute("aria-label",label);
  }else{
    if(pre.getAttribute("role")!==null)pre.removeAttribute("role");
    if(pre.getAttribute("aria-label")!==null)pre.removeAttribute("aria-label");
  }
};
const observer=new MutationObserver((muts)=>muts.forEach((m)=>sync(m.target)));
const start=()=>{
  observer.observe(document.body,{subtree:true,attributeFilter:["tabindex","role"]});
  document.querySelectorAll(".expressive-code pre[data-code-sample-label]").forEach(sync);
};
start();
document.addEventListener("astro:page-load",start);
})();}catch(e){console.error("[docs] code-sample sync failed:",e)}`;

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
              node.properties.role = CODE_SAMPLE_ROLE;
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
      jsModules: [syncWithTabindex],
    },
  ],
};
