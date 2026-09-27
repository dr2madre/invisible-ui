---
"@design-system/svelte": patch
---

Twenty-seven presentational components now use the runes syntax internally:
AspectRatio, Avatar, AvatarGroup, Breadcrumb, ButtonGroup, Code, CodeBlock,
ContextMenu, Count, DropdownMenu, FeedbackIcon, Icon, Kbd, Label, Loading,
LocaleProvider, Menubar, Meter, NavigationMenu, NotificationRegion, Progress,
ScrollArea, Separator, Skeleton, ToggleGroup, Toolbar and Tooltip. Their props,
content and callbacks work as before. Props that take a component (a segment
or sidebar icon, a notification body) now also accept components written in
runes.
