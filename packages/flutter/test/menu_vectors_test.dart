import 'dart:convert';
import 'dart:io';
import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/menu/menu_tree.dart';
import 'package:invisible_ui/src/menu/submenu_geometry.dart';
import 'package:invisible_ui/src/menubar/menubar_nav.dart';

// The language-neutral vectors core/src/menu/vectors.test.ts and
// core/src/menubar/vectors.test.ts run against core/. Present in a checkout of the whole repository; a copy of this
// package alone skips them.
final Directory _vectors = Directory('../../core/src/menu/__vectors__');
final File _menubarVectors = File(
  '../../core/src/menubar/__vectors__/menubar-keyboard.json',
);

const Map<String, MenubarKey> _menubarKeys = {
  'ArrowLeft': MenubarKey.arrowLeft,
  'ArrowRight': MenubarKey.arrowRight,
  'Home': MenubarKey.home,
  'End': MenubarKey.end,
};

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

  group('menubar vectors', () {
    final file =
        jsonDecode(_menubarVectors.readAsStringSync()) as Map<String, dynamic>;
    final disabled = [
      for (final menu in file['menus'] as List<dynamic>)
        (menu as Map<String, dynamic>)['disabled'] as bool? ?? false,
    ];
    for (final vector in _cases(file)) {
      test(vector['name'] as String, () {
        final nav = MenubarNav(
          disabled: disabled,
          focusedIndex: vector['focusedIndex'] as int,
          openIndex: vector['openIndex'] as int,
        );
        final event = vector['event'] as String;
        final key = _menubarKeys[event];
        final unused = MenubarStep(
          focusedIndex: nav.focusedIndex,
          openIndex: nav.openIndex,
          handled: false,
        );
        final step = switch (event) {
          'pointerEnter' => nav.pointerEnter(vector['index'] as int),
          // The open menu took the key: the bar leaves it alone.
          _ when vector['menuHandled'] == true || key == null => unused,
          _ => nav.key(key, _direction(vector['direction'])),
        };
        // What the bar asks for, in the order the core asks for it.
        final log = [
          if (nav.openIndex != -1 && nav.openIndex != step.openIndex)
            'close:${nav.openIndex}',
          if (step.openIndex != -1 && step.openIndex != nav.openIndex)
            'open:${step.openIndex}',
          if (step.focus != null) 'focus:${step.focus}',
        ];
        final expected = vector['expected'] as Map<String, dynamic>;
        expect(
          {
            'focusedIndex': step.focusedIndex,
            'openIndex': step.openIndex,
            'log': log,
          },
          {
            'focusedIndex': expected['focusedIndex'],
            'openIndex': expected['openIndex'],
            'log': expected['log'],
          },
        );
        if (expected['handled'] case final bool handled) {
          expect(step.handled, handled);
        }
      });
    }
  });
}
