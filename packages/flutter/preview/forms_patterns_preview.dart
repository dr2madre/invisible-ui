// Widget previews for review: run `flutter widget-preview start` in
// packages/flutter. Preview groups arrived after Flutter 3.35, the package's
// lower bound, so this file sits outside lib/ and test/.
import 'package:flutter/widget_previews.dart';
// widgets.dart exports Brightness only from Flutter 3.44 on.
// ignore: unnecessary_import
import 'package:flutter/foundation.dart' show Brightness;
import 'package:flutter/widgets.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'preview_sheet.dart';

/// The sign-in form with providers and the forgotten password link, and the
/// upload area that takes drops, with a rejection and a file list.
@Preview(
  group: 'Form patterns',
  name: 'Light',
  brightness: Brightness.light,
  size: Size(480, 1100),
)
@Preview(
  group: 'Form patterns',
  name: 'Dark',
  brightness: Brightness.dark,
  size: Size(480, 1100),
)
Widget formPatternStates() => const PreviewSheet(child: _FormPatterns());

/// Right to left at text scale 2.0 in a narrow column, in Arabic through
/// the locale provider: the card and the area grow, nothing is cut.
@Preview(
  group: 'Form patterns',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 2000),
)
Widget formPatternRightToLeft() => const LocaleProvider(
  locale: Locale('ar'),
  child: PreviewSheet(child: _FormPatterns()),
);

/// Touch density: every field, button and remove button keeps a 44 by 44
/// target.
@Preview(group: 'Form patterns', name: 'Touch density', size: Size(480, 1200))
Widget formPatternTouch() =>
    const PreviewSheet(density: InvisibleDensity.touch, child: _FormPatterns());

Future<List<UploadFile>> _browse() async => const [
  UploadFile(name: 'notes.txt', size: 512, type: 'text/plain'),
];

class _FormPatterns extends StatefulWidget {
  const _FormPatterns();

  @override
  State<_FormPatterns> createState() => _FormPatternsState();
}

class _FormPatternsState extends State<_FormPatterns> {
  final UploadDropController _drops = UploadDropController();
  List<UploadFile> _files = const [
    UploadFile(name: 'cover.png', size: 48213, type: 'image/png'),
  ];

  @override
  void dispose() {
    _drops.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 24,
        children: [
          Center(
            child: LoginForm(
              providers: const [LoginProvider(id: 'google', label: 'Google')],
              onProvider: (_) {},
              onForgotPassword: () {},
              onSubmitted: (_) {},
            ),
          ),
          UploadDropArea(
            accept: 'image/*',
            multiple: true,
            caption: 'PNG or JPEG, up to 5 MB',
            dropController: _drops,
            onBrowse: _browse,
            files: _files,
            describeFile: (file) => '${(file.size / 1024).round()} KB',
            onFiles: (files) => setState(() => _files = [..._files, ...files]),
            onRemove: (file) => setState(
              () => _files = [
                for (final f in _files)
                  if (f != file) f,
              ],
            ),
          ),
        ],
      ),
    );
  }
}
