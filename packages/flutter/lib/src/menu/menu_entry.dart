import 'package:flutter/foundation.dart';

/// What a menu item does when it is activated.
enum MenuItemKind {
  /// Runs an action. The default.
  action,

  /// Turns something on or off. The app owns the state through
  /// [MenuItem.checked].
  checkbox,

  /// Picks one option out of a set. The app owns the state through
  /// [MenuItem.checked].
  radio,
}

/// Everything a menu holds: items, submenus, groups and separators.
///
/// Values identify items across the whole tree, submenus included, so each
/// value appears once.
@immutable
sealed class MenuEntry<T> {
  /// Const constructor for the entry kinds.
  const MenuEntry();
}

/// A stop the user can move to within one level: an item or a submenu
/// trigger.
sealed class MenuStop<T> extends MenuEntry<T> {
  /// Const constructor for the stop kinds.
  const MenuStop({
    required this.value,
    required this.label,
    this.disabled = false,
  });

  /// The identity of the stop, unique in the whole tree.
  final T value;

  /// The visible label: the accessible name and the typeahead text.
  final String label;

  /// Whether the stop takes no focus and does nothing.
  final bool disabled;
}

/// An item that runs an action, or a checkbox or radio item.
final class MenuItem<T> extends MenuStop<T> {
  /// Creates an item.
  const MenuItem({
    required super.value,
    required super.label,
    super.disabled,
    this.kind = MenuItemKind.action,
    this.checked = false,
  });

  /// What the item does.
  final MenuItemKind kind;

  /// Whether a checkbox or radio item is on. Ignored for an action.
  final bool checked;
}

/// An item that opens a nested menu beside it. It never reports through
/// `onSelected`.
final class MenuSubmenu<T> extends MenuStop<T> {
  /// Creates a submenu trigger and its items.
  const MenuSubmenu({
    required super.value,
    required super.label,
    required this.items,
    super.disabled,
  });

  /// Items, separators, groups and further submenus, in the order shown.
  final List<MenuEntry<T>> items;
}

/// A named set of items, announced as a group with its label.
final class MenuGroup<T> extends MenuEntry<T> {
  /// Creates a group.
  const MenuGroup({required this.label, required this.items});

  /// The visible label naming the group.
  final String label;

  /// The items and submenu triggers of the group.
  final List<MenuStop<T>> items;
}

/// A line between groups of items. It takes no focus.
final class MenuSeparator<T> extends MenuEntry<T> {
  /// Creates a separator.
  const MenuSeparator();
}
