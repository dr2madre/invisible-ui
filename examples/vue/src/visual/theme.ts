// The visual pages take their theme from the address (`?theme=dark`) and set
// it before any component renders: a theme applied after the first paint
// would animate its way in, and the screenshot would catch the transition.
const theme = new URLSearchParams(location.search).get("theme") === "dark" ? "dark" : "light";
document.documentElement.setAttribute("data-theme", theme);
