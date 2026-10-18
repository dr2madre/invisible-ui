import 'dart:async';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'golden_harness.dart';

/// Loads the font of the golden tests before any of them runs.
///
/// Without a loaded font, text in a widget test renders in the test font,
/// whose glyphs are boxes. Roboto ships with the Flutter SDK, so the version
/// CI pins also pins the font, and no font file is committed here.
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
  await testMain();
}
