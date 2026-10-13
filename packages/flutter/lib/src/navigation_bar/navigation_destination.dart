import 'package:flutter/widgets.dart';

/// A notification on a [NavigationDestination]'s section.
///
/// [label] is the text assistive technology reads with the destination, and
/// the text announced when it appears or changes. [content] is the short
/// count shown on the icon ("3", "99+"); without it the badge is a dot.
///
/// ```dart
/// import 'package:invisible_ui/invisible_ui.dart' as iu;
///
/// const attention = iu.NavigationBadge(label: 'Needs attention');
/// const unread = iu.NavigationBadge(label: '3 unread', content: '3');
/// ```
@immutable
class NavigationBadge {
  /// Creates a badge read as [label].
  const NavigationBadge({
    required this.label,
    this.content,
    this.announce = true,
  });

  /// The accessible text: "3 unread", "Needs attention".
  final String label;

  /// The visible content, a short count. Null shows a dot.
  final String? content;

  /// Whether a change of [label] is announced politely. Turn it off for a
  /// count that changes often.
  final bool announce;
}

/// One destination of a `NavigationBar`: a section of the app with an icon
/// and a visible label.
///
/// [value] identifies it and is unique in the bar. [uri], when given, is the
/// destination's address: it is announced as a link where the platform reads
/// the destinations as a list, and Space no longer presses it, since native
/// links take Enter only. With [unavailableReason] the destination stays
/// visible and focusable, the reason is read with it and shown on hover,
/// keyboard focus and long press, and pressing it does nothing.
@immutable
class NavigationDestination<T> {
  /// Creates a destination named [label].
  const NavigationDestination({
    required this.value,
    required this.label,
    required this.icon,
    this.uri,
    this.badge,
    this.unavailableReason,
  });

  /// Identifies the destination; the bar's `value` names the current one.
  final T value;

  /// The visible label and accessible name.
  final String label;

  /// The decorative icon, hidden from assistive technology.
  final Widget icon;

  /// The destination's address, announced with it.
  final Uri? uri;

  /// A notification on the section.
  final NavigationBadge? badge;

  /// Why the section cannot open now. Non-null makes the destination
  /// unavailable.
  final String? unavailableReason;

  /// Whether the destination cannot open now.
  bool get unavailable => unavailableReason != null;
}

/// How a `NavigationBar` presents itself to assistive technology.
///
/// Each platform reads primary navigation its own way, so the bar picks the
/// profile from the platform; an app that knows better passes one.
enum NavigationBarSemanticsProfile {
  /// A tab bar, as iOS and Android read one: each destination is a tab with
  /// its selected state and its position ("Tab 4 of 5"). The default on
  /// iOS, Android and Fuchsia.
  tabBar,

  /// A navigation holding a list: each destination is a link or a button,
  /// and the current one is read as the current page. The default on macOS,
  /// Windows and Linux.
  navigationList,
}
