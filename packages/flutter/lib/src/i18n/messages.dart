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
  const InvisibleMessages({
    this.loadingLabel = 'Loading…',
    this.submenuHint = 'submenu',
    this.closeLabel = 'Close',
    this.notificationRegionLabel = 'Notifications',
  });

  /// Announced while a control is busy. Catalog key `loading.label`.
  final String loadingLabel;

  /// The hint of a menu item that opens a submenu. Catalog key
  /// `menu.submenu`.
  final String submenuHint;

  /// The name of a notification's close button. Catalog key
  /// `inlineNotification.close`.
  final String closeLabel;

  /// The name of the notification region. Catalog key
  /// `notificationRegion.label`.
  final String notificationRegionLabel;

  /// A copy with the given messages replaced.
  InvisibleMessages copyWith({
    String? loadingLabel,
    String? submenuHint,
    String? closeLabel,
    String? notificationRegionLabel,
  }) {
    return InvisibleMessages(
      loadingLabel: loadingLabel ?? this.loadingLabel,
      submenuHint: submenuHint ?? this.submenuHint,
      closeLabel: closeLabel ?? this.closeLabel,
      notificationRegionLabel:
          notificationRegionLabel ?? this.notificationRegionLabel,
    );
  }

  @override
  bool operator ==(Object other) =>
      other is InvisibleMessages &&
      other.loadingLabel == loadingLabel &&
      other.submenuHint == submenuHint &&
      other.closeLabel == closeLabel &&
      other.notificationRegionLabel == notificationRegionLabel;

  @override
  int get hashCode => Object.hash(
    loadingLabel,
    submenuHint,
    closeLabel,
    notificationRegionLabel,
  );
}
