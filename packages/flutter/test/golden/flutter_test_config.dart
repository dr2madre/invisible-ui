import 'dart:async';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'golden_harness.dart';

/// Loads the fonts of the golden tests before any of them runs.
///
/// Without a loaded font, text in a widget test renders in the test font,
/// whose glyphs are boxes. Roboto ships with the Flutter SDK, so the version
/// CI pins also pins the font. Code uses the theme's own monospace stack,
/// which ends in `monospace`: that family is the system's default monospace
/// font, as `fc-match` reports it on the Linux machine that runs the goldens.
/// No font file is committed here.
Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  TestWidgetsFlutterBinding.ensureInitialized();
  final root = Platform.environment['FLUTTER_ROOT'];
  if (root == null) {
    throw StateError(
      'FLUTTER_ROOT is not set: run the tests with flutter test.',
    );
  }
  final fonts = '$root/bin/cache/artifacts/material_fonts';
  final loader = FontLoader(goldenFontFamily);
  for (final face in const ['Regular', 'Italic', 'Medium', 'Bold']) {
    final bytes = File('$fonts/Roboto-$face.ttf').readAsBytes();
    loader.addFont(bytes.then((list) => ByteData.sublistView(list)));
  }
  await loader.load();
  final mono = await Process.run('fc-match', ['-f', '%{file}', 'monospace']);
  final monoFile = '${mono.stdout}'.trim();
  if (mono.exitCode != 0 || monoFile.isEmpty) {
    throw StateError('fc-match found no system monospace font.');
  }
  await (FontLoader(
    'monospace',
  )..addFont(File(monoFile).readAsBytes().then(ByteData.sublistView))).load();
  await testMain();
}
