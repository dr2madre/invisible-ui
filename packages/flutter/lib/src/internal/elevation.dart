import 'package:flutter/foundation.dart' show Brightness;
import 'package:flutter/painting.dart';

/// The shadow of a floating surface (tooltip, menu, notification): the web
/// stylesheet's `--ds-elevation-overlay`, darker in the dark theme. The role
/// lives in `tokens.css` only, so the Flutter values copy its numbers.
List<BoxShadow> overlayShadow(Brightness brightness) {
  final alpha = brightness == Brightness.dark ? 0x80 : 0x1A;
  final color = Color.fromARGB(alpha, 0, 0, 0);
  return [
    BoxShadow(
      color: color,
      offset: const Offset(0, 10),
      blurRadius: 15,
      spreadRadius: -3,
    ),
    BoxShadow(
      color: color,
      offset: const Offset(0, 4),
      blurRadius: 6,
      spreadRadius: -4,
    ),
  ];
}
