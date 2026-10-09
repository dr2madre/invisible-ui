import 'dart:async';

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../i18n/messages.dart';
import '../internal/announce.dart';
import '../internal/focus_ring.dart';
import '../internal/open_width.dart';
import '../internal/pressable.dart';
import '../scroll_area/scroll_area.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

// Sizes the web CodeBlock sets in its own stylesheet.
const double _headerSize = 12;
const double _codeSize = 14;
const double _codeLineHeight = 1.6;
const double _padding = 16;
const double _headerGap = 12;
// The width in a parent that leaves it open, such as a Row; the web block
// takes its container's width.
const double _openWidth = 480;
const EdgeInsetsDirectional _headerPadding = EdgeInsetsDirectional.fromSTEB(
  16,
  6.4,
  12,
  6.4,
);

/// How long the "Copied" confirmation stays, as on the web.
const Duration copiedDuration = Duration(seconds: 2);

/// A multi-line, monospaced sample of code, with an optional caption and a
/// copy button.
///
/// [code] keeps its white space, scrolls sideways when it is wide, and is
/// always shown as text: nothing in it is read as markup. There is no
/// syntax highlighting; pass highlighted text as [child], and [code] still
/// drives the copy button.
///
/// The block is a group named "Code" (or "Code: [language]"); the scroller
/// takes focus so a keyboard user can scroll a wide sample. The copy button
/// writes [code] to the clipboard, shows "Copied" for two seconds and
/// announces "Copied to clipboard" politely. When the clipboard refuses,
/// nothing is shown or announced.
class CodeBlock extends StatefulWidget {
  /// Shows [code].
  const CodeBlock({
    super.key,
    required this.code,
    this.language,
    this.copyable = true,
    this.copyLabel,
    this.child,
  });

  /// The source: what the copy button copies, and what shows without
  /// [child].
  final String code;

  /// A caption in the header, such as a language or a file name.
  final String? language;

  /// Whether the copy button shows.
  final bool copyable;

  /// The accessible name of the copy button, in place of
  /// [InvisibleMessages.codeBlockCopy].
  final String? copyLabel;

  /// Already highlighted code, shown in place of [code].
  final Widget? child;

  @override
  State<CodeBlock> createState() => _CodeBlockState();
}

class _CodeBlockState extends State<CodeBlock> {
  bool _copied = false;
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _copy() async {
    try {
      await Clipboard.setData(ClipboardData(text: widget.code));
    } on PlatformException {
      // Nothing was copied, so nothing is confirmed.
      return;
    }
    // A copy can finish after the block is gone.
    if (!mounted) return;
    _timer?.cancel();
    setState(() => _copied = true);
    announce(context, InvisibleTheme.of(context).messages.codeBlockCopied);
    _timer = Timer(copiedDuration, () {
      if (mounted) setState(() => _copied = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final messages = theme.messages;
    final language = widget.language;
    final hasLanguage = language != null && language.isNotEmpty;
    final named = {'language': language ?? ''};
    final border = BorderSide(color: colors.border);

    final header = hasLanguage || widget.copyable
        ? Container(
            padding: _headerPadding,
            decoration: BoxDecoration(border: Border(bottom: border)),
            child: DefaultTextStyle(
              style: theme.textStyle.copyWith(
                fontSize: _headerSize,
                color: colors.text,
              ),
              child: Row(
                spacing: _headerGap,
                children: [
                  if (hasLanguage)
                    Expanded(
                      child: Opacity(
                        opacity: 0.85,
                        child: Text(
                          language.toLowerCase(),
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.24,
                          ),
                        ),
                      ),
                    )
                  else
                    const Spacer(),
                  if (widget.copyable)
                    _CopyButton(
                      onPressed: _copy,
                      label: widget.copyLabel ?? messages.codeBlockCopy,
                      text: _copied
                          ? messages.codeBlockCopiedText
                          : messages.codeBlockCopyText,
                    ),
                ],
              ),
            ),
          )
        : null;

    final sample = Scroller(
      vertical: false,
      horizontal: true,
      ringInside: true,
      padding: const EdgeInsets.all(_padding),
      semanticLabel: hasLanguage
          ? InvisibleMessages.fill(messages.codeBlockSampleLanguage, named)
          : messages.codeBlockSample,
      child: DefaultTextStyle(
        style: theme.monoTextStyle.copyWith(
          fontSize: _codeSize,
          height: _codeLineHeight,
          color: colors.text,
        ),
        softWrap: false,
        child: widget.child ?? Text(widget.code, softWrap: false),
      ),
    );

    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: hasLanguage
          ? InvisibleMessages.fill(messages.codeBlockLabelLanguage, named)
          : messages.codeBlockLabel,
      child: OpenWidth(
        width: _openWidth,
        child: Container(
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: colors.surface,
            border: Border.fromBorderSide(border),
            borderRadius: BorderRadius.circular(InvisibleRadiusTokens.surface),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [?header, sample],
          ),
        ),
      ),
    );
  }
}

/// The small copy button in a code block's header.
class _CopyButton extends StatelessWidget {
  const _CopyButton({
    required this.onPressed,
    required this.label,
    required this.text,
  });

  final VoidCallback onPressed;
  final String label;
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final ink = theme.colors.text;
    return Semantics(
      container: true,
      button: true,
      label: label,
      onTap: onPressed,
      child: Pressable(
        onPressed: onPressed,
        builder: (context, states) => FocusRingPainter(
          visible: states.focusVisible,
          ring: theme.focusRing,
          radius: theme.controlRadius,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8.8, vertical: 3.2),
            decoration: BoxDecoration(
              // The web's black at 5 % and 10 %, from the text colour, so it
              // reads in dark mode too.
              color: ink.withValues(alpha: states.hovered ? 0.1 : 0.05),
              borderRadius: BorderRadius.circular(theme.controlRadius),
            ),
            child: ExcludeSemantics(child: Text(text)),
          ),
        ),
      ),
    );
  }
}
