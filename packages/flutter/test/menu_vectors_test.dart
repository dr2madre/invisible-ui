import 'dart:convert';
import 'dart:io';
import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/menu/menu_tree.dart';
import 'package:invisible_ui/src/menu/submenu_geometry.dart';

// The language-neutral vectors core/src/menu/vectors.test.ts runs against
// core/. Present in a checkout of the whole repository; a copy of this
// package alone skips them.
final Directory _vectors = Directory('../../core/src/menu/__vectors__');

Map<String, dynamic> _read(String name) =>
    jsonDecode(File('${_vectors.path}/$name').readAsStringSync())
        as Map<String, dynamic>;

List<Map<String, dynamic>> _cases(Map<String, dynamic> file) =>
    (file['cases'] as List<dynamic>).cast<Map<String, dynamic>>();

List<String> _strings(Object? list) => (list! as List<dynamic>).cast<String>();

MenuEntry<String> _entry(Map<String, dynamic> json) {
  switch (json['type']) {
    case 'separator':
      return const MenuSeparator();
    case 'group':
      return MenuGroup(
        label: json['label'] as String,
        items: [
          for (final item in json['items'] as List<dynamic>)
            _entry(item as Map<String, dynamic>) as MenuStop<String>,
        ],
      );
    case 'submenu':
      return MenuSubmenu(
        value: json['value'] as String,
        label: json['label'] as String,
        disabled: json['disabled'] as bool? ?? false,
        items: [
          for (final item in json['items'] as List<dynamic>)
            _entry(item as Map<String, dynamic>),
        ],
      );
    default:
      return MenuItem(
        value: json['value'] as String,
        label: json['label'] as String? ?? json['value'] as String,
        disabled: json['disabled'] as bool? ?? false,
        kind: MenuItemKind.values.byName(json['kind'] as String? ?? 'action'),
        checked: json['checked'] as bool? ?? false,
      );
  }
}

const _keys = {
  'ArrowDown': MenuKey.arrowDown,
  'ArrowUp': MenuKey.arrowUp,
  'ArrowLeft': MenuKey.arrowLeft,
  'ArrowRight': MenuKey.arrowRight,
  'Home': MenuKey.home,
  'End': MenuKey.end,
  'Enter': MenuKey.enter,
  ' ': MenuKey.space,
  'Escape': MenuKey.escape,
  'Tab': MenuKey.tab,
};

TextDirection _direction(Object? name) =>
    name == 'rtl' ? TextDirection.rtl : TextDirection.ltr;

Rect _rect(Object? json) {
  final r = json! as Map<String, dynamic>;
  return Rect.fromLTWH(
    (r['x'] as num).toDouble(),
    (r['y'] as num).toDouble(),
    (r['width'] as num).toDouble(),
    (r['height'] as num).toDouble(),
  );
}

Size _size(Object? json) {
  final s = json! as Map<String, dynamic>;
  return Size((s['width'] as num).toDouble(), (s['height'] as num).toDouble());
}

Offset _point(Object? json) {
  final p = json! as Map<String, dynamic>;
  return Offset((p['x'] as num).toDouble(), (p['y'] as num).toDouble());
}

void main() {
  if (!_vectors.existsSync()) {
    test('menu vectors', () {}, skip: 'core/ is not in this checkout');
    return;
  }

  final tree = MenuTree<String>([
    for (final entry in _read('menu-tree.json')['tree'] as List<dynamic>)
      _entry(entry as Map<String, dynamic>),
  ]);

  group('menu keyboard vectors', () {
    for (final vector in _cases(_read('menu-keyboard.json'))) {
      test(vector['name'] as String, () {
        final result = tree.key(
          MenuNavState(
            open: true,
            openPath: _strings(vector['openPath']),
            activeValue: vector['activeValue'] as String?,
          ),
          _keys[vector['key']]!,
          _direction(vector['direction']),
        );
        final after = tree.resolve(result.state);
        final expected = vector['expect'] as Map<String, dynamic>;
        expect({
          'open': after.open,
          'openPath': after.openPath,
          'activeValue': after.activeValue,
          'reported': [?result.selected],
          'handled': result.handled,
        }, expected);
      });
    }
  });

  group('menu typeahead vectors', () {
    for (final vector in _cases(_read('menu-typeahead.json'))) {
      test(vector['name'] as String, () {
        expect(
          MenuTree.matchItem(
            tree.entriesAt(_strings(vector['path'])),
            vector['query'] as String,
            vector['from'] as String?,
          ),
          vector['expect'],
        );
      });
    }
  });

  group('menu grace area vectors', () {
    final file = _read('menu-grace-area.json');
    test('uses the bleed the vectors assume', () {
      expect(graceBleed, file['bleed']);
    });
    for (final vector in _cases(file)) {
      test(vector['name'] as String, () {
        expect(
          isInGraceArea(
            _point(vector['point']),
            _point(vector['exit']),
            _rect(vector['submenu']),
            submenuOnRight: vector['side'] == 'right',
          ),
          vector['inside'],
        );
      });
    }
  });

  group('menu placement vectors', () {
    final file = _read('menu-placement.json');
    for (final vector in _cases(file)) {
      test(vector['name'] as String, () {
        final placed = placeSubmenu(
          anchor: _rect(vector['anchor']),
          menu: _size(vector['menu']),
          viewport: _size(vector['viewport']),
          direction: _direction(vector['direction']),
          padding: (file['padding'] as num).toDouble(),
        );
        final expected = vector['expect'] as Map<String, dynamic>;
        expect({
          'side': switch (placed.side) {
            SubmenuSide.inlineEnd => 'inline-end',
            SubmenuSide.inlineStart => 'inline-start',
            SubmenuSide.overlap => 'overlap',
          },
          'physicalSide': switch (placed.onRight) {
            true => 'right',
            false => 'left',
            null => null,
          },
          'x': placed.offset.dx,
          'y': placed.offset.dy,
          'maxHeight': placed.maxHeight,
        }, expected);
      });
    }
  });
}
