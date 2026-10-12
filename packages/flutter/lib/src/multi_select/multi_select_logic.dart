import '../choice/choice_item.dart';

// The selection rules of `core/src/multi-select/state.ts`, in Dart. They take
// data and return data, so the shared vectors in
// core/src/multi-select/__vectors__ hold both implementations to the same
// answers. A no-op returns the same list, so it never reaches a report.

/// [values] with [value] added at the end. The same list when [value] is
/// already there, or when [max] is reached: it blocks additions and never
/// removes what is chosen.
List<T> addValue<T>(List<T> values, T value, int? max) {
  if (values.contains(value)) return values;
  if (max != null && values.length >= max) return values;
  return [...values, value];
}

/// [values] without [value], every occurrence. The same list when it is not
/// there.
List<T> removeValue<T>(List<T> values, T value) {
  if (!values.contains(value)) return values;
  return [
    for (final existing in values)
      if (existing != value) existing,
  ];
}

/// The item behind a chosen [value]. A value with no item in [items] stays
/// chosen: it resolves to an item labelled with the value itself.
ChoiceItem<T> resolveItem<T>(List<ChoiceItem<T>> items, T value) =>
    items.where((item) => item.value == value).firstOrNull ??
    ChoiceItem<T>(value: value, label: '$value');

/// The value Backspace may remove: the last one whose item is enabled, or
/// null. Disabled chosen values are immune.
T? lastRemovableValue<T>(List<T> values, List<ChoiceItem<T>> items) {
  for (final value in values.reversed) {
    if (!resolveItem(items, value).disabled) return value;
  }
  return null;
}
