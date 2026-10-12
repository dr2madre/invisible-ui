import 'package:flutter/scheduler.dart';
import 'package:flutter/widgets.dart';

import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

/// Shows the dialog [builder] returns, usually a [Dialog], an [AlertDialog]
/// or a [ConfirmDialog], above the current screen, and completes with the
/// value it is closed with.
///
/// The dialog is modal (ADR 0005): the barrier blocks the pointer and hides
/// the screen below from assistive technology, and Tab stays inside the
/// dialog. Escape closes the innermost dialog only. A press on the barrier
/// closes it too, unless [barrierDismissible] is false. When it closes,
/// focus returns to the element that had it when the dialog opened, so a
/// dialog opened from inside another hands focus back there (ADR 0016,
/// case 3). [returnFocus] names another element, for a dialog opened by
/// something other than a button, such as a drawer opened by a shortcut
/// (ADR 0013). A [ModalObserver] in the navigator's observers counts it, so a
/// [NotificationRegion] holds its notifications while it is open (case 2).
///
/// The theme around [context] applies inside the dialog, and its
/// [InvisibleThemeData.dialogOverlay] colours the barrier.
Future<T?> showInvisibleDialog<T>({
  required BuildContext context,
  required WidgetBuilder builder,
  bool barrierDismissible = true,
  bool useRootNavigator = true,
  RouteSettings? routeSettings,
  FocusNode? returnFocus,
}) {
  final navigator = Navigator.of(context, rootNavigator: useRootNavigator);
  final theme = InvisibleTheme.of(context);
  return navigator.push<T>(
    InvisibleDialogRoute<T>(
      builder: (context) =>
          InvisibleTheme(data: theme, child: builder(context)),
      barrierDismissible: barrierDismissible,
      barrierColor: theme.dialogOverlay,
      barrierLabel: theme.messages.dialogCloseLabel,
      settings: routeSettings,
      returnFocus: returnFocus,
    ),
  );
}

/// The modal route [showInvisibleDialog] pushes, for an app that pushes it
/// itself.
///
/// It is a [PopupRoute] over a translucent barrier, with no motion, as the
/// web dialogs have none. The barrier is [barrierColor], the light theme's
/// `dialog-overlay` role unless given; [showInvisibleDialog] passes the
/// theme's.
/// It remembers the element that had focus when it
/// was created, or [returnFocus] when given, and gives focus back to it
/// after it is popped, when that element is still there; otherwise the
/// navigator's own focus history decides.
class InvisibleDialogRoute<T> extends RawDialogRoute<T> {
  /// Creates the route.
  InvisibleDialogRoute({
    required WidgetBuilder builder,
    super.barrierDismissible,
    Color? barrierColor,
    super.barrierLabel,
    super.settings,
    FocusNode? returnFocus,
  }) : _returnFocus = returnFocus ?? FocusManager.instance.primaryFocus,
       super(
         pageBuilder: (context, _, _) => builder(context),
         barrierColor: barrierColor ?? InvisibleColors.light.dialogOverlay,
         transitionDuration: Duration.zero,
         // Tab wraps inside the dialog, never out to the screen below.
         traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
       );

  final FocusNode? _returnFocus;

  @override
  Duration get reverseTransitionDuration => Duration.zero;

  @override
  bool didPop(T? result) {
    final popped = super.didPop(result);
    final target = _returnFocus;
    if (target != null) {
      // After the frame in which the navigator hands focus to the route
      // below, so this choice is the one that stays.
      SchedulerBinding.instance
        ..addPostFrameCallback((_) {
          final context = target.context;
          if (context != null && context.mounted && target.canRequestFocus) {
            target.requestFocus();
          }
        })
        ..ensureVisualUpdate();
    }
    return popped;
  }
}
