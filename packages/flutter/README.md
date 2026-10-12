# invisible_ui

Invisible UI for Flutter: accessible components built on Flutter's widgets
layer, themed from the Invisible UI design tokens. The package reimplements
the behaviour of the web adapters in Dart and is held to the same
specification ([ADR 0017](https://github.com/dr2madre/invisible-ui/blob/main/docs/adr/0017-flutter-adapter.md)).

**Status: alpha.** The package carries the tokens, the theme (light and
dark, density, minimum target size, focus ring, messages) and the
components listed below: Button, the form fields (Field, TextField,
Textarea, NumberField), the overlays and chrome (Tooltip, Toolbar, Dropdown
Menu, Context Menu, Menubar, Popover), the feedback widgets (the notifications, Loading,
LoadingGenerationArea, EmptyState, ErrorState), Card, the dialog family
(Dialog, AlertDialog, ConfirmDialog, PromptDialog, SearchDialog,
SheetDialog), the choice controls (Checkbox, CheckboxGroup, Switch,
RadioButtonGroup, SegmentedControl, Select, Combobox, MultiSelect), the
search field (SearchField), the dates
(Calendar, DatePicker, DateRangePicker, TimeField), the disclosures and
navigation (Collapsible, Accordion, Tabs, Breadcrumb, Pagination, Link,
Navigation Menu, Sidebar, Tree View),
the value displays (Progress, Meter) and the display components (Avatar,
AvatarGroup, Count, Tag, Kbd, Label, FeedbackIcon, Skeleton, Code,
CodeBlock, Blockquote, ScrollArea) and the value controls (Slider,
RangeSlider, RatingGroup, PinInput, Radio, ToggleButton, ToggleGroup,
ButtonGroup, Stepper, Separator). Names and APIs can still change. It is not published to pub.dev.

The data and form patterns are in too: Table and TableSet, Carousel,
LoginForm, UploadDropArea and LocaleProvider.

The package depends on the Flutter SDK only: no Material, no Cupertino, no
bundled icon font. An app that uses it can set `uses-material-design: false`.

Some names match widgets in Flutter or Material (`Slider`, `Switch`,
`Dialog`, `TextField`). The package keeps them: import it with a prefix, as
every example below does.

```dart
import 'package:invisible_ui/invisible_ui.dart' as iu;
```

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

It needs Dart 3.9 (Flutter 3.35) or later. The generated token file is
committed, so a checkout needs no build step.

## Use it

```dart
import 'package:flutter/widgets.dart';
import 'package:invisible_ui/invisible_ui.dart' as iu;

class Editor extends StatelessWidget {
  const Editor({super.key});

  @override
  Widget build(BuildContext context) {
    final dark = MediaQuery.platformBrightnessOf(context) == Brightness.dark;
    return iu.InvisibleTheme(
      data: dark
          ? iu.InvisibleThemeData.dark(fontFamily: 'Inter')
          : iu.InvisibleThemeData.light(fontFamily: 'Inter'),
      child: Row(
        children: [
          iu.Button(
            onPressed: () {},
            variant: iu.ButtonVariant.primary,
            child: const Text('Save'),
          ),
          iu.Button.icon(
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
  default) or `touch`. The minimum hit area comes from the density's
  `min-target-size` token: 24 by 24 by default, 44 by 44 under `touch`.
  `minTargetSize: Size(44, 44)` gives 44 by 44 at any density; a smaller
  size never goes below the token. The tokens define control
  padding for `regular` only today, so `compact` and `touch` use the regular
  padding until the tokens define theirs.
- **Messages.** `InvisibleMessages` holds the text the components announce,
  English by default. Pass translated text through the theme's `messages`.
- **Direction.** Components follow the ambient `Directionality`.
- **Icons.** `iu.InvisibleTheme` sets an `IconTheme` from the tokens (the
  text colour and the base text size, scaled with the text), so Flutter's
  own `Icon` matches the text around it. An icon without `semanticLabel` is
  decorative; an icon-only control takes a required name.

### Fields

```dart
iu.NumberField(
  label: 'Hours',
  value: hours, // null is empty, distinct from 0
  min: 0,
  max: 24,
  step: 0.5,
  onChanged: (next) => setState(() => hours = next),
  onChangeEnd: save, // blur, Enter or a step
)
```

- **Controlled and uncontrolled.** `iu.TextField(value:, onChanged:)` shows
  the parent's value; `iu.TextField.uncontrolled(initialValue:)` keeps its
  own.
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
  `NumberFieldState.validationError` says it as data. Arabic-Indic and
  Persian digits are read in every locale; in de-CH both `’` and `'` group
  thousands, and the field displays `’`.
- **Field.** `Field` gives any other control a label, a description and an
  error, as part of the control's semantics.
- **Material.** The name `TextField` is also Material's. With the prefixed
  import, `iu.TextField` and Material's `TextField` live side by side.

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
| Context Menu, with submenus | Matched against the Svelte Context Menu and the submenu spec, with adaptations listed | [parity/context-menu.md](parity/context-menu.md) | [Context Menu](https://dr2madre.github.io/invisible-ui/components/data-layout/context-menu/) |
| Menubar, with submenus | Matched against the Svelte Menubar and the submenu spec, with adaptations listed | [parity/menubar.md](parity/menubar.md) | [Menubar](https://dr2madre.github.io/invisible-ui/components/patterns/menubar/) |
| Inline Notification | Matched, with adaptations listed | [parity/inline-notification.md](parity/inline-notification.md) | [Inline Notification](https://dr2madre.github.io/invisible-ui/components/feedback/inline-notification/) |
| Notification, Notification Region | Matched, with adaptations listed | [parity/notification.md](parity/notification.md) | [Notification](https://dr2madre.github.io/invisible-ui/components/feedback/notification/), [Notification Region](https://dr2madre.github.io/invisible-ui/components/feedback/notification-region/) |
| Loading | Matched, with adaptations listed | [parity/loading.md](parity/loading.md) | [Loading](https://dr2madre.github.io/invisible-ui/components/feedback/loading/) |
| LoadingGenerationArea | Matched, with adaptations listed | [parity/loading-generation-area.md](parity/loading-generation-area.md) | [Loading Area](https://dr2madre.github.io/invisible-ui/components/feedback/loading-generation-area/) |
| EmptyState | Matched, with adaptations listed | [parity/empty-state.md](parity/empty-state.md) | [Empty State](https://dr2madre.github.io/invisible-ui/components/feedback/empty-state/) |
| ErrorState | Matched, with adaptations listed | [parity/error-state.md](parity/error-state.md) | [Error State](https://dr2madre.github.io/invisible-ui/components/feedback/error-state/) |
| Card | Matched, with adaptations listed | [parity/card.md](parity/card.md) | [Card](https://dr2madre.github.io/invisible-ui/components/data-layout/card/) |
| Dialog | Matched, with adaptations listed | [parity/dialog.md](parity/dialog.md) | [Dialog](https://dr2madre.github.io/invisible-ui/components/feedback/dialog/) |
| AlertDialog | Matched, with adaptations listed | [parity/alert-dialog.md](parity/alert-dialog.md) | [Alert Dialog](https://dr2madre.github.io/invisible-ui/components/feedback/dialog/alert-dialog/) |
| ConfirmDialog | Matched, with adaptations listed | [parity/confirm-dialog.md](parity/confirm-dialog.md) | [Confirm Dialog](https://dr2madre.github.io/invisible-ui/components/feedback/dialog/confirm-dialog/) |
| PromptDialog | Matched, with adaptations listed | [parity/prompt-dialog.md](parity/prompt-dialog.md) | [Prompt Dialog](https://dr2madre.github.io/invisible-ui/components/feedback/dialog/prompt-dialog/) |
| SearchDialog | Matched, with adaptations listed | [parity/search-dialog.md](parity/search-dialog.md) | [Search Dialog](https://dr2madre.github.io/invisible-ui/components/feedback/dialog/search-dialog/) |
| SheetDialog | Matched, with adaptations listed | [parity/sheet-dialog.md](parity/sheet-dialog.md) | [Sheet Dialog](https://dr2madre.github.io/invisible-ui/components/feedback/dialog/sheet-dialog/) |
| Checkbox | Matched, with adaptations listed | [parity/checkbox.md](parity/checkbox.md) | [Checkbox](https://dr2madre.github.io/invisible-ui/components/forms/checkbox/) |
| CheckboxGroup | Matched, with adaptations listed | [parity/checkbox-group.md](parity/checkbox-group.md) | [Checkbox Group](https://dr2madre.github.io/invisible-ui/components/forms/checkbox-group/) |
| Switch | Matched, with adaptations listed | [parity/switch.md](parity/switch.md) | [Switch](https://dr2madre.github.io/invisible-ui/components/forms/switch/) |
| RadioButtonGroup | Matched, with adaptations listed | [parity/radio-group.md](parity/radio-group.md) | [Radio Group](https://dr2madre.github.io/invisible-ui/components/forms/radio-group/) |
| SegmentedControl | Matched, with adaptations listed | [parity/segmented-control.md](parity/segmented-control.md) | [Segmented Control](https://dr2madre.github.io/invisible-ui/components/forms/segmented-control/) |
| Select | Matched, with adaptations listed | [parity/select.md](parity/select.md) | [Select](https://dr2madre.github.io/invisible-ui/components/forms/select/) |
| Combobox | Matched, with adaptations listed | [parity/combobox.md](parity/combobox.md) | [Combobox](https://dr2madre.github.io/invisible-ui/components/forms/combobox/) |
| MultiSelect | Matched, with adaptations listed | [parity/multi-select.md](parity/multi-select.md) | [Multi Select](https://dr2madre.github.io/invisible-ui/components/forms/multi-select/) |
| SearchField | Matched, with adaptations listed | [parity/search-field.md](parity/search-field.md) | [Search Field](https://dr2madre.github.io/invisible-ui/components/forms/search-field/) |
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
| Navigation Menu | Matched, with adaptations listed | [parity/navigation-menu.md](parity/navigation-menu.md) | [Navigation Menu](https://dr2madre.github.io/invisible-ui/components/patterns/navigation-menu/) |
| Sidebar | Matched for the inline sidebar, the rail and the drawer, with adaptations listed | [parity/sidebar.md](parity/sidebar.md) | [Sidebar](https://dr2madre.github.io/invisible-ui/components/patterns/sidebar/) |
| Tree View | Matched, single selection, with adaptations listed | [parity/tree-view.md](parity/tree-view.md) | [Tree View](https://dr2madre.github.io/invisible-ui/components/patterns/tree-view/) |
| Table | Matched, with adaptations listed | [parity/table.md](parity/table.md) | [Table](https://dr2madre.github.io/invisible-ui/components/patterns/table/) |
| TableSet (with the internal Table View) | Matched for spec units 5A to 5C, with adaptations listed | [parity/table-set.md](parity/table-set.md) | [Table Set](https://dr2madre.github.io/invisible-ui/components/patterns/table-set/) |
| Carousel | Matched, with adaptations listed | [parity/carousel.md](parity/carousel.md) | [Carousel](https://dr2madre.github.io/invisible-ui/components/data-layout/carousel/) |
| LoginForm | Matched, with autofill hints and adaptations listed | [parity/login-form.md](parity/login-form.md) | [Login Form](https://dr2madre.github.io/invisible-ui/components/patterns/login-form/) |
| UploadDropArea | Adapted: the app opens the picker and reports drops | [parity/upload-drop-area.md](parity/upload-drop-area.md) | [Upload Drop Area](https://dr2madre.github.io/invisible-ui/components/forms/upload-drop-area/) |
| LocaleProvider | Matched, with adaptations listed | [parity/locale-provider.md](parity/locale-provider.md) | [Locale Provider](https://dr2madre.github.io/invisible-ui/components/localization/locale-provider/) |
| Progress | Matched, with adaptations listed | [parity/progress.md](parity/progress.md) | [Progress](https://dr2madre.github.io/invisible-ui/components/data-layout/progress/) |
| Meter | Matched, with adaptations listed | [parity/meter.md](parity/meter.md) | [Meter](https://dr2madre.github.io/invisible-ui/components/data-layout/meter/) |
| Avatar | Matched, with adaptations listed | [parity/avatar.md](parity/avatar.md) | [Avatar](https://dr2madre.github.io/invisible-ui/components/data-layout/avatar/) |
| AvatarGroup | Matched, with adaptations listed | [parity/avatar-group.md](parity/avatar-group.md) | [Avatar Group](https://dr2madre.github.io/invisible-ui/components/data-layout/avatar-group/) |
| Count | Matched, with adaptations listed | [parity/count.md](parity/count.md) | [Count](https://dr2madre.github.io/invisible-ui/components/feedback/count/) |
| Tag | Matched, with adaptations listed | [parity/tag.md](parity/tag.md) | [Tag](https://dr2madre.github.io/invisible-ui/components/feedback/tag/) |
| Kbd | Matched, with adaptations listed | [parity/kbd.md](parity/kbd.md) | [Kbd](https://dr2madre.github.io/invisible-ui/components/navigation/kbd/) |
| Label | Matched, with adaptations listed | [parity/label.md](parity/label.md) | [Label](https://dr2madre.github.io/invisible-ui/components/forms/label/) |
| FeedbackIcon | Matched, with adaptations listed | [parity/feedback-icon.md](parity/feedback-icon.md) | [Feedback Icon](https://dr2madre.github.io/invisible-ui/components/feedback/feedback-icon/) |
| Skeleton | Matched, with adaptations listed | [parity/skeleton.md](parity/skeleton.md) | [Skeleton](https://dr2madre.github.io/invisible-ui/components/feedback/skeleton/) |
| Code | Matched, with adaptations listed | [parity/code.md](parity/code.md) | [Code](https://dr2madre.github.io/invisible-ui/components/formatting-display/code/) |
| CodeBlock | Matched, with adaptations listed | [parity/code-block.md](parity/code-block.md) | [Code Block](https://dr2madre.github.io/invisible-ui/components/formatting-display/code-block/) |
| Blockquote | Matched, with adaptations listed | [parity/blockquote.md](parity/blockquote.md) | [Blockquote](https://dr2madre.github.io/invisible-ui/components/formatting-display/blockquote/) |
| ScrollArea | Matched, with adaptations listed | [parity/scroll-area.md](parity/scroll-area.md) | [Scroll Area](https://dr2madre.github.io/invisible-ui/components/navigation/scroll-area/) |
| Slider | Matched, with adaptations listed | [parity/slider.md](parity/slider.md) | [Slider](https://dr2madre.github.io/invisible-ui/components/forms/slider/) |
| RangeSlider | Matched, with adaptations listed | [parity/range-slider.md](parity/range-slider.md) | [Range Slider](https://dr2madre.github.io/invisible-ui/components/forms/range-slider/) |
| RatingGroup | Matched, with adaptations listed | [parity/rating-group.md](parity/rating-group.md) | [Rating Group](https://dr2madre.github.io/invisible-ui/components/forms/rating-group/) |
| PinInput | Matched, with adaptations listed | [parity/pin-input.md](parity/pin-input.md) | [Pin Input](https://dr2madre.github.io/invisible-ui/components/forms/pin-input/) |
| Radio | Matched, with adaptations listed | [parity/radio.md](parity/radio.md) | [Radio](https://dr2madre.github.io/invisible-ui/components/forms/radio/) |
| ToggleButton | Matched, with adaptations listed | [parity/toggle-button.md](parity/toggle-button.md) | [Toggle Button](https://dr2madre.github.io/invisible-ui/components/forms/toggle-button/) |
| ToggleGroup | Matched, with adaptations listed | [parity/toggle-group.md](parity/toggle-group.md) | [Toggle Group](https://dr2madre.github.io/invisible-ui/components/forms/toggle-group/) |
| ButtonGroup | Matched, with adaptations listed | [parity/button-group.md](parity/button-group.md) | [Button Group](https://dr2madre.github.io/invisible-ui/components/forms/button-group/) |
| Stepper | Matched, with adaptations listed | [parity/stepper.md](parity/stepper.md) | [Stepper](https://dr2madre.github.io/invisible-ui/components/patterns/stepper/) |
| Separator | Matched, with adaptations listed | [parity/separator.md](parity/separator.md) | [Separator](https://dr2madre.github.io/invisible-ui/components/formatting-display/separator/) |
| AspectRatio | Not ported: the widgets library has its own `AspectRatio` | [parity/aspect-ratio.md](parity/aspect-ratio.md) | [Aspect Ratio](https://dr2madre.github.io/invisible-ui/components/formatting-display/aspect-ratio/) |
| Icon | Not ported: the widgets library has its own `Icon` | [parity/icon.md](parity/icon.md) | [Icon](https://dr2madre.github.io/invisible-ui/components/formatting-display/icon/) |

Each checklist compares the Flutter widget with the Svelte reference, line
by line, and names the reference commit it was checked against. The number
field's parsing, validation, stepping and formatting answer the same test
vectors as the core
([`core/src/number-field/__vectors__`](https://github.com/dr2madre/invisible-ui/tree/main/core/src/number-field/__vectors__)),
read by `test/number_format_test.dart` in a checkout of the whole
repository.

The menus also run the shared test vectors in `core/src/menu/__vectors__`
and the Menubar the bar vectors in `core/src/menubar/__vectors__`, the
Tree View the keyboard vectors in `core/src/tree-view/__vectors__`,
Select, Combobox and the radio-style groups the typeahead and navigation
vectors in `core/src/select/__vectors__`, the calendar the grid, key,
bound, range and name vectors in `core/src/calendar/__vectors__`, the
time field the parsing, bound and key sequence vectors in
`core/src/time-field/__vectors__`, and Tabs, Accordion, Pagination,
Progress and Meter the keyboard, toggle, page list and reading vectors in
`core/src/tabs`, `accordion`, `pagination`, `progress` and `meter`, and the
avatar initials the vectors in `core/src/avatar`, the sliders, the stepper
and the PIN input the value, progress and cell vectors in
`core/src/slider`, `range-slider`, `stepper` and `pin-input`, and the
multi select's selection rules the vectors in `core/src/multi-select`,
which the `core/` tests run too.

Table and TableSet run the sort, selection and visibility vectors in
`core/src/table/__vectors__`, Carousel the navigation and key vectors in
`core/src/carousel/__vectors__`, and LocaleProvider the direction vectors
in `core/src/i18n/__vectors__`.

The overlays (Tooltip, Dropdown Menu, Context Menu, Menubar, Popover, the
lists of Select and Combobox) need an `Overlay` above them, as
`WidgetsApp` provides. The notification region wraps the app's navigator
and waits while a modal is open: new notifications show when the last
modal closes, and the ones already shown stay visible under a modal route's
barrier, inert, with their countdowns held (ADR 0016):

```dart
final notices = iu.NotificationController();
final modals = iu.ModalObserver();

WidgetsApp(
  navigatorObservers: [modals],
  builder: (context, child) => iu.NotificationRegion(
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
final delete = await iu.showInvisibleDialog<bool>(
  context: context,
  builder: (context) => const iu.ConfirmDialog(
    title: 'Delete 6 hours?',
    description: 'The hours logged on Monday are removed from the report.',
    confirmLabel: 'Delete',
    cancelLabel: 'Keep hours',
    confirmVariant: iu.ButtonVariant.danger,
  ),
);
if (delete == true) removeHours();
```

- **Modal.** The barrier blocks the screen below, Tab stays inside, Escape
  closes the innermost dialog, and focus returns to the element that had it
  when the dialog opened, also when a dialog opens on top of another.
- **Status area.** Messages about the dialog's own task go in the dialog
  (ADR 0016): `iu.Dialog.of(context).notify(title: 'Upload failed', ...)`
  from the content, or an `iu.DialogController` passed as `controller` from
  outside.
  The `ModalObserver` above counts these dialogs, so the notification
  region holds its toasts while one is open.
- **Prompt.** `iu.PromptDialog` asks for one value and completes with it.
  `required` or `confirmValue` (type the file name to delete it) gate the
  confirm button; Enter confirms, except while an input method composes.
- **Search.** `iu.SearchDialog<T>` filters `SearchDialogItem`s, grouped by
  `group`, with `suggestions` for an empty query and `loading` while results
  load; it announces the number of results. Results fetched as the user
  types come through `onQueryChanged` and a rebuilt dialog.
- **Sheet.** `iu.SheetDialog` anchors the panel to an edge: `side` is
  `top`, `bottom`, `start` or `end`, the last two following the reading
  direction. It slides in unless motion is reduced; with `draggable`, a drag
  of its handle toward the edge closes it, and Escape and the close button
  always do.
- **Close, then report.** A prompt and a search close before they report
  their value through `onConfirm` and `onSelected` (ADR 0011).

### Choices and pickers

Every value control has a controlled constructor (`value:` with
`onChanged:`, or `onSelected:` for `SegmentedControl`) and an
`.uncontrolled(initialValue:)` one, joins an enclosing `Form` (validator,
saver, silent reset to the current default) and takes its options as
`ChoiceItem`s:

```dart
iu.Combobox<String>(
  label: 'Client',
  description: 'Optional.',
  items: [for (final c in clients) iu.ChoiceItem(value: c.id, label: c.name)],
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
- **RadioButtonGroup** is the web's RadioGroup, built on the widgets
  library's `RadioGroup` (which keeps that name) and `iu.Radio`.
- **MultiSelect** keeps several options as removable tags (`values:` with
  `onChanged:`): Enter adds and keeps the list open, every addition and
  removal is announced, and removing a tag moves focus to the next remove
  button.
- **SearchField** runs the search through `onSubmitted` (Enter or its
  submit button); its clear button empties it and puts focus back in it.
  `submitButton: false` makes it a filter that applies as the user types.

### Dates

```dart
iu.DatePicker(
  label: 'Day',
  value: day, // a DateTime; only its year, month and day count
  min: DateTime(2026),
  weekStartsOn: DateTime.monday, // null: the locale's first day, from CLDR
  clearable: true,
  onChanged: (next) => setState(() => day = next), // local midnight, or null
)

iu.TimeField(
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
- **Calendar.** `iu.Calendar` shows one month or two (`CalendarView`); the
  week and agenda views of the web calendar are not carried. Without
  `weekStartsOn`, a week starts on the locale's first day from CLDR
  (`iu.weekStartForLocale`): Sunday for `en-US`, Monday for `en-GB`.
- **Time field.** Digits type with auto-advance, Escape puts back the last
  finished value, and a time outside `min` and `max` is reported, never
  clamped. On touch, a vertical drag on a segment steps it. Arabic-Indic and
  Persian digits type as 0 to 9; the paste shortcut takes a whole time such
  as `09:30`, or types the pasted characters from the focused segment.

### Navigation

```dart
iu.Tabs<String>(
  label: 'Project',
  value: section,
  activationMode: iu.TabActivationMode.manual, // arrows move, Enter selects
  items: const [
    iu.TabItem(value: 'hours', label: 'Hours', count: 12, child: HoursView()),
    iu.TabItem(value: 'people', label: 'People', child: PeopleView()),
  ],
  onChanged: (next) => setState(() => section = next),
)

iu.Breadcrumb(
  items: [
    iu.BreadcrumbItem(label: 'Home', home: true, onPressed: () => go('/')),
    iu.BreadcrumbItem(label: 'Projects', onPressed: () => go('/projects')),
    const iu.BreadcrumbItem(label: 'Timelog'), // the current page
  ],
)
```

- **Disclosures.** `iu.Collapsible(expanded:, onExpansionChanged:)` shows and
  hides one region; `iu.Accordion(value:, onChanged:)` stacks sections, one
  open at a time unless `multiple`. Hidden content keeps its state.
- **Links.** `Link` and the breadcrumb steps open through `onPressed`, so
  the app decides how a destination opens (a route, or a URL it launches)
  and the package needs no URL plugin. Pass `uri` to announce the address.
- **Menus.** `Menubar` holds top menus (`MenubarMenu`) with the items,
  groups and submenus of `DropdownMenu`; the arrows move between top menus.
  `ContextMenu` opens on its child at the pointer: a secondary click, a long
  press on touch, Shift+F10 or the context menu key.
- **Navigation Menu.** A bar where some items open a panel of links: hover
  opens after 150 ms while the pointer stays; a tap, a click, Enter or Space
  opens a panel and keeps it open, the next press closes it; ArrowDown moves
  into the panel, Escape returns to the trigger. A link closes the panel
  before its callback runs. Mark the page on screen with
  `iu.NavigationMenuLink(current: true, ...)`: that link is read as the
  current page and its trigger is marked on screen.
- **Sidebar.** The app's side navigation, with collapsible sections and an
  icon rail. Every destination reports `onSelected`; the app navigates and
  decides where the sidebar shows, as on the web. On a narrow screen
  `iu.showSidebarDrawer(context:, builder:)` shows it in a Sheet Dialog at
  the inline-start edge (ADR 0013); following a destination closes the
  drawer, then reports.
- **Tree View.** The tree keyboard of the APG with typeahead, which moves
  focus only. Single selection. Children load on demand
  (`onLoadChildren`). For assistive technology, a closed parent offers an
  Expand action, an open one a Collapse action, and an open parent whose
  load failed a Retry action.
- **Pagination.** `iu.Pagination(page:, pageCount:, onPageChanged:)` shows the
  boundary pages, the siblings of the current page and the gaps.
- **Progress and Meter.** `Progress` is determinate, as on the web: work of
  unknown length is waiting, which `iu.Loading(variant: iu.LoadingVariant.bar)`
  shows. `Meter` colours its fill by how good the value is, given
  `optimum`.

### Data and form patterns

```dart
iu.TableSet<Map<String, Object?>>(
  title: 'Customers',
  columns: const [
    iu.TableColumn(key: 'name', header: 'Name', sortable: true),
    iu.TableColumn(key: 'city', header: 'City'),
  ],
  rows: filteredCustomers, // the app filters
  pageSize: 10,
  filtersActive: query.isNotEmpty,
  totalRowCount: customers.length,
  onClearFilters: () => setState(() => query = ''),
  selectionMode: iu.SelectionMode.multiple,
  selectedRowIds: selected,
  onSelectedRowIdsChanged: (ids) => setState(() => selected = ids),
  getRowLabel: (row) => row['name']! as String,
)

iu.UploadDropArea(
  accept: '.pdf,image/*',
  onBrowse: pickFiles, // the app opens the picker, e.g. with file_selector
  onFiles: (files) => setState(() => attachments.addAll(files)),
)
```

- **Tables.** `iu.Table` is the controlled table: it shows `sort` and
  reports a header press; `iu.nextSort` and `iu.sortRows` give the cycle
  and the stable sort. Flutter's semantics carry the table, row, cell and
  column header roles; a sorted header's value says "sorted ascending" and
  the change is announced, since Flutter has no sort property. A table
  wider than its container scrolls sideways, and the scroller takes focus
  only then. Cells are measured for their column, so a `cellBuilder`
  returns text, icons or buttons, not a `LayoutBuilder`.
- **Table sets.** `iu.TableSet` adds the title, the column list, the card
  view, pagination or loading more, filtering coordination and selection,
  following units 5A to 5C of the data table spec; with `views` it shows
  tabs. Each setting is a controllable mirror. Selection needs stable,
  unique ids and `getRowLabel`; the selection is the app's data and is
  never pruned. The view inside stays internal, as on the web.
- **Carousel.** `iu.Carousel` names its slides "2 of 5", announces each
  move, takes the arrow keys (mirrored right to left) and moves at once
  under reduced motion. It never advances on its own. Coverflow neighbours
  are never faded, so their text keeps its contrast.
- **Sign-in.** `iu.LoginForm` puts the email and password fields in an
  `AutofillGroup` with the username, email and password hints, so a
  password manager fills and saves them; labels come from the catalog.
- **Uploads.** `iu.UploadDropArea` adds no dependency: `onBrowse` opens the
  app's picker and returns `iu.UploadFile`s; drops reach it through an
  `iu.UploadDropController` the app wires to its drop plugin, and only then
  does the drop prompt show. Picked and dropped files pass the same
  `accept` filter; rejected files are named and announced. See the
  `file_selector` example in [parity/upload-drop-area.md](parity/upload-drop-area.md).
- **Locale.** `iu.LocaleProvider(locale: const Locale('ar'), child: ...)`
  sets the locale through `Localizations`, the direction from the locale
  and, with `messages`, the catalog for a subtree.

### Display

```dart
iu.Tag(
  status: iu.TagStatus.selected,
  onRemoved: () => removeFilter('design'), // shows the remove button
  removeLabel: 'Remove Design',
  child: const Text('Design'),
)

iu.CodeBlock(code: snippet, language: 'Dart') // a copy button, announced

iu.Button(onPressed: () {}, copy: link, child: const Text('Copy link'))
```

- **Avatars.** `iu.Avatar(name:, image:)` shows the photo, or the initials
  while it loads and when it fails; the whole avatar is one image named
  `name`. `AvatarGroup` folds the people past `max` into a "+N" chip, named
  by `InvisibleMessages.avatarGroupMore`, a function of the count, so a
  translation picks its own plural forms.
- **Counts and tags.** `Count` is a live region named by `semanticLabel`
  ("3 unread messages"); a tag's meaning is its text. The colour of either
  adds to the text and never replaces it.
- **Code.** `Code` and `CodeBlock` show their text as text, in
  `InvisibleThemeData.monoFontFamily` or the web's monospace stack.
  `CodeBlock` copies through Flutter's `Clipboard`. A `Button` with `copy`
  copies too, and shows "Copied" beside itself for two seconds, announced,
  keeping its name and focus.
- **Skeleton.** Hidden from assistive technology unless it has a
  `semanticLabel`; still under reduced motion.
- **LoadingGenerationArea.** Fills a surface with a drifting dot field and
  a label zone (`status`, `value`, `detail`) while `loading`, then fades in
  its `child`. A polite live region; still under reduced motion.
- **ScrollArea.** A focusable viewport with the theme's scroll bars; the
  keyboard scrolls it while it has focus. With `semanticLabel` it is a named
  region.
- **AspectRatio** is the widgets library's own; see
  [parity/aspect-ratio.md](parity/aspect-ratio.md).

### Values

```dart
iu.Slider(
  label: 'Volume',
  value: volume,
  step: 5,
  format: (v) => '${v.round()}%', // the shown and announced text
  onChanged: (next) => setState(() => volume = next), // while it moves
  onChangeEnd: save, // once per drag, tap or key
)

iu.PinInput(
  label: 'Verification code',
  value: code,
  onChanged: (next) => setState(() => code = next),
  onCompleted: verify, // every cell filled
)
```

- **Forms.** Each has a controlled constructor and an `.uncontrolled` one,
  and joins an enclosing `Form` with `onSaved` and a silent reset.
  `iu.Slider`, `iu.RangeSlider`, `iu.RatingGroup`, `iu.PinInput` and
  `iu.ToggleButton` take `error`, or a `validator` with `autovalidateMode`:
  the message shows under the control after a hazard glyph, marks it
  invalid and is announced, and a form reset clears it. For example
  `iu.RatingGroup.uncontrolled(label: 'Rating', validator: (v) => v == null
  ? 'Choose a rating.' : null)`. `iu.Radio` holds no value;
  `iu.RadioButtonGroup` does, and shows its own error the same way.
- **Sliders.** `Slider` and `RangeSlider` take the keys of a native range
  input: arrows, Page Up and Page Down, Home and End, mirrored right to
  left. A `RangeSlider` value is a `(double, double)` pair whose thumbs
  never cross and keep `minDistance`; each thumb announces the bound it may
  not pass. `label` and `thumbLabels` name them without showing.
- **Choices.** `iu.RatingGroup` is a radio group of stars. `iu.Radio` is
  one radio button built on `RawRadio`: inside a `RadioGroup` it joins it,
  as Flutter's own radios do (`RadioGroup<String>(groupValue: plan,
  onChanged: ..., child: Column(children: [iu.Radio(value: 'free', label:
  'Free'), ...]))`); outside one, radios with the same `name` form a group
  with one tab stop and arrow keys, the parent holding `groupValue`.
  `iu.ToggleButton` is an on and off button, announced as a toggle button;
  its name stays the same in both states, and a tap, Enter or Space flips
  it. `iu.ToggleGroup` lays out independent toggles, separate or joined,
  and keeps no state: with three or more toggles it is one tab stop with
  arrow keys and Home and End, mirrored right to left; with one or two each
  toggle is its own tab stop; inside an `iu.Toolbar` the toolbar's keys
  apply. For one choice among several, use `iu.SegmentedControl`.
- **PinInput.** One cell per character, moving on as the user types; a
  paste or a code the platform fills in spreads over the cells, and the
  first cell carries the one-time code autofill hint. `obscureText` hides
  the characters; the widget never logs the code. Arabic-Indic and Persian
  digits, typed or pasted, land in the cells as 0 to 9 and the code is
  reported in ASCII.
- **Groups and steps.** `ButtonGroup` names a set of action buttons and
  joins them into one bar when `attached`. `Stepper` shows the steps of a
  task; in linear mode only the current and completed steps can be chosen,
  and a narrow stepper stacks its steps.
- **Icon** is the widgets library's own; see [parity/icon.md](parity/icon.md).

An app that also imports Material keeps both sets of names apart with the
prefixed import: `iu.Slider` is this package's, `Slider` is Material's.

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
flutter widget-preview start   # previews in preview/, on the current stable release
```

Screen reader behaviour (VoiceOver, TalkBack, NVDA and the others) is a
manual check. Assistive technology: not tested.

## License

[MIT](LICENSE).
