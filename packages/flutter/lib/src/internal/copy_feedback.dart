import 'dart:async';

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import 'announce.dart';

/// How long a "Copied" confirmation stays, as on the web.
const Duration copiedDuration = Duration(seconds: 2);

/// The clipboard write and the two-second confirmation that Button (`copy`)
/// and CodeBlock share (ADR 0016, case 1).
class CopyFeedback extends ChangeNotifier {
  Timer? _timer;
  bool _disposed = false;

  /// Whether the confirmation shows.
  bool get copied => _timer?.isActive ?? false;

  /// Writes [text] to the clipboard; when that works, shows the confirmation
  /// for [copiedDuration] and announces [announcement] politely in the
  /// window of [context]. When the clipboard refuses, nothing is shown or
  /// announced.
  Future<void> copy(
    BuildContext context,
    String text, {
    required String announcement,
  }) async {
    try {
      await Clipboard.setData(ClipboardData(text: text));
    } on PlatformException {
      return;
    }
    // A copy can finish after the control is gone.
    if (_disposed || !context.mounted) return;
    _timer?.cancel();
    _timer = Timer(copiedDuration, notifyListeners);
    notifyListeners();
    announce(context, announcement);
  }

  @override
  void dispose() {
    _disposed = true;
    _timer?.cancel();
    super.dispose();
  }
}
