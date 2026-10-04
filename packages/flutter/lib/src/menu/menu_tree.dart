import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart' show TextDirection;

import 'menu_entry.dart';

// The menu rules of `core/src/menu` (state.ts, tree.ts and the key handler in
// connect.ts) in Dart. They take data and return data, so the shared vectors
// in core/src/menu/__vectors__ hold both implementations to the same answers.

/// The stops of one level in order, groups flattened. A submenu trigger is a
/// stop; its own items belong to the next level.
List<MenuStop<T>> itemsOf<T>(List<MenuEntry<T>> entries) => [
  for (final entry in entries)
    ...switch (entry) {
      MenuSeparator() => const [],
      MenuGroup(:final items) => items,
      MenuStop() => [entry],
    },
];

/// Whether a stop takes no focus: it is disabled, or it is a submenu with no
/// enabled stop, so no key opens an empty level.
///
/// The answer depends only on the immutable stop, so it is remembered: a
/// submenu's subtree is walked once, not on every key press and rebuild.
bool isStopDisabled<T>(MenuStop<T> stop) => _disabled[stop] ??= switch (stop) {
  _ when stop.disabled => true,
  MenuSubmenu(:final items) => !itemsOf(items).any((s) => !isStopDisabled(s)),
  MenuItem() => false,
};

final Expando<bool> _disabled = Expando('menu stop disabled');

/// A stop found in the tree, with the values of the submenus that hold it.
@immutable
class MenuLocation<T> {
  /// Creates a location.
  const MenuLocation(this.stop, this.path);

  /// The item or submenu trigger.
  final MenuStop<T> stop;

  /// The submenu values from the root outward; empty for a root stop.
  final List<T> path;
}

/// The open state of a menu: the root, the open submenus and the focused stop.
@immutable
class MenuNavState<T> {
  /// Creates a state.
  const MenuNavState({
    this.open = false,
    this.openPath = const [],
    this.activeValue,
  });

  /// Whether the root menu is open.
  final bool open;

  /// The values of the open submenu triggers, from the root outward.
  final List<T> openPath;

  /// The focused stop, at any level.
  final T? activeValue;

  /// A copy with the given fields replaced. [activeValue] is always replaced.
  MenuNavState<T> copyWith({
    bool? open,
    List<T>? openPath,
    required T? activeValue,
  }) => MenuNavState(
    open: open ?? this.open,
    openPath: openPath ?? this.openPath,
    activeValue: activeValue,
  );

  @override
  bool operator ==(Object other) =>
      other is MenuNavState<T> &&
      other.open == open &&
      listEquals(other.openPath, openPath) &&
      other.activeValue == activeValue;

  @override
  int get hashCode => Object.hash(open, Object.hashAll(openPath), activeValue);
}

/// The keys an open menu acts on.
enum MenuKey {
  /// Next stop of the level.
  arrowDown,

  /// Previous stop of the level.
  arrowUp,

  /// Opens or closes a submenu, by direction.
  arrowLeft,

  /// Opens or closes a submenu, by direction.
  arrowRight,

  /// First stop of the level.
  home,

  /// Last stop of the level.
  end,

  /// Activates the stop.
  enter,

  /// Activates the stop; a checkable item keeps the menu open.
  space,

  /// Closes one level.
  escape,

  /// Closes every level.
  tab,
}

/// What a key did: the new state, the value to report, and whether the key
/// was used. An unused key is left to an enclosing handler (a Menubar).
@immutable
class MenuKeyResult<T> {
  const MenuKeyResult._(this.state, this.handled, [this.selected]);

  /// The state after the key.
  final MenuNavState<T> state;

  /// Whether the key was used.
  final bool handled;

  /// The value to report through `onSelected`, if any. When [state] is
  /// closed, the report comes after every level has closed.
  final T? selected;
}

/// A menu tree with its index, answering the questions of every level.
class MenuTree<T> {
  /// Indexes [entries]. A value used twice fails an assertion.
  MenuTree(this.entries) {
    void walk(List<MenuEntry<T>> level, List<T> path) {
      for (final stop in itemsOf(level)) {
        assert(
          !_index.containsKey(stop.value),
          'Menu value "${stop.value}" appears more than once in the menu tree.',
        );
        _index.putIfAbsent(stop.value, () => MenuLocation(stop, path));
        if (stop is MenuSubmenu<T>) walk(stop.items, [...path, stop.value]);
      }
    }

    walk(entries, const []);
  }

  /// The entries of the root menu.
  final List<MenuEntry<T>> entries;

  final Map<T, MenuLocation<T>> _index = {};

  /// A stop anywhere in the tree, with its path, or null.
  MenuLocation<T>? find(T value) => _index[value];

  /// The entries of the level [path] opens; empty when it leads nowhere.
  List<MenuEntry<T>> entriesAt(List<T> path) {
    var level = entries;
    for (final value in path) {
      final stop = itemsOf(level).where((s) => s.value == value).firstOrNull;
      if (stop is! MenuSubmenu<T>) return const [];
      level = stop.items;
    }
    return level;
  }

  /// The part of [path] that still holds: cut at the first value that is
  /// gone, is not a submenu, or cannot open.
  List<T> resolveOpenPath(List<T> path) {
    final opened = <T>[];
    var level = entries;
    for (final value in path) {
      final stop = itemsOf(level).where((s) => s.value == value).firstOrNull;
      if (stop is! MenuSubmenu<T> || isStopDisabled(stop)) break;
      opened.add(value);
      level = stop.items;
    }
    return opened;
  }

  /// The first enabled stop of [entries], or null.
  static T? firstEnabled<T>(List<MenuEntry<T>> entries) =>
      itemsOf(entries).where((s) => !isStopDisabled(s)).firstOrNull?.value;

  /// The last enabled stop of [entries], or null.
  static T? lastEnabled<T>(List<MenuEntry<T>> entries) =>
      itemsOf(entries).where((s) => !isStopDisabled(s)).lastOrNull?.value;

  /// The enabled stop [delta] steps from [value], wrapping, or null.
  static T? step<T>(List<MenuEntry<T>> entries, T? value, int delta) {
    final stops = itemsOf(entries);
    final count = stops.length;
    if (count == 0) return null;
    final start = stops.indexWhere((s) => s.value == value);
    final from = start == -1 ? (delta == 1 ? -1 : 0) : start;
    for (var i = 1; i <= count; i++) {
      final stop = stops[(from + delta * i + count * i) % count];
      if (!isStopDisabled(stop)) return stop.value;
    }
    return null;
  }

  /// The next enabled stop of [entries] whose label starts with [query],
  /// ignoring case, searching after [from] and wrapping; null when none.
  static T? matchItem<T>(List<MenuEntry<T>> entries, String query, T? from) {
    if (query.isEmpty) return null;
    final q = query.toLowerCase();
    final enabled = itemsOf(entries).where((s) => !isStopDisabled(s)).toList();
    if (enabled.isEmpty) return null;
    final start = enabled.indexWhere((s) => s.value == from);
    for (var i = 1; i <= enabled.length; i++) {
      final stop = enabled[(start + i + enabled.length) % enabled.length];
      if (stop.label.toLowerCase().startsWith(q)) return stop.value;
    }
    return null;
  }

  /// [state] with its open path cut to what still holds; a closed menu has
  /// none.
  MenuNavState<T> resolve(MenuNavState<T> state) => state.copyWith(
    openPath: state.open ? resolveOpenPath(state.openPath) : const [],
    activeValue: state.activeValue,
  );

  /// Opens the root menu on its first or last enabled stop.
  MenuNavState<T> openRoot({bool last = false}) => MenuNavState(
    open: true,
    activeValue: last ? lastEnabled(entries) : firstEnabled(entries),
  );

  /// Opens the submenu [value] and the submenus that hold it, closing any
  /// other open submenu of the same levels. [focusFirst] (keys) focuses its
  /// first enabled stop; otherwise (hover, press) focus stays. Null when the
  /// submenu cannot open.
  MenuNavState<T>? openSubmenu(
    MenuNavState<T> state,
    T value, {
    required bool focusFirst,
  }) {
    final located = _index[value];
    final stop = located?.stop;
    if (!state.open || stop is! MenuSubmenu<T> || isStopDisabled(stop)) {
      return null;
    }
    return state.copyWith(
      openPath: [...located!.path, value],
      activeValue: focusFirst ? firstEnabled(stop.items) : state.activeValue,
    );
  }

  /// Closes the level [scope] opens, and anything deeper, focusing its
  /// trigger.
  MenuNavState<T> closeLevel(MenuNavState<T> state, List<T> scope) =>
      scope.isEmpty
      ? state
      : state.copyWith(
          openPath: scope.sublist(0, scope.length - 1),
          activeValue: scope.last,
        );

  /// The key map of an open menu (docs/menu-submenu-spec.md), for the level
  /// that has focus. Matches `onMenuKeyDown` in core/src/menu/connect.ts.
  MenuKeyResult<T> key(
    MenuNavState<T> current,
    MenuKey key,
    TextDirection direction,
  ) {
    final state = resolve(current);
    final path = state.openPath;
    final active = state.activeValue;
    final focused = active == null ? null : _index[active];
    // The level that has focus: the active stop's, or the deepest open one.
    final scope = focused?.path ?? path;
    final level = entriesAt(scope);

    MenuKeyResult<T> done(MenuNavState<T> next, [T? selected]) =>
        MenuKeyResult._(next, true, selected);
    final unused = MenuKeyResult<T>._(state, false);
    final closed = MenuNavState<T>();

    // Moving within a level closes the submenus open below it.
    MenuKeyResult<T> move(T? target) => done(
      target == null
          ? state
          : state.copyWith(
              openPath: path.length > scope.length
                  ? path.sublist(0, scope.length)
                  : path,
              activeValue: target,
            ),
    );

    final rtl = direction == TextDirection.rtl;
    final openKey = rtl ? MenuKey.arrowLeft : MenuKey.arrowRight;
    final closeKey = rtl ? MenuKey.arrowRight : MenuKey.arrowLeft;
    final opensSubmenu =
        focused != null &&
        focused.stop is MenuSubmenu<T> &&
        !isStopDisabled(focused.stop);

    if (key == openKey) {
      // Only a submenu trigger that can open takes it; elsewhere a Menubar may.
      if (!opensSubmenu) return unused;
      return done(openSubmenu(state, active as T, focusFirst: true)!);
    }
    if (key == closeKey) {
      // Only a submenu closes on it; in the root menu a Menubar may take it.
      if (scope.isEmpty) return unused;
      return done(closeLevel(state, scope));
    }

    switch (key) {
      case MenuKey.arrowDown:
        return move(step(level, active, 1));
      case MenuKey.arrowUp:
        return move(step(level, active, -1));
      case MenuKey.home:
        return move(firstEnabled(level));
      case MenuKey.end:
        return move(lastEnabled(level));
      case MenuKey.enter:
      case MenuKey.space:
        if (focused == null || isStopDisabled(focused.stop)) {
          return done(state);
        }
        final stop = focused.stop;
        if (stop is MenuSubmenu<T>) {
          return done(openSubmenu(state, stop.value, focusFirst: true)!);
        }
        final item = stop as MenuItem<T>;
        // Space on a checkable item reports the change and keeps every level
        // open, so several options can be set in a row.
        if (key == MenuKey.space && item.kind != MenuItemKind.action) {
          return done(state, item.value);
        }
        return done(closed, item.value);
      case MenuKey.escape:
        if (path.length > scope.length) {
          return done(state.copyWith(openPath: scope, activeValue: active));
        }
        if (scope.isNotEmpty) return done(closeLevel(state, scope));
        return done(closed);
      case MenuKey.tab:
        // Closes every level; moving focus on is the caller's part.
        return MenuKeyResult._(closed, false);
      case MenuKey.arrowLeft:
      case MenuKey.arrowRight:
        return unused;
    }
  }
}
