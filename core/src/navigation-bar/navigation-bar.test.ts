// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkDestinations, connect, LONG_PRESS_MS, type ConnectOptions } from "./connect";
import { badgeAnnouncements, holdAnnouncements } from "./text";
import type { NavigationTarget } from "./types";

const destinations: NavigationTarget[] = [
  { value: "home", label: "Home", href: "/home" },
  { value: "clients", label: "Clients" },
  { value: "projects", label: "Projects", unavailable: { reason: "Available online only" } },
  { value: "hours", label: "Hours", href: "/hours" },
  { value: "profile", label: "Profile", badge: { label: "Needs attention" } },
];

const bar = (options: Partial<ConnectOptions> = {}) =>
  connect({ destinations, value: "hours", label: "Main", id: "nb", ...options });

type Handler = (event: Event) => void;
const handler = (props: Record<string, unknown>, name: string) => props[name] as Handler;

describe("navigation bar props", () => {
  it("names the landmark and keeps the list role", () => {
    const api = bar();
    expect(api.getRootProps()).toEqual({ "aria-label": "Main" });
    expect(api.getListProps()).toEqual({ role: "list" });
  });

  it("marks only the current destination with aria-current", () => {
    const api = bar();
    expect(api.current).toBe("hours");
    expect(api.getDestinationProps("hours")["aria-current"]).toBe("page");
    expect(api.getDestinationProps("hours")["data-current"]).toBe("");
    for (const value of ["home", "clients", "projects", "profile"]) {
      expect(api.getDestinationProps(value)["aria-current"]).toBeUndefined();
    }
  });

  it("renders a link with href and a button without", () => {
    const api = bar();
    expect(api.getDestinationProps("home")).toMatchObject({ href: "/home", type: undefined });
    expect(api.getDestinationProps("clients")).toMatchObject({ href: undefined, type: "button" });
  });

  it("links an unavailable destination to its reason and keeps it focusable", () => {
    const api = bar();
    const props = api.getDestinationProps("projects");
    expect(props["aria-disabled"]).toBe("true");
    expect(props["data-unavailable"]).toBe("");
    expect(props.disabled).toBeUndefined();
    expect(props.tabindex).toBeUndefined();
    expect(props["aria-describedby"]).toBe(api.getReasonProps("projects").id);
    expect(api.getDestinationProps("clients")["aria-describedby"]).toBeUndefined();
  });

  it("marks nothing current when value names no destination, or is null", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(bar({ value: "settings" }).current).toBeNull();
    expect(bar({ value: null }).current).toBeNull();
    warn.mockRestore();
  });
});

describe("navigation bar select", () => {
  it("reports a button once per activation, the current one included", () => {
    const onSelect = vi.fn();
    const api = bar({ value: "clients", onSelect });
    handler(api.getDestinationProps("clients"), "onClick")(new Event("click"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("clients");
    api.select("profile");
    expect(onSelect).toHaveBeenLastCalledWith("profile");
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("reports nothing for a link: the browser or router follows it", () => {
    const onSelect = vi.fn();
    const event = new Event("click", { cancelable: true });
    handler(bar({ onSelect }).getDestinationProps("home"), "onClick")(event);
    expect(onSelect).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("does nothing for an unavailable destination", () => {
    const onSelect = vi.fn();
    const api = bar({ onSelect });
    const event = new Event("click", { cancelable: true });
    handler(api.getDestinationProps("projects"), "onClick")(event);
    api.select("projects");
    expect(onSelect).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it("keeps an unavailable link from opening in a new tab", () => {
    const api = connect({
      destinations: [{ value: "a", label: "A", href: "/a", unavailable: { reason: "Offline" } }],
      label: "Main",
      id: "nb",
    });
    const event = new Event("auxclick", { cancelable: true });
    handler(api.getDestinationProps("a"), "onAuxClick")(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

describe("navigation bar keys", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  const render = (options: Partial<ConnectOptions> = {}) => {
    const api = bar(options);
    const nav = document.createElement("nav");
    const list = document.createElement("ul");
    nav.append(list);
    for (const destination of destinations) {
      const item = document.createElement("li");
      const el = document.createElement(destination.href ? "a" : "button");
      const props = api.getDestinationProps(destination.value);
      if (destination.href) el.setAttribute("href", destination.href);
      el.setAttribute("data-navigation-destination", "");
      el.textContent = destination.label;
      el.addEventListener("keydown", handler(props, "onKeyDown"));
      item.append(el);
      list.append(item);
    }
    document.body.append(nav);
    return Array.from(list.querySelectorAll<HTMLElement>("[data-navigation-destination]"));
  };

  const press = (el: HTMLElement, key: string) => {
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    return event;
  };

  it("moves with the arrows, through an unavailable destination, without wrapping", () => {
    const [home, clients, projects, , profile] = render();
    home!.focus();
    press(home!, "ArrowRight");
    expect(document.activeElement).toBe(clients);
    press(clients!, "ArrowRight");
    expect(document.activeElement).toBe(projects);
    profile!.focus();
    const atEnd = press(profile!, "ArrowRight");
    expect(document.activeElement).toBe(profile);
    expect(atEnd.defaultPrevented).toBe(false);
  });

  it("mirrors the arrows under right to left", () => {
    // jsdom computes no direction from `dir`, so the option carries it.
    const [home, clients] = render({ direction: "rtl" });
    home!.focus();
    press(home!, "ArrowLeft");
    expect(document.activeElement).toBe(clients);
    press(clients!, "ArrowRight");
    expect(document.activeElement).toBe(home);
  });

  it("leaves Home, End, Tab and modified arrows alone", () => {
    const [, clients] = render();
    clients!.focus();
    for (const key of ["Home", "End", "Tab", "ArrowDown"]) {
      expect(press(clients!, key).defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(clients);
    }
    const modified = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      altKey: true,
      bubbles: true,
      cancelable: true,
    });
    clients!.dispatchEvent(modified);
    expect(document.activeElement).toBe(clients);
  });
});

describe("navigation bar reason", () => {
  it("shows on a long press and hides with Escape", () => {
    vi.useFakeTimers();
    const props = bar().getDestinationProps("projects");
    const el = document.createElement("button");
    const fire = (name: string, type: string) => {
      const event = new Event(type, { cancelable: true });
      Object.defineProperty(event, "currentTarget", { value: el });
      handler(props, name)(event);
      return event;
    };
    fire("onPointerDown", "pointerdown");
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(el.hasAttribute("data-reason-shown")).toBe(true);
    const escape = new KeyboardEvent("keydown", { key: "Escape" });
    Object.defineProperty(escape, "currentTarget", { value: el });
    handler(props, "onKeyDown")(escape);
    expect(el.hasAttribute("data-reason-shown")).toBe(false);
    expect(el.hasAttribute("data-reason-dismissed")).toBe(true);
    fire("onBlur", "blur");
    expect(el.hasAttribute("data-reason-dismissed")).toBe(false);
    vi.useRealTimers();
  });

  it("does not show after a short press", () => {
    vi.useFakeTimers();
    const props = bar().getDestinationProps("projects");
    const el = document.createElement("button");
    for (const [name, type] of [
      ["onPointerDown", "pointerdown"],
      ["onPointerUp", "pointerup"],
    ] as const) {
      const event = new Event(type);
      Object.defineProperty(event, "currentTarget", { value: el });
      handler(props, name)(event);
    }
    vi.advanceTimersByTime(LONG_PRESS_MS * 2);
    expect(el.hasAttribute("data-reason-shown")).toBe(false);
    vi.useRealTimers();
  });

  it("adds no long press to an available destination", () => {
    expect(bar().getDestinationProps("clients").onPointerDown).toBeUndefined();
  });
});

describe("navigation bar development checks", () => {
  it("throws on a repeated value", () => {
    expect(() =>
      checkDestinations([
        { value: "a", label: "A" },
        { value: "a", label: "B" },
      ]),
    ).toThrow(/"a" appears more than once/);
  });

  it("warns past five destinations", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    checkDestinations(
      Array.from({ length: 6 }, (_, i) => ({ value: String(i), label: String(i) })),
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("6 destinations"));
    warn.mockRestore();
  });

  it("warns once when value names no destination", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const list = [{ value: "a", label: "A" }];
    checkDestinations(list, "b");
    checkDestinations(list, "b");
    checkDestinations(list, null);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"b" names no destination'));
    warn.mockRestore();
  });
});

describe("held announcements", () => {
  it("keeps the latest one per destination, in the order they first waited", () => {
    const held = holdAnnouncements(
      [{ value: "inbox", text: "Inbox: 1 unread" }],
      [
        { value: "profile", text: "Profile: Needs attention" },
        { value: "inbox", text: "Inbox: 2 unread" },
      ],
    );
    expect(held).toEqual([
      { value: "inbox", text: "Inbox: 2 unread" },
      { value: "profile", text: "Profile: Needs attention" },
    ]);
  });
});

describe("navigation bar text through an adapter's translator", () => {
  it("uses the given translator over the catalog", () => {
    const translate = (key: string, vars?: Record<string, string | number>) =>
      key === "navigationBar.announcement" ? `${vars?.badge} (${vars?.label})` : key;
    expect(
      badgeAnnouncements(
        [{ value: "p", label: "Profilo" }],
        [{ value: "p", label: "Profilo", badge: { label: "Da verificare" } }],
        { translate },
      ),
    ).toEqual([{ value: "p", text: "Da verificare (Profilo)" }]);
  });
});
