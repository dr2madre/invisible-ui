// widgets.dart exports SemanticsRole only in releases after Flutter 3.35.
// ignore: unnecessary_import
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'package:flutter/widgets.dart';

import '../button/button.dart';
import '../i18n/messages.dart';
import '../internal/announce.dart';
import '../internal/focus_ring.dart';
import '../internal/glyphs.dart';
import '../internal/pressable.dart';
import '../loading/loading.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';
import 'upload_files.dart';

// Sizes the web UploadDropArea sets in its own stylesheet.
const double _paddingY = 32;
const double _paddingX = 24;
const double _gap = 8;
const double _border = 2;
const double _iconSize = 32;
const double _captionSize = 13;
const double _dragTint = 0.08;
const double _disabledOpacity = 0.55;
const Duration _openingDelay = Duration(milliseconds: 150);

/// Where an app reports files dragged over and dropped on an
/// [UploadDropArea]. Flutter has no file drop of its own: the app wires
/// its drop plugin to these calls, and the area shows the drag state and
/// filters the files as it does picked ones.
class UploadDropController extends ChangeNotifier {
  bool _dragging = false;
  final List<List<UploadFile>> _drops = [];

  /// Whether files are being dragged over the area.
  bool get dragging => _dragging;

  /// Files entered the area.
  void dragEntered() => _setDragging(true);

  /// The files left the area without a drop.
  void dragExited() => _setDragging(false);

  /// Files were dropped on the area.
  void drop(List<UploadFile> files) {
    _dragging = false;
    _drops.add(List.of(files));
    notifyListeners();
  }

  /// The drops not yet handled, in order; the area takes them.
  List<List<UploadFile>> takeDrops() {
    final drops = List.of(_drops);
    _drops.clear();
    return drops;
  }

  void _setDragging(bool value) {
    if (_dragging == value) return;
    _dragging = value;
    notifyListeners();
  }
}

/// A file area: the user browses for files, or drops them when the app
/// takes drops.
///
/// The area is one button. A tap, Enter or Space calls [onBrowse], where
/// the app opens the platform's picker (with `file_selector`, for example)
/// and returns the chosen files; while it waits, a spinner shows after a
/// short delay. The drop prompt and the drag highlight show only with a
/// [dropController], the app's word that it takes drops.
///
/// Picked and dropped files go through the same filter: [accept] (the
/// web's `accept` format: `.pdf`, `image/*`, `application/pdf`) and, without
/// [multiple], one file. [onFiles] receives the files that pass and
/// [onRejected] the ones left out; each rejected file is named in a visible
/// message under the area, after a hazard glyph, and announced. The final
/// check of the files (size, content) stays with the app.
///
/// [files] lists the files the app keeps, under the area; with [onRemove]
/// each has a remove button, and focus moves to the next one, or to the
/// area, after a removal. [describeFile] adds a line to each, such as the
/// size.
class UploadDropArea extends StatefulWidget {
  /// Creates the area.
  const UploadDropArea({
    super.key,
    required this.onBrowse,
    this.onFiles,
    this.onRejected,
    this.accept,
    this.multiple = false,
    this.enabled = true,
    this.dropController,
    this.caption,
    this.prompt,
    this.icon,
    this.files = const [],
    this.onRemove,
    this.describeFile,
  });

  /// Opens the platform's picker and returns the chosen files; empty when
  /// the user cancels.
  final Future<List<UploadFile>> Function() onBrowse;

  /// Called with the files that pass the filter, picked or dropped.
  final ValueChanged<List<UploadFile>>? onFiles;

  /// Called with the files left out, and why.
  final ValueChanged<List<UploadRejection>>? onRejected;

  /// The accepted types, in the web's `accept` format. Null takes any file.
  final String? accept;

  /// Whether the area takes more than one file at a time.
  final bool multiple;

  /// Whether the area takes files.
  final bool enabled;

  /// Where the app reports dragged and dropped files. Without one, the area
  /// shows no drop prompt.
  final UploadDropController? dropController;

  /// A line under the prompt, such as the accepted formats and size.
  final String? caption;

  /// Replaces the prompt text. Its text is the area's name.
  final String? prompt;

  /// Replaces the upload glyph. Decorative.
  final Widget? icon;

  /// The files the app keeps, listed under the area.
  final List<UploadFile> files;

  /// Removes a file; adds a remove button to each listed file.
  final ValueChanged<UploadFile>? onRemove;

  /// A second line for a listed file, such as its size.
  final String Function(UploadFile file)? describeFile;

  @override
  State<UploadDropArea> createState() => _UploadDropAreaState();
}

class _UploadDropAreaState extends State<UploadDropArea> {
  final FocusNode _area = FocusNode(debugLabel: 'UploadDropArea');
  final List<FocusNode> _removeNodes = [];
  bool _opening = false;
  List<UploadRejection> _rejected = const [];

  @override
  void initState() {
    super.initState();
    widget.dropController?.addListener(_onDrop);
  }

  @override
  void didUpdateWidget(UploadDropArea oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.dropController != widget.dropController) {
      oldWidget.dropController?.removeListener(_onDrop);
      widget.dropController?.addListener(_onDrop);
    }
  }

  @override
  void dispose() {
    widget.dropController?.removeListener(_onDrop);
    _area.dispose();
    for (final node in _removeNodes) {
      node.dispose();
    }
    super.dispose();
  }

  void _onDrop() {
    final drops = widget.dropController!.takeDrops();
    setState(() {});
    if (!widget.enabled) return;
    for (final files in drops) {
      _take(files);
    }
  }

  Future<void> _browse() async {
    if (_opening) return;
    setState(() => _opening = true);
    List<UploadFile> files;
    try {
      files = await widget.onBrowse();
    } finally {
      if (mounted) setState(() => _opening = false);
    }
    if (mounted && files.isNotEmpty) _take(files);
  }

  void _take(List<UploadFile> files) {
    if (files.isEmpty) return;
    final split = splitFiles(
      files,
      accept: widget.accept,
      multiple: widget.multiple,
    );
    setState(() => _rejected = split.rejected);
    if (split.rejected.isNotEmpty) {
      announce(context, _rejectionText(split.rejected).join(' '));
      widget.onRejected?.call(split.rejected);
    }
    if (split.accepted.isNotEmpty) widget.onFiles?.call(split.accepted);
  }

  List<String> _rejectionText(List<UploadRejection> rejected) {
    final messages = InvisibleTheme.of(context).messages;
    return [
      for (final r in rejected)
        InvisibleMessages.fill(
          switch (r.reason) {
            UploadRejectReason.type => messages.uploadDropAreaRejectedType,
            UploadRejectReason.count => messages.uploadDropAreaRejectedCount,
          },
          {'name': r.file.name},
        ),
    ];
  }

  FocusNode _removeNode(int index) {
    while (_removeNodes.length <= index) {
      _removeNodes.add(FocusNode(debugLabel: 'UploadDropArea remove'));
    }
    return _removeNodes[index];
  }

  void _remove(int index) {
    final file = widget.files[index];
    widget.onRemove?.call(file);
    // The removed file's button goes: the next file's button takes focus,
    // or the previous one, or the area.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final count = widget.files.length;
      if (count == 0) {
        _area.requestFocus();
      } else {
        _removeNode(index < count ? index : count - 1).requestFocus();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final messages = theme.messages;
    final drops = widget.dropController != null;
    final dragging =
        drops && widget.enabled && (widget.dropController?.dragging ?? false);
    final enabled = widget.enabled;
    final style = theme.textStyle.copyWith(color: colors.textSecondary);
    final action = style.copyWith(
      color: colors.secondaryBodyText,
      fontWeight: FontWeight.w600,
      decoration: TextDecoration.underline,
      decorationColor: colors.secondaryBodyText,
    );

    final prompt = widget.prompt;
    final String name;
    final Widget text;
    if (prompt != null) {
      name = prompt;
      text = Text(prompt, textAlign: TextAlign.center, style: style);
    } else if (drops) {
      name =
          '${messages.uploadDropAreaPrompt} ${messages.uploadDropAreaAction}';
      text = Text.rich(
        TextSpan(
          children: [
            TextSpan(text: '${messages.uploadDropAreaPrompt} '),
            TextSpan(text: messages.uploadDropAreaAction, style: action),
          ],
        ),
        textAlign: TextAlign.center,
        style: style,
      );
    } else {
      name = messages.uploadDropAreaBrowse;
      text = Text(name, textAlign: TextAlign.center, style: action);
    }

    final caption = widget.caption;
    final area = Semantics(
      container: true,
      button: true,
      enabled: enabled,
      label: name,
      hint: caption,
      onTap: enabled ? _browse : null,
      child: Pressable(
        focusNode: _area,
        onPressed: enabled ? _browse : null,
        builder: (context, states) => Opacity(
          opacity: enabled ? 1 : _disabledOpacity,
          child: FocusRingPainter(
            visible: states.focusVisible,
            ring: theme.focusRing,
            radius: InvisibleRadiusTokens.container,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(
                vertical: _paddingY,
                horizontal: _paddingX,
              ),
              decoration: BoxDecoration(
                color: dragging
                    ? Color.alphaBlend(
                        colors.secondary.withValues(alpha: _dragTint),
                        colors.background,
                      )
                    : colors.background,
                borderRadius: BorderRadius.circular(
                  InvisibleRadiusTokens.container,
                ),
              ),
              foregroundDecoration: _DashedBorder(
                color: dragging || states.focusVisible
                    ? colors.secondary
                    : colors.controlBorder,
                dashed: !states.focusVisible && !dragging,
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  ExcludeSemantics(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      spacing: _gap,
                      children: [
                        IconTheme(
                          data: IconThemeData(
                            color: colors.textSecondary,
                            size: _iconSize,
                            applyTextScaling: true,
                          ),
                          child: widget.icon ?? const Glyph(GlyphShape.upload),
                        ),
                        text,
                        if (caption != null && caption.isNotEmpty)
                          Text(
                            caption,
                            textAlign: TextAlign.center,
                            style: style.copyWith(fontSize: _captionSize),
                          ),
                      ],
                    ),
                  ),
                  if (_opening)
                    Positioned.fill(
                      child: IconTheme.merge(
                        data: IconThemeData(color: colors.secondary),
                        child: DefaultTextStyle.merge(
                          style: TextStyle(color: colors.secondary),
                          child: const Loading(
                            variant: LoadingVariant.spinner,
                            overlay: true,
                            veil: false,
                            delay: _openingDelay,
                            decorative: true,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );

    final rejected = _rejected.isEmpty ? null : _rejectionText(_rejected);
    final files = widget.files;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: _gap,
      children: [
        area,
        if (rejected != null)
          // Announced when it appears, by the area; shown here with the
          // hazard glyph so it never relies on colour alone.
          _Rejections(messages: rejected),
        if (files.isNotEmpty)
          Semantics(
            role: SemanticsRole.list,
            container: true,
            explicitChildNodes: true,
            label: messages.uploadDropAreaFiles,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 4,
              children: [
                for (final (index, file) in files.indexed)
                  Semantics(
                    role: SemanticsRole.listItem,
                    container: true,
                    explicitChildNodes: true,
                    child: _FileRow(
                      file: file,
                      description: widget.describeFile?.call(file),
                      removeLabel: widget.onRemove == null
                          ? null
                          : InvisibleMessages.fill(
                              messages.uploadDropAreaRemove,
                              {'name': file.name},
                            ),
                      removeFocusNode: _removeNode(index),
                      onRemove: widget.onRemove == null
                          ? null
                          : () => _remove(index),
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}

class _Rejections extends StatelessWidget {
  const _Rejections({required this.messages});

  final List<String> messages;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final style = theme.textStyle.copyWith(color: theme.colors.dangerBodyText);
    return IconTheme(
      data: IconThemeData(
        color: theme.colors.dangerBodyText,
        size: style.fontSize,
        applyTextScaling: true,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final message in messages)
            Text.rich(
              TextSpan(
                children: [
                  const WidgetSpan(
                    alignment: PlaceholderAlignment.middle,
                    child: ExcludeSemantics(child: HazardGlyph()),
                  ),
                  TextSpan(text: ' $message'),
                ],
              ),
              style: style,
              semanticsLabel: message,
            ),
        ],
      ),
    );
  }
}

class _FileRow extends StatelessWidget {
  const _FileRow({
    required this.file,
    required this.description,
    required this.removeLabel,
    required this.removeFocusNode,
    required this.onRemove,
  });

  final UploadFile file;
  final String? description;
  final String? removeLabel;
  final FocusNode removeFocusNode;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final description = this.description;
    return Container(
      padding: const EdgeInsetsDirectional.only(start: 12, end: 4),
      decoration: BoxDecoration(
        border: Border.all(color: colors.border),
        borderRadius: BorderRadius.circular(InvisibleRadiusTokens.control),
      ),
      child: Row(
        spacing: _gap,
        children: [
          Expanded(
            child: MergeSemantics(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      file.name,
                      style: theme.textStyle.copyWith(color: colors.text),
                    ),
                    if (description != null && description.isNotEmpty)
                      Text(
                        description,
                        style: theme.textStyle.copyWith(
                          color: colors.textSecondary,
                          fontSize: _captionSize,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
          if (onRemove != null)
            Button.icon(
              variant: ButtonVariant.ghost,
              focusNode: removeFocusNode,
              onPressed: onRemove,
              semanticLabel: removeLabel!,
              icon: const Glyph(GlyphShape.close),
            ),
        ],
      ),
    );
  }
}

/// The area's border: dashed at rest, solid while focused or dragged over.
class _DashedBorder extends Decoration {
  const _DashedBorder({required this.color, required this.dashed});

  final Color color;
  final bool dashed;

  @override
  BoxPainter createBoxPainter([VoidCallback? onChanged]) =>
      _DashedBorderPainter(color, dashed);
}

class _DashedBorderPainter extends BoxPainter {
  _DashedBorderPainter(this.color, this.dashed);

  final Color color;
  final bool dashed;

  static const double _dash = 6;
  static const double _space = 4;

  @override
  void paint(Canvas canvas, Offset offset, ImageConfiguration configuration) {
    final size = configuration.size;
    if (size == null) return;
    final rect = (offset & size).deflate(_border / 2);
    final path = Path()
      ..addRRect(
        RRect.fromRectAndRadius(
          rect,
          const Radius.circular(InvisibleRadiusTokens.container - _border / 2),
        ),
      );
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = _border;
    if (!dashed) {
      canvas.drawPath(path, paint);
      return;
    }
    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        canvas.drawPath(metric.extractPath(distance, distance + _dash), paint);
        distance += _dash + _space;
      }
    }
  }
}
