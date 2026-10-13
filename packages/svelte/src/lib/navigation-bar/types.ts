import type { navigationBar } from "@design-system/core";
import type { Component, ComponentType } from "svelte";

export type NavigationBadge = navigationBar.NavigationBadge;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the props are the component's own
type IconComponent = Component<any> | ComponentType;

/**
 * One destination of a Navigation Bar. `icon` is a component rendered without
 * props, decorative: the label is the name. A runes component and a legacy
 * class component both work.
 */
export type NavigationDestination = navigationBar.NavigationDestination<IconComponent>;
