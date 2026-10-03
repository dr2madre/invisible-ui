import 'package:flutter/foundation.dart';

/// The text the components show or announce.
///
/// The defaults are the English catalog of `core/src/i18n/messages.ts`; each
/// field names its catalog key. Pass translated text through
/// [InvisibleThemeData.messages]. Only the keys a shipped widget uses are
/// here.
@immutable
class InvisibleMessages {
  /// Creates a message set, English unless a field is given.
  const InvisibleMessages({this.loadingLabel = 'Loading…'});

  /// Announced while a control is busy. Catalog key `loading.label`.
  final String loadingLabel;

  /// A copy with the given messages replaced.
  InvisibleMessages copyWith({String? loadingLabel}) {
    return InvisibleMessages(loadingLabel: loadingLabel ?? this.loadingLabel);
  }

  @override
  bool operator ==(Object other) =>
      other is InvisibleMessages && other.loadingLabel == loadingLabel;

  @override
  int get hashCode => loadingLabel.hashCode;
}
