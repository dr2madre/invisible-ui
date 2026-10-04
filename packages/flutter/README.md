# invisible_ui

Invisible UI for Flutter: accessible components built on Flutter's widgets
layer, themed from the Invisible UI design tokens. The package reimplements
the behaviour of the web adapters in Dart and is held to the same
specification ([ADR 0017](https://github.com/dr2madre/invisible-ui/blob/main/docs/adr/0017-flutter-adapter.md)).

**Status: alpha.** The package carries the tokens, the theme (light and
dark, density, minimum target size, focus ring, messages) and the
components listed below: Button, the form fields (Field, TextField,
Textarea, NumberField), the overlays and chrome (Tooltip, Toolbar, Dropdown
Menu, Popover), the feedback widgets (the notifications, Loading,
EmptyState, ErrorState), Card, the dialog family (Dialog, AlertDialog,
ConfirmDialog), the choice controls (Checkbox, CheckboxGroup, Switch,
RadioButtonGroup, SegmentedControl, Select, Combobox), the dates
(Calendar, DatePicker, DateRangePicker, TimeField), the disclosures and
navigation (Collapsible, Accordion, Tabs, Breadcrumb, Pagination, Link) and
the value displays (Progress, Meter). Names and APIs can still change. It is not published to pub.dev.

The package depends on the Flutter SDK only: no Material, no Cupertino, no
bundled icon font. An app that uses it can set `uses-material-design: false`.

## Depend on it

Depend on the package by git, pinned to a commit:

```yaml
dependencies:
  invisible_ui:
    git:
      url: https://github.com/dr2madre/invisible-ui.git
      path: packages/flutter
      ref: <commit>
```

It needs Dart 3.8 (Flutter 3.32) or later. The generated token file is
committed, so a checkout needs no build step.

## Use it

```dart
import 'package:flutter/widgets.dart';
import 'package:invisible_ui/invisible_ui.dart';

class Editor extends StatelessWidget {
  const Editor({super.key});

  @override
  Widget build(BuildContext context) {
    final dark = MediaQuery.platformBrightnessOf(context) == Brightness.dark;
    return InvisibleTheme(
      data: dark
          ? InvisibleThemeData.dark(fontFamily: 'Inter')
          : InvisibleThemeData.light(fontFamily: 'Inter'),
      child: Row(
        children: [
          Button(
            onPressed: () {},
            variant: ButtonVariant.primary,
            child: const Text('Save'),
          ),
          Button.icon(
            onPressed: () {},
            icon: const Icon(IconData(0xe145, fontFamily: 'AppIcons')),
            semanticLabel: 'Add',
          ),
        ],
      ),
    );
  }
}
```

- **Light and dark.** `InvisibleThemeData.light()` and `.dark()` come from
  the generated tokens. The app picks one, or follows
  `MediaQuery.platformBrightnessOf`; without an `InvisibleTheme`, components
  follow the platform brightness.
- **Overrides.** `copyWith` replaces parts of a theme;
  `InvisibleTheme.merge` does it for a subtree.
- **Density and target size.** `density` is `compact`, `regular` (the
  default) or `touch`. The minimum hit area is a separate setting,
  `minTargetSize`: 24 by 24 by default, 44 by 44 under `touch`, and
  `Size(44, 44)` gives 44 by 44 at any density. The tokens define control
  padding for `regular` only today, so `compact` and `touch` use the regular
  padding until the tokens define theirs.
- **Messages.** `InvisibleMessages` holds the text the components announce,
  English by default. Pass translated text through the theme's `messages`.
- **Direction.** Components follow the ambient `Directionality`.

### Fields

```dart
NumberField(
  label: 'Hours',
  value: hours, // null is empty, distinct from 0
  min: 0,
  max: 24,
  step: 0.5,
  onChanged: (next) => setState(() => hours = next),
  onChangeEnd: save, // blur, Enter or a step
)
```

- **Controlled and uncontrolled.** `TextField(value:, onChanged:)` shows the
  parent's value; `TextField.uncontrolled(initialValue:)` keeps its own.
  The same pair exists for `Textarea` and `NumberField`. A changed `value`
  never calls `onChanged`.
- **Forms.** Inside a `Form`, each field validates with `validator`, saves
  with `onSaved`, and `FormState.reset()` restores the current default (the
  last `value` the parent passed, or `initialValue`) without calling
  `onChanged`.
- **Numbers.** NumberField reads and writes the number in `locale`, or the
  app's locale from `Localizations`, or English. `NumberSymbols.forLocale`
  holds the CLDR symbols of 23 locales; pass `symbols:` for any other. Text
  that is not a number, or a number out of range or off the step grid, is
  reported, never corrected: the field shows why, and
  `NumberFieldState.validationError` says it as data.
- **Field.** `Field` gives any other control a label, a description and an
  error, as part of the control's semantics.
- **Material.** The name `TextField` is also Material's. An app that imports
  both hides one (`import 'package:flutter/material.dart' hide TextField;`)
  or imports this package with a prefix.

## Components

| Component | Parity | Checklist | Docs |
| --- | --- | --- | --- |
| Button | Matched, with adaptations listed | [parity/button.md](parity/button.md) | [Button](https://dr2madre.github.io/invisible-ui/components/forms/button/) |
| Field | Matched, with adaptations listed | [parity/field.md](parity/field.md) | [Field](https://dr2madre.github.io/invisible-ui/components/forms/field/) |
| TextField | Matched, with adaptations listed | [parity/text-field.md](parity/text-field.md) | [Text Field](https://dr2madre.github.io/invisible-ui/components/forms/text-field/) |
| Textarea | Matched, with adaptations listed | [parity/textarea.md](parity/textarea.md) | [Text Area](https://dr2madre.github.io/invisible-ui/components/forms/text-area/) |
| NumberField | Matched, with adaptations listed | [parity/number-field.md](parity/number-field.md) | [Number Field](https://dr2madre.github.io/invisible-ui/components/forms/number-field/) |
| Tooltip | Matched, with adaptations listed | [parity/tooltip.md](parity/tooltip.md) | [Tooltip](https://dr2madre.github.io/invisible-ui/components/data-layout/tooltip/) |
| Toolbar | Matched, with adaptations listed | [parity/toolbar.md](parity/toolbar.md) | [Toolbar](https://dr2madre.github.io/invisible-ui/components/patterns/toolbar/) |
| Dropdown Menu, with submenus | Matched against the Svelte menu and the submenu spec, with adaptations listed | [parity/dropdown-menu.md](parity/dropdown-menu.md) | [Dropdown Menu](https://dr2madre.github.io/invisible-ui/components/data-layout/dropdown-menu/) |
| Inline Notification | Matched, with adaptations listed | [parity/inline-notification.md](parity/inline-notification.md) | [Inline Notification](https://dr2madre.github.io/invisible-ui/components/feedback/inline-notification/) |
| Notification, Notification Region | Matched, with adaptations listed | [parity/notification.md](parity/notification.md) | [Notification](https://dr2madre.github.io/invisible-ui/components/feedback/notification/), [Notification Region](https://dr2madre.github.io/invisible-ui/components/feedback/notification-region/) |
| Loading | Matched, with adaptations listed | [parity/loading.md](parity/loading.md) | [Loading](https://dr2madre.github.io/invisible-ui/components/feedback/loading/) |
| EmptyState | Matched, with adaptations listed | [parity/empty-state.md](parity/empty-state.md) | [Empty State](https://dr2madre.github.io/invisible-ui/components/feedback/empty-state/) |
| ErrorState | Matched, with adaptations listed | [parity/error-state.md](parity/error-state.md) | [Error State](https://dr2madre.github.io/invisible-ui/components/feedback/error-state/) |
| Card | Matched, with adaptations listed | [parity/card.md](parity/card.md) | [Card](https://dr2madre.github.io/invisible-ui/components/data-layout/card/) |
| Dialog | Matched, with adaptations listed | [parity/dialog.md](parity/dialog.md) | [Dialog](https://dr2madre.github.io/invisible-ui/components/feedback/dialog/) |
| AlertDialog | Matched, with adaptations listed | [parity/alert-dialog.md](parity/alert-dialog.md) | [Alert Dialog](https://dr2madre.github.io/invisible-ui/components/feedback/dialog/alert-dialog/) |
| ConfirmDialog | Matched, with adaptations listed | [parity/confirm-dialog.md](parity/confirm-dialog.md) | [Confirm Dialog](https://dr2madre.github.io/invisible-ui/components/feedback/dialog/confirm-dialog/) |
| Checkbox | Matched, with adaptations listed | [parity/checkbox.md](parity/checkbox.md) | [Checkbox](https://dr2madre.github.io/invisible-ui/components/forms/checkbox/) |
| CheckboxGroup | Matched, with adaptations listed | [parity/checkbox-group.md](parity/checkbox-group.md) | [Checkbox Group](https://dr2madre.github.io/invisible-ui/components/forms/checkbox-group/) |
| Switch | Matched, with adaptations listed | [parity/switch.md](parity/switch.md) | [Switch](https://dr2madre.github.io/invisible-ui/components/forms/switch/) |
| RadioButtonGroup | Matched, with adaptations listed | [parity/radio-group.md](parity/radio-group.md) | [Radio Group](https://dr2madre.github.io/invisible-ui/components/forms/radio-group/) |
| SegmentedControl | Matched, with adaptations listed | [parity/segmented-control.md](parity/segmented-control.md) | [Segmented Control](https://dr2madre.github.io/invisible-ui/components/forms/segmented-control/) |
| Select | Matched, with adaptations listed | [parity/select.md](parity/select.md) | [Select](https://dr2madre.github.io/invisible-ui/components/forms/select/) |
| Combobox | Matched, with adaptations listed | [parity/combobox.md](parity/combobox.md) | [Combobox](https://dr2madre.github.io/invisible-ui/components/forms/combobox/) |
| Popover | Matched, with adaptations listed | [parity/popover.md](parity/popover.md) | [Popover](https://dr2madre.github.io/invisible-ui/components/data-layout/popover/) |
| Calendar | Matched for the month and two-month views, with adaptations listed | [parity/calendar.md](parity/calendar.md) | [Calendar](https://dr2madre.github.io/invisible-ui/components/forms/calendar/) |
| DatePicker | Matched, with adaptations listed | [parity/date-picker.md](parity/date-picker.md) | [Date Picker](https://dr2madre.github.io/invisible-ui/components/forms/date-picker/) |
| DateRangePicker | Matched, with adaptations listed | [parity/date-range-picker.md](parity/date-range-picker.md) | [Date Range Picker](https://dr2madre.github.io/invisible-ui/components/forms/date-range-picker/) |
| TimeField | Matched, with adaptations listed | [parity/time-field.md](parity/time-field.md) | [Time Field](https://dr2madre.github.io/invisible-ui/components/forms/time-field/) |
| Collapsible | Matched, with adaptations listed | [parity/collapsible.md](parity/collapsible.md) | [Collapsible](https://dr2madre.github.io/invisible-ui/components/data-layout/collapsible/) |
| Accordion | Matched, with adaptations listed | [parity/accordion.md](parity/accordion.md) | [Accordion](https://dr2madre.github.io/invisible-ui/components/data-layout/accordion/) |
| Tabs | Matched, with adaptations listed | [parity/tabs.md](parity/tabs.md) | [Tabs](https://dr2madre.github.io/invisible-ui/components/navigation/tabs/) |
| Breadcrumb | Matched, with adaptations listed | [parity/breadcrumb.md](parity/breadcrumb.md) | [Breadcrumb](https://dr2madre.github.io/invisible-ui/components/patterns/breadcrumb/) |
| Pagination | Matched, with adaptations listed | [parity/pagination.md](parity/pagination.md) | [Pagination](https://dr2madre.github.io/invisible-ui/components/navigation/pagination/) |
| Link | Matched, with adaptations listed | [parity/link.md](parity/link.md) | [Link](https://dr2madre.github.io/invisible-ui/components/navigation/link/) |
| Progress | Matched, with adaptations listed | [parity/progress.md](parity/progress.md) | [Progress](https://dr2madre.github.io/invisible-ui/components/data-layout/progress/) |
| Meter | Matched, with adaptations listed | [parity/meter.md](parity/meter.md) | [Meter](https://dr2madre.github.io/invisible-ui/components/data-layout/meter/) |

Each checklist compares the Flutter widget with the Svelte reference, line
by line, and names the reference commit it was checked against. The number
field's parsing, validation, stepping and formatting answer the same test
vectors as the core
([`core/src/number-field/__vectors__`](https://github.com/dr2madre/invisible-ui/tree/main/core/src/number-field/__vectors__)),
read by `test/number_format_test.dart` in a checkout of the whole
repository.

The menus also run the shared test vectors in `core/src/menu/__vectors__`,
Select, Combobox and the radio-style groups the typeahead and navigation
vectors in `core/src/select/__vectors__`, the calendar the grid, key,
bound, range and name vectors in `core/src/calendar/__vectors__`, the
time field the parsing, bound and key sequence vectors in
`core/src/time-field/__vectors__`, and Tabs, Accordion, Pagination,
Progress and Meter the keyboard, toggle, page list and reading vectors in
`core/src/tabs`, `accordion`, `pagination`, `progress` and `meter`, which
the `core/` tests run too.

The overlays (Tooltip, Dropdown Menu, Popover, the lists of Select and
Combobox) need an `Overlay` above them, as
`WidgetsApp` provides. The notification region wraps the app's navigator
and waits while a modal is open:

```dart
final notices = NotificationController();
final modals = ModalObserver();

WidgetsApp(
  navigatorObservers: [modals],
  builder: (context, child) => NotificationRegion(
    controller: notices,
    modals: modals,
    child: child!,
  ),
  // ...
);

notices.success('Saved', duration: const Duration(seconds: 5));
```

### Dialogs

A dialog opens as a route, with `showInvisibleDialog`, and completes with
the value it closes with:

```dart
final delete = await showInvisibleDialog<bool>(
  context: context,
  builder: (context) => const ConfirmDialog(
    title: 'Delete 6 hours?',
    description: 'The hours logged on Monday are removed from the report.',
    confirmLabel: 'Delete',
    cancelLabel: 'Keep hours',
    confirmVariant: ButtonVariant.danger,
  ),
);
if (delete == true) removeHours();
```

- **Modal.** The barrier blocks the screen below, Tab stays inside, Escape
  closes the innermost dialog, and focus returns to the element that had it
  when the dialog opened, also when a dialog opens on top of another.
- **Status area.** Messages about the dialog's own task go in the dialog
  (ADR 0016): `Dialog.of(context).notify(title: 'Upload failed', ...)` from
  the content, or a `DialogController` passed as `controller` from outside.
  The `ModalObserver` above counts these dialogs, so the notification
  region holds its toasts while one is open.

### Choices and pickers

Every value control has a controlled constructor (`value:` with
`onChanged:`, or `onSelected:` for `SegmentedControl`) and an
`.uncontrolled(initialValue:)` one, joins an enclosing `Form` (validator,
saver, silent reset to the current default) and takes its options as
`ChoiceItem`s:

```dart
Combobox<String>(
  label: 'Client',
  description: 'Optional.',
  items: [for (final c in clients) ChoiceItem(value: c.id, label: c.name)],
  value: clientId,
  onChanged: (id) => setState(() => clientId = id), // null when cleared
)
```

- **Select** opens a styled list from a trigger: arrows, Home, End and
  typeahead move the highlight, which is announced, while focus stays on
  the trigger.
- **Combobox** filters as the user types. For options that load from a
  server, listen to `onInputChanged`, set `loading`, pass the results as
  `items` and a `filter` that keeps them all.
- **Popover** holds anything, such as a search field and a list: focus
  moves in when it opens, Escape closes it and returns focus, and inside a
  dialog Escape closes the popover first.
- **RadioButtonGroup** is the web's RadioGroup: the widgets library has a
  `RadioGroup` of its own.

### Dates

```dart
DatePicker(
  label: 'Day',
  value: day, // a DateTime; only its year, month and day count
  min: DateTime(2026),
  weekStartsOn: DateTime.monday,
  clearable: true,
  onChanged: (next) => setState(() => day = next), // local midnight, or null
)

TimeField(
  label: 'Start',
  value: start, // '09:30', 24-hour, whatever the display
  onChanged: (next) => setState(() => start = next), // null while incomplete
  onChangeEnd: save, // focus leaves the field, or Enter
)
```

- **Values.** Dates are `DateTime` calendar days: the time of day is
  ignored, and the widgets report local midnight, as Flutter's own date
  pickers do. `DateRangePicker` and `Calendar.range` take a `DateRange`,
  its `end` null while the range is half made. A time is the canonical
  24-hour string, `HH:mm` or `HH:mm:ss`, so a stored value never depends
  on the locale.
- **Names.** Month and weekday names, the field's date and the hour cycle
  come from `DateSymbols.forLocale`: the CLDR data of 23 locales in the
  Gregorian calendar, checked against `Intl` by the core tests through the
  shared vectors. Pass `symbols:` for any other locale. Names come from the
  calendar day, so the device's time zone never shifts them.
- **Calendar.** `Calendar` shows one month or two (`CalendarView`); the week
  and agenda views of the web calendar are not carried.
- **Time field.** Digits type with auto-advance, Escape puts back the last
  finished value, and a time outside `min` and `max` is reported, never
  clamped. On touch, a vertical drag on a segment steps it.

### Navigation

```dart
Tabs<String>(
  label: 'Project',
  value: section,
  activationMode: TabActivationMode.manual, // arrows move, Enter selects
  items: const [
    TabItem(value: 'hours', label: 'Hours', count: 12, child: HoursView()),
    TabItem(value: 'people', label: 'People', child: PeopleView()),
  ],
  onChanged: (next) => setState(() => section = next),
)

Breadcrumb(
  items: [
    BreadcrumbItem(label: 'Home', home: true, onPressed: () => go('/')),
    BreadcrumbItem(label: 'Projects', onPressed: () => go('/projects')),
    const BreadcrumbItem(label: 'Timelog'), // the current page
  ],
)
```

- **Disclosures.** `Collapsible(expanded:, onExpansionChanged:)` shows and
  hides one region; `Accordion(value:, onChanged:)` stacks sections, one
  open at a time unless `multiple`. Hidden content keeps its state.
- **Links.** `Link` and the breadcrumb steps open through `onPressed`, so
  the app decides how a destination opens (a route, or a URL it launches)
  and the package needs no URL plugin. Pass `uri` to announce the address.
- **Pagination.** `Pagination(page:, pageCount:, onPageChanged:)` shows the
  boundary pages, the siblings of the current page and the gaps.
- **Progress and Meter.** `Progress` is determinate, as on the web: work of
  unknown length is waiting, which `Loading(variant: LoadingVariant.bar)`
  shows. `Meter` colours its fill by how good the value is, given
  `optimum`.

An app that also imports Material hides its widgets of the same name:
`import 'package:flutter/material.dart' hide AlertDialog, Card, Checkbox, Dialog, DropdownMenu, Switch, TextField, Tooltip;`.

## Tokens

`lib/src/tokens/tokens.g.dart` is generated from
[`packages/tokens/tokens.json`](https://github.com/dr2madre/invisible-ui/blob/main/packages/tokens/tokens.json) by the repository's
token build (`pnpm tokens:build`, Node only). Do not edit it by hand:
`pnpm tokens:check` fails when it differs from the source.

## Develop

```sh
flutter pub get
dart format --set-exit-if-changed .
flutter analyze
flutter test
flutter widget-preview start   # previews in preview/, Flutter 3.35 or later
```

Screen reader behaviour on macOS, Windows and Linux is a manual check and is
not yet verified.

## License

[MIT](LICENSE).
