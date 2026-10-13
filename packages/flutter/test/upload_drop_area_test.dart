import 'dart:async';

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

const UploadFile _pdf = UploadFile(
  name: 'report.pdf',
  size: 2048,
  type: 'application/pdf',
);
const UploadFile _png = UploadFile(
  name: 'photo.PNG',
  size: 4096,
  type: 'image/png',
);
const UploadFile _exe = UploadFile(name: 'setup.exe', size: 10);

void main() {
  group('acceptsFile', () {
    test('extensions, media types and families, without case', () {
      expect(acceptsFile(null, _exe), isTrue);
      expect(acceptsFile('  ', _exe), isTrue);
      expect(acceptsFile('.pdf', _pdf), isTrue);
      expect(acceptsFile('.png', _png), isTrue);
      expect(acceptsFile('image/*', _png), isTrue);
      expect(acceptsFile('IMAGE/PNG', _png), isTrue);
      expect(acceptsFile('image/*', _pdf), isFalse);
      expect(acceptsFile('application/pdf, .png', _png), isTrue);
      expect(acceptsFile('image/*,.pdf', _exe), isFalse);
      // A file whose type the platform did not give matches by extension.
      expect(
        acceptsFile('image/*', const UploadFile(name: 'a.png', size: 1)),
        isFalse,
      );
    });
  });

  testWidgets('without drops: one button named "Browse files", the caption '
      'as its hint; a press opens the app\'s picker and the chosen files are '
      'reported', (tester) async {
    final semantics = tester.ensureSemantics();
    final reports = <List<UploadFile>>[];
    var opened = 0;
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 400,
          child: UploadDropArea(
            caption: 'PDF, up to 5 MB',
            onBrowse: () async {
              opened++;
              return [_pdf];
            },
            onFiles: reports.add,
          ),
        ),
      ),
    );
    expect(
      tester.getSemantics(find.bySemanticsLabel('Browse files')),
      semanticsWith(
        isButton: true,
        hint: 'PDF, up to 5 MB',
        isFocusable: true,
        hasTapAction: true,
      ),
    );
    expect(find.textContaining('Drag'), findsNothing);
    await tester.tap(find.bySemanticsLabel('Browse files'));
    await tester.pump();
    expect(opened, 1);
    expect(reports.single, [_pdf]);
    semantics.dispose();
  });

  testWidgets('Enter and Space browse too', (tester) async {
    var opened = 0;
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 400,
          child: UploadDropArea(
            onBrowse: () async {
              opened++;
              return const [];
            },
          ),
        ),
      ),
    );
    await focusOn(tester, find.text('Browse files'));
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    expect(opened, 2);
  });

  testWidgets('with drops: the drop prompt; dropped files pass the same '
      'filter as picked ones; rejections show and are announced', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    final log = recordAnnouncements(tester);
    final drops = UploadDropController();
    addTearDown(drops.dispose);
    final accepted = <List<UploadFile>>[];
    final rejected = <List<UploadRejection>>[];
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 400,
          child: UploadDropArea(
            accept: 'image/*,.pdf',
            dropController: drops,
            onBrowse: () async => [_exe, _pdf],
            onFiles: accepted.add,
            onRejected: rejected.add,
          ),
        ),
      ),
    );
    expect(
      find.bySemanticsLabel('Drag & drop files or browse'),
      findsOneWidget,
    );
    drops.dragEntered();
    await tester.pump();
    expect(drops.dragging, isTrue);
    drops.drop([_png, _pdf]);
    await tester.pump();
    // Without `multiple`, the first file that passes is taken.
    expect(accepted.single, [_png]);
    expect(rejected.single.single.reason, UploadRejectReason.count);
    expect(
      find.textContaining('report.pdf was not added', findRichText: true),
      findsOneWidget,
    );
    expect(
      find.bySemanticsLabel(
        'report.pdf was not added: only one file is accepted.',
      ),
      findsOneWidget,
    );
    expect(
      log.single.message,
      'report.pdf was not added: only one file is accepted.',
    );

    await tester.tap(find.bySemanticsLabel('Drag & drop files or browse'));
    await tester.pump();
    expect(accepted.last, [_pdf]);
    expect(rejected.last.single.file, _exe);
    expect(rejected.last.single.reason, UploadRejectReason.type);
    expect(
      find.bySemanticsLabel('setup.exe is not an accepted file type.'),
      findsOneWidget,
    );
    expect(log.last.message, 'setup.exe is not an accepted file type.');
    semantics.dispose();
  });

  testWidgets('multiple takes every file that passes', (tester) async {
    final accepted = <List<UploadFile>>[];
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 400,
          child: UploadDropArea(
            multiple: true,
            accept: '.pdf,.png',
            onBrowse: () async => [_pdf, _png, _exe],
            onFiles: accepted.add,
          ),
        ),
      ),
    );
    await tester.tap(find.text('Browse files'));
    await tester.pump();
    expect(accepted.single, [_pdf, _png]);
  });

  testWidgets('disabled: no browsing, drops ignored', (tester) async {
    final semantics = tester.ensureSemantics();
    final drops = UploadDropController();
    addTearDown(drops.dispose);
    var opened = 0;
    final accepted = <List<UploadFile>>[];
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 400,
          child: UploadDropArea(
            enabled: false,
            dropController: drops,
            onBrowse: () async {
              opened++;
              return [_pdf];
            },
            onFiles: accepted.add,
          ),
        ),
      ),
    );
    expect(
      tester.getSemantics(find.bySemanticsLabel('Drag & drop files or browse')),
      semanticsWith(hasEnabledState: true, isEnabled: false),
    );
    await tester.tap(find.byType(UploadDropArea), warnIfMissed: false);
    drops.drop([_pdf]);
    await tester.pump();
    expect(opened, 0);
    expect(accepted, isEmpty);
    semantics.dispose();
  });

  testWidgets('while the picker opens, a spinner shows after a short delay', (
    tester,
  ) async {
    final picker = Completer<List<UploadFile>>();
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 400,
          child: UploadDropArea(onBrowse: () => picker.future),
        ),
      ),
    );
    await tester.tap(find.text('Browse files'));
    await tester.pump();
    expect(find.byType(Loading), findsOneWidget);
    picker.complete(const []);
    await tester.pump();
    await tester.pump();
    expect(find.byType(Loading), findsNothing);
  });

  testWidgets('the file list: a named list; a remove button per file; focus '
      'moves to the next file, then to the area', (tester) async {
    final semantics = tester.ensureSemantics();
    var files = [_pdf, _png];
    await tester.pumpWidget(
      harness(
        StatefulBuilder(
          builder: (context, setState) => SizedBox(
            width: 400,
            child: UploadDropArea(
              onBrowse: () async => const [],
              files: files,
              describeFile: (file) => '${file.size} bytes',
              onRemove: (file) => setState(
                () => files = [
                  for (final f in files)
                    if (f != file) f,
                ],
              ),
            ),
          ),
        ),
      ),
    );
    expect(find.bySemanticsLabel('Selected files'), findsOneWidget);
    expect(find.text('2048 bytes'), findsOneWidget);
    final removePdf = find.bySemanticsLabel('Remove report.pdf');
    await focusOn(
      tester,
      find.descendant(of: removePdf, matching: find.byType(CustomPaint)).first,
    );
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    await tester.pump();
    expect(files, [_png]);
    final removePng = find.bySemanticsLabel('Remove photo.PNG');
    expect(
      focusedOn(
        tester,
        find
            .descendant(of: removePng, matching: find.byType(CustomPaint))
            .first,
      ),
      isTrue,
    );
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    await tester.pump();
    expect(files, isEmpty);
    expect(find.bySemanticsLabel('Selected files'), findsNothing);
    expect(FocusManager.instance.primaryFocus?.debugLabel, 'UploadDropArea');
    semantics.dispose();
  });

  testWidgets('narrow at text scale 2.0, right to left: nothing overflows; '
      'targets 24 by 24 and 44 by 44 under touch; text contrast', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    Widget build({InvisibleThemeData? theme, double scale = 1}) => harness(
      SizedBox(
        width: 320,
        child: UploadDropArea(
          caption: 'Images up to 5 MB',
          dropController: UploadDropController(),
          onBrowse: () async => const [],
          files: const [_pdf],
          onRemove: (_) {},
        ),
      ),
      textScale: scale,
      direction: TextDirection.rtl,
      theme: theme,
    );
    await tester.pumpWidget(build());
    await expectLater(tester, meetsGuideline(targetGuideline24));
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    await tester.pumpWidget(
      build(
        scale: 2,
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    expect(tester.takeException(), isNull);
    await expectLater(tester, meetsGuideline(targetGuideline44));
    semantics.dispose();
  });
}
