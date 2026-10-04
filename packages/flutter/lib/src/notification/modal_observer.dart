import 'package:flutter/widgets.dart';

/// Tells a [NotificationRegion] whether a modal is open (ADR 0016).
///
/// Add it to the app's navigator observers. It counts every [PopupRoute],
/// the route dialogs and modal sheets use, from the moment it is pushed
/// until it is popped or removed. An overlay that is not a route calls
/// [hold] while it is open.
///
/// ```dart
/// final modals = ModalObserver();
/// WidgetsApp(navigatorObservers: [modals], ...);
/// NotificationRegion(controller: notices, modals: modals, child: ...);
/// ```
class ModalObserver extends NavigatorObserver with ChangeNotifier {
  final Set<Route<dynamic>> _routes = {};
  int _holds = 0;

  /// Whether a modal is open.
  bool get hasModal => _routes.isNotEmpty || _holds > 0;

  /// Counts a modal that is not a route until the returned callback runs.
  VoidCallback hold() {
    _change(() => _holds++);
    var released = false;
    return () {
      if (released) return;
      released = true;
      _change(() => _holds--);
    };
  }

  void _change(VoidCallback change) {
    final before = hasModal;
    change();
    if (hasModal != before) notifyListeners();
  }

  void _add(Route<dynamic>? route) {
    if (route is PopupRoute) _change(() => _routes.add(route));
  }

  void _remove(Route<dynamic>? route) {
    if (route != null) _change(() => _routes.remove(route));
  }

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) =>
      _add(route);

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) =>
      _remove(route);

  @override
  void didRemove(Route<dynamic> route, Route<dynamic>? previousRoute) =>
      _remove(route);

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    _remove(oldRoute);
    _add(newRoute);
  }
}
