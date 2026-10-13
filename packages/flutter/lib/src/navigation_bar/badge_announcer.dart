import 'package:flutter/widgets.dart';

import '../i18n/messages.dart';
import '../internal/announce.dart';
import '../notification/modal_observer.dart';
import 'navigation_bar_logic.dart';
import 'navigation_destination.dart';

/// The badge announcements of one navigation, a `NavigationBar` or a
/// `Sidebar`, ported from the web adapters' live region: a badge whose label
/// appears or changes is announced once, politely, never on the first build,
/// and while [modals] reports a modal the latest one per destination waits
/// for it to close (ADR 0016).
///
/// A modal does not hold back the navigation it shows: a sidebar in its
/// drawer, the current [route], announces. Package-internal; the owning
/// state sets [modals] and [route] and calls [changed] and [dispose].
class BadgeAnnouncer<T> {
  /// Announces on behalf of [_owner], while it is mounted.
  BadgeAnnouncer(this._owner);

  final State _owner;
  ModalObserver? _modals;
  List<BadgeAnnouncement<T>> _held = const [];

  /// The route the navigation shows in.
  Route<dynamic>? route;

  /// The observer that says whether a modal is open.
  set modals(ModalObserver? value) {
    if (identical(value, _modals)) return;
    _modals?.removeListener(_release);
    _modals = value;
    value?.addListener(_release);
    _release();
  }

  bool get _blocked {
    if (!(_modals?.hasModal ?? false)) return false;
    final route = this.route;
    return !(route is PopupRoute && route.isCurrent);
  }

  /// Announces the badges that appeared or changed between [previous] and
  /// [next], after the frame, so the navigation on screen already shows them.
  void changed(
    List<NavigationTarget<T>> previous,
    List<NavigationTarget<T>> next,
    InvisibleMessages messages,
  ) {
    final incoming = badgeAnnouncements(previous, next, messages: messages);
    if (incoming.isEmpty) return;
    WidgetsBinding.instance.addPostFrameCallback((_) => _announce(incoming));
  }

  void _announce(List<BadgeAnnouncement<T>> incoming) {
    if (!_owner.mounted) return;
    if (_blocked) {
      _held = holdAnnouncements(_held, incoming);
      return;
    }
    for (final entry in incoming) {
      announce(_owner.context, entry.text);
    }
  }

  void _release() {
    if (_blocked || _held.isEmpty) return;
    final held = _held;
    _held = const [];
    _announce(held);
  }

  /// Stops following the observer.
  void dispose() => _modals?.removeListener(_release);
}
