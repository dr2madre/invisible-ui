import '../choice/choice_item.dart';

// The single-select collection rules of `core/src/internal/collection.ts` and
// the typeahead of `core/src/select/state.ts`, in Dart. They take data and
// return data, so the shared vectors in core/src/select/__vectors__ hold both
// implementations to the same answers.

/// The first enabled item's value, or null when none is enabled.
T? firstEnabled<T>(List<ChoiceItem<T>> items) =>
    items.where((item) => !item.disabled).firstOrNull?.value;

/// The last enabled item's value, or null when none is enabled.
T? lastEnabled<T>(List<ChoiceItem<T>> items) =>
    items.where((item) => !item.disabled).lastOrNull?.value;

/// The enabled item [delta] steps (1 or -1) from [value], wrapping and
/// skipping disabled items. With no [value] in [items], a forward step lands
/// on the first enabled item and a backward step on the last. Null when no
/// item is enabled.
T? stepEnabled<T>(List<ChoiceItem<T>> items, T? value, int delta) {
  final count = items.length;
  if (count == 0) return null;
  final start = items.indexWhere((item) => item.value == value);
  final from = start == -1 ? (delta == 1 ? -1 : 0) : start;
  for (var i = 1; i <= count; i++) {
    final item = items[(from + delta * i + count * i) % count];
    if (!item.disabled) return item.value;
  }
  return null;
}

/// The next enabled item whose label starts with [query], ignoring case,
/// searching after [from] and wrapping; null when none matches.
T? matchOption<T>(List<ChoiceItem<T>> items, String query, T? from) {
  if (query.isEmpty) return null;
  final q = query.toLowerCase();
  final enabled = items.where((item) => !item.disabled).toList();
  if (enabled.isEmpty) return null;
  final start = enabled.indexWhere((item) => item.value == from);
  for (var i = 1; i <= enabled.length; i++) {
    final item = enabled[(start + i + enabled.length) % enabled.length];
    if (item.label.toLowerCase().startsWith(q)) return item.value;
  }
  return null;
}

/// The items whose label contains [query], ignoring case and the spaces
/// around the query; every item for an empty query. The default filter of
/// the web Combobox.
List<ChoiceItem<T>> containsFilter<T>(List<ChoiceItem<T>> items, String query) {
  final q = query.trim().toLowerCase();
  if (q.isEmpty) return items;
  return [
    for (final item in items)
      if (item.label.toLowerCase().contains(q)) item,
  ];
}
