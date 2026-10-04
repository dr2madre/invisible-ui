import 'package:flutter/foundation.dart';

import 'inline_notification.dart';

/// Why a notification closed.
enum NotificationDismissReason {
  /// The close button or a swipe.
  user,

  /// The auto-dismiss countdown ran out.
  timeout,

  /// An action that closes the notification ran.
  action,

  /// [NotificationController.dismiss] or [NotificationController.clear].
  api,
}

/// One notification in a [NotificationController]'s list.
@immutable
class Notice {
  /// Creates a notification.
  const Notice({
    required this.id,
    this.status = NotificationStatus.info,
    this.title = '',
    this.text,
    this.duration = Duration.zero,
    this.closable = true,
    this.assertive = false,
    this.actions = const [],
    this.inverted = false,
  });

  /// The identity; showing a notification with a live id replaces it.
  final String id;

  /// The kind of feedback.
  final NotificationStatus status;

  /// The heading.
  final String title;

  /// The body text.
  final String? text;

  /// How long it stays once shown. Zero keeps it until it is dismissed.
  final Duration duration;

  /// Whether it has a close button.
  final bool closable;

  /// Whether it interrupts assistive technology when announced, for urgent
  /// messages. It is announced politely otherwise.
  final bool assertive;

  /// Buttons under the body.
  final List<NotificationAction> actions;

  /// A high-contrast surface, the opposite of the page.
  final bool inverted;

  /// A copy with the given fields replaced.
  Notice copyWith({
    NotificationStatus? status,
    String? title,
    String? text,
    Duration? duration,
    bool? closable,
    bool? assertive,
    List<NotificationAction>? actions,
    bool? inverted,
  }) => Notice(
    id: id,
    status: status ?? this.status,
    title: title ?? this.title,
    text: text ?? this.text,
    duration: duration ?? this.duration,
    closable: closable ?? this.closable,
    assertive: assertive ?? this.assertive,
    actions: actions ?? this.actions,
    inverted: inverted ?? this.inverted,
  );
}

/// The list of notifications a [NotificationRegion] shows, apart from how
/// they are shown.
///
/// Auto-dismiss is opt-in: a notification with no [Notice.duration] stays
/// until it is dismissed. The region owns the timing.
class NotificationController extends ChangeNotifier {
  // Ids count per controller, so two controllers never share a sequence.
  int _counter = 0;
  final List<Notice> _notices = [];
  final Map<String, ValueChanged<NotificationDismissReason>> _onDismiss = {};

  /// The notifications, oldest first.
  List<Notice> get notices => List.unmodifiable(_notices);

  /// Shows a notification and returns its id. An [id] that is already shown
  /// replaces that notification in place, without calling its [onDismiss].
  /// [onDismiss] runs once when it closes, with the reason.
  String show({
    String? id,
    NotificationStatus status = NotificationStatus.info,
    String title = '',
    String? text,
    Duration duration = Duration.zero,
    bool closable = true,
    bool assertive = false,
    List<NotificationAction> actions = const [],
    bool inverted = false,
    ValueChanged<NotificationDismissReason>? onDismiss,
  }) {
    final key = id ?? 'notice-${++_counter}';
    final notice = Notice(
      id: key,
      status: status,
      title: title,
      text: text,
      duration: duration,
      closable: closable,
      assertive: assertive,
      actions: actions,
      inverted: inverted,
    );
    if (onDismiss != null) _onDismiss[key] = onDismiss;
    final at = _notices.indexWhere((n) => n.id == key);
    if (at == -1) {
      _notices.add(notice);
    } else {
      _notices[at] = notice;
    }
    notifyListeners();
    return key;
  }

  /// Shows an info notification titled [title].
  String info(
    String title, {
    String? text,
    Duration duration = Duration.zero,
    List<NotificationAction> actions = const [],
    ValueChanged<NotificationDismissReason>? onDismiss,
  }) => show(
    status: NotificationStatus.info,
    title: title,
    text: text,
    duration: duration,
    actions: actions,
    onDismiss: onDismiss,
  );

  /// Shows a success notification titled [title].
  String success(
    String title, {
    String? text,
    Duration duration = Duration.zero,
    List<NotificationAction> actions = const [],
    ValueChanged<NotificationDismissReason>? onDismiss,
  }) => show(
    status: NotificationStatus.success,
    title: title,
    text: text,
    duration: duration,
    actions: actions,
    onDismiss: onDismiss,
  );

  /// Shows a warning notification titled [title].
  String warning(
    String title, {
    String? text,
    Duration duration = Duration.zero,
    List<NotificationAction> actions = const [],
    ValueChanged<NotificationDismissReason>? onDismiss,
  }) => show(
    status: NotificationStatus.warning,
    title: title,
    text: text,
    duration: duration,
    actions: actions,
    onDismiss: onDismiss,
  );

  /// Shows a danger notification titled [title].
  String danger(
    String title, {
    String? text,
    Duration duration = Duration.zero,
    List<NotificationAction> actions = const [],
    ValueChanged<NotificationDismissReason>? onDismiss,
  }) => show(
    status: NotificationStatus.danger,
    title: title,
    text: text,
    duration: duration,
    actions: actions,
    onDismiss: onDismiss,
  );

  /// Shows a neutral notification titled [title].
  String neutral(
    String title, {
    String? text,
    Duration duration = Duration.zero,
    List<NotificationAction> actions = const [],
    ValueChanged<NotificationDismissReason>? onDismiss,
  }) => show(
    status: NotificationStatus.neutral,
    title: title,
    text: text,
    duration: duration,
    actions: actions,
    onDismiss: onDismiss,
  );

  /// Changes the notification [id] in place.
  void update(
    String id, {
    NotificationStatus? status,
    String? title,
    String? text,
    Duration? duration,
    bool? closable,
    bool? assertive,
    List<NotificationAction>? actions,
    bool? inverted,
  }) {
    final at = _notices.indexWhere((n) => n.id == id);
    if (at == -1) return;
    _notices[at] = _notices[at].copyWith(
      status: status,
      title: title,
      text: text,
      duration: duration,
      closable: closable,
      assertive: assertive,
      actions: actions,
      inverted: inverted,
    );
    notifyListeners();
  }

  /// Removes the notification [id], then calls its `onDismiss` with
  /// [reason].
  void dismiss(
    String id, [
    NotificationDismissReason reason = NotificationDismissReason.api,
  ]) {
    final at = _notices.indexWhere((n) => n.id == id);
    if (at == -1) return;
    _notices.removeAt(at);
    notifyListeners();
    _onDismiss.remove(id)?.call(reason);
  }

  /// Removes every notification, then calls each `onDismiss`.
  void clear() {
    final cleared = List.of(_notices);
    if (cleared.isEmpty) return;
    _notices.clear();
    notifyListeners();
    for (final notice in cleared) {
      // Forgotten before the call: a handler that shows a replacement under
      // the same id registers a new one.
      _onDismiss.remove(notice.id)?.call(NotificationDismissReason.api);
    }
  }

  /// Shows [loading] while [future] runs, then turns it into a success or a
  /// danger notification with the text [success] or [error] gives. The
  /// result notification stays for [duration]; zero keeps it.
  Future<T> promise<T>(
    Future<T> future, {
    required String loading,
    required String Function(T value) success,
    required String Function(Object error) error,
    Duration duration = Duration.zero,
  }) async {
    final id = show(title: loading, closable: false);
    try {
      final value = await future;
      update(
        id,
        status: NotificationStatus.success,
        title: success(value),
        duration: duration,
        closable: true,
      );
      return value;
    } catch (e) {
      update(
        id,
        status: NotificationStatus.danger,
        title: error(e),
        duration: duration,
        closable: true,
        assertive: true,
      );
      rethrow;
    }
  }
}
