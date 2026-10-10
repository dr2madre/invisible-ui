import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

/// The shared initials vectors. Present in a checkout of the whole
/// repository; a copy of this package alone skips them.
final File _vectors = File('../../core/src/avatar/__vectors__/initials.json');

// A 1 by 1 transparent PNG.
final Uint8List _pixel = Uint8List.fromList(
  base64Decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA'
    '60e6kgAAAABJRU5ErkJggg==',
  ),
);

void main() {
  test(
    'initials answer the shared vectors',
    () {
      final json =
          jsonDecode(_vectors.readAsStringSync()) as Map<String, dynamic>;
      for (final vector
          in (json['initials'] as List<dynamic>).cast<Map<String, dynamic>>()) {
        expect(
          initialsOf(vector['input'] as String),
          vector['expect'],
          reason: vector['name'] as String,
        );
      }
    },
    skip: _vectors.existsSync() ? false : 'core/ is not in this checkout',
  );

  testWidgets('semantics: one image named by the name or the label, with '
      'the initials hidden', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Avatar(name: 'Ada Lovelace'),
            Avatar(name: 'Grace Hopper', semanticLabel: 'Grace Hopper, admin'),
          ],
        ),
      ),
    );
    expect(find.text('AL'), findsOneWidget);
    expect(find.text('GH'), findsOneWidget);
    expect(
      tester.getSemantics(find.byType(Avatar).first),
      semanticsWith(label: 'Ada Lovelace'),
    );
    expect(
      tester.getSemantics(find.byType(Avatar).last),
      semanticsWith(label: 'Grace Hopper, admin'),
    );
    expect(find.bySemanticsLabel('AL'), findsNothing);
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('the image shows once loaded; a broken image keeps the '
      'initials', (tester) async {
    await tester.pumpWidget(
      harness(
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Avatar(name: 'Ada Lovelace', image: MemoryImage(_pixel)),
            Avatar(
              name: 'Grace Hopper',
              image: MemoryImage(Uint8List.fromList([0, 1, 2, 3])),
            ),
          ],
        ),
      ),
    );
    // The initials hold the place while the images decode.
    expect(find.text('AL'), findsOneWidget);
    await tester.runAsync(() async {
      for (final element in find.byType(Image).evaluate()) {
        final image = (element.widget as Image).image;
        await precacheImage(image, element, onError: (_, _) {});
      }
    });
    await tester.pump();
    expect(find.text('AL'), findsNothing);
    expect(find.text('GH'), findsOneWidget);
  });

  testWidgets('sizes, shapes and the background colour; the box grows with '
      'the text', (tester) async {
    await tester.pumpWidget(
      harness(
        const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Avatar(name: 'A', size: AvatarSize.small),
            Avatar(name: 'B'),
            Avatar(
              name: 'C',
              size: AvatarSize.large,
              shape: AvatarShape.square,
              color: Color(0xFF123456),
            ),
          ],
        ),
      ),
    );
    final avatars = find.byType(Avatar);
    expect(tester.getSize(avatars.at(0)), const Size(32, 32));
    expect(tester.getSize(avatars.at(1)), const Size(40, 40));
    expect(tester.getSize(avatars.at(2)), const Size(56, 56));
    final square = tester.widget<ColoredBox>(
      find.descendant(of: avatars.at(2), matching: find.byType(ColoredBox)),
    );
    expect(square.color, const Color(0xFF123456));
    final clip = tester.widget<ClipRRect>(
      find.descendant(of: avatars.at(2), matching: find.byType(ClipRRect)),
    );
    expect(clip.borderRadius, BorderRadius.circular(8));

    await tester.pumpWidget(
      harness(const Avatar(name: 'Ada Lovelace'), textScale: 2),
    );
    expect(tester.getSize(find.byType(Avatar)), const Size(80, 80));
    expect(tester.takeException(), isNull);
  });

  testWidgets('a group shows at most max and names the rest from the '
      'catalog; it is a named group', (tester) async {
    final semantics = tester.ensureSemantics();
    const items = [
      AvatarGroupItem(name: 'Ada Lovelace'),
      AvatarGroupItem(name: 'Grace Hopper', color: Color(0xFFE0D4F5)),
      AvatarGroupItem(name: 'Alan Turing'),
      AvatarGroupItem(name: 'Edsger Dijkstra'),
      AvatarGroupItem(name: 'Barbara Liskov'),
      AvatarGroupItem(name: 'Donald Knuth'),
    ];
    await tester.pumpWidget(
      harness(const AvatarGroup(label: 'Reviewers', items: items, max: 3)),
    );
    expect(find.byType(Avatar), findsNWidgets(3));
    expect(find.text('+3'), findsOneWidget);
    expect(find.bySemanticsLabel('3 more'), findsOneWidget);
    expect(find.bySemanticsLabel('Reviewers'), findsOneWidget);
    expect(find.bySemanticsLabel('Grace Hopper'), findsOneWidget);
    // Overlapping by 10: three avatars of 40 and the chip span 130.
    expect(tester.getSize(find.byType(AvatarGroup)), const Size(130, 40));
    await expectLater(tester, meetsGuideline(textContrastGuideline));

    // A translated plural message.
    await tester.pumpWidget(
      harness(
        const AvatarGroup(label: 'Revisori', items: items, max: 5),
        theme: InvisibleThemeData.light(
          messages: const InvisibleMessages().copyWith(avatarGroupMore: _altri),
        ),
      ),
    );
    expect(find.bySemanticsLabel('un altro'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('no chip when everyone fits; right to left the first avatar '
      'sits at the right', (tester) async {
    await tester.pumpWidget(
      harness(
        const AvatarGroup(
          label: 'Team',
          items: [
            AvatarGroupItem(name: 'Ada Lovelace'),
            AvatarGroupItem(name: 'Grace Hopper'),
          ],
        ),
        direction: TextDirection.rtl,
      ),
    );
    expect(find.textContaining('+'), findsNothing);
    expect(
      tester.getCenter(find.text('AL')).dx,
      greaterThan(tester.getCenter(find.text('GH')).dx),
    );
  });

  testWidgets('at text scale 2.0 in a narrow parent the group shrinks to '
      'fit', (tester) async {
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 120,
          child: AvatarGroup(
            label: 'Team',
            items: [
              for (final name in ['Ada L', 'Grace H', 'Alan T', 'Edsger D'])
                AvatarGroupItem(name: name),
            ],
            max: 3,
          ),
        ),
        textScale: 2,
      ),
    );
    expect(tester.takeException(), isNull);
    expect(tester.getSize(find.byType(AvatarGroup)).width, 120);
  });
}

String _altri(int count) => count == 1 ? 'un altro' : 'altri $count';
