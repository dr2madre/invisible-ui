import 'dart:async';

import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

/// What a notification announces: its title and its text, in one sentence
/// each.
String noticeMessage(String title, String? text) =>
    [title, ?text].where((s) => s.isNotEmpty).join('. ');

/// Announces [message] to assistive technology in the window of [context],
/// politely or, when [assertive], interrupting.
///
/// It sends the message `SemanticsService.sendAnnouncement` sends.
/// `sendAnnouncement` arrived in Flutter 3.35, after the package's lower
/// bound, and the older `announce` cannot name the window; the message itself
/// is the same on both, and an engine without multiple windows ignores the
/// view id.
void announce(BuildContext context, String message, {bool assertive = false}) {
  if (message.isEmpty) return;
  unawaited(
    SystemChannels.accessibility.send(<String, dynamic>{
      'type': 'announce',
      'data': <String, dynamic>{
        'viewId': View.of(context).viewId,
        'message': message,
        'textDirection': Directionality.of(context).index,
        if (assertive) 'assertiveness': Assertiveness.assertive.index,
      },
    }),
  );
}
