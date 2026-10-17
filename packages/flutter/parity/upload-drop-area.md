# UploadDropArea parity checklist

Reference commit: `31edd44ea7637357a2eac288bcc050e07f52852f`

Reference paths: `packages/svelte/src/lib/upload-drop-area` `packages/svelte/src/lib/drop-area`

The Flutter `UploadDropArea` checked against the Svelte `UploadDropArea`
(`packages/svelte/src/lib/upload-drop-area/UploadDropArea.svelte`) and the
shared `dropArea` action.
Docs page: [Upload Drop Area](https://dr2madre.github.io/invisible-ui/components/forms/upload-drop-area/).

Flutter has no file input and no file drop in the widgets layer. The
approved design keeps the package free of dependencies: the widget draws
the area, its states, its texts and the file list; the app opens the
platform picker and hands back the files.

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/upload_drop_area_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `onBrowse: Future<List<UploadFile>> Function()` | the native file input | the app opens the picker and returns the files |
| `onFiles: ValueChanged<List<UploadFile>>` | `onFiles(files)` | the files taken |
| `onRejected: ValueChanged<List<UploadRejection>>` | `onRejected(rejected)` | the files left out, and why |
| `accept`, `multiple`, `enabled` | `accept`, `multiple`, `disabled` | the same meaning |
| `dropController: UploadDropController` | the `dropArea` action | the app's drop events; its presence says the app takes drops |
| `caption`, `prompt`, `icon` | `caption`, `children`, `icon` | texts and glyph |
| `files`, `onRemove`, `describeFile` | none | the app's file list |
| `UploadFile(name:, size:, type:, data:)` | `File` | a file |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A press, Enter or Space opens the picker | adapted | calls `onBrowse`; the app opens the picker (for example with `file_selector`): `without drops: …`, `Enter and Space browse too` |
| A spinner while the picker opens, after a short delay | matched | `while the picker opens, a spinner shows after a short delay` |
| Drag highlight and drop | adapted | shown only with a `dropController`; the app wires its drop plugin to `dragEntered`, `dragExited` and `drop`: `with drops: …` |
| Picked and dropped files filtered by `accept` | matched | the same filter for both, in the web's `accept` format, as the core's `acceptsFile`: same test, the `acceptsFile` group and the shared vectors `accepts` in `core/src/upload-drop-area/__vectors__`, read by `test/upload_vectors_test.dart` |
| One file without `multiple` | matched | the first file that passes is taken and the others are reported as rejected, as the core's `splitFiles`: same test, `multiple takes every file that passes`, vectors `split` |
| Rejected files reported, shown and announced | matched | a message per file under the area, after the hazard glyph, and announced; the web reports them to `onRejected` (the `reject` event in Elements) and shows them in an alert: same test |
| Disabled: no browsing, drops ignored | matched | `disabled: no browsing, drops ignored` |
| The final check of the files | matched | stays with the app, as on the web |
| Form participation | out of scope | Flutter has no form file input; the app keeps the files |
| The file list with remove buttons; focus after a removal | adapted | a Flutter addition from the approved design: the next file's button takes focus, then the area: `the file list: …` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| One control named by the prompt, the caption read with it | adapted | a button named "Drag & drop files or browse" (`uploadDropArea.prompt` and `action`), or "Browse files" (`uploadDropArea.browse`, a catalog key added for this) without drops; the caption is its hint: `without drops: …`, `with drops: …` |
| Busy while the picker opens | adapted | the spinner is decorative, as on the web; the platform picker takes focus |
| The file list is a named list; remove buttons named "Remove {name}" | matched | `uploadDropArea.files`, `uploadDropArea.remove`: `the file list: …` |
| Screen reader output | not yet verified | Assistive technology: not tested |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A dashed 2 px border, solid while focused; the focus ring | matched | `_DashedBorder` |
| Drag highlight: the selection border and an 8% tint | matched | same |
| The upload glyph, the prompt with the underlined action word, the caption | matched | `GlyphShape.upload` |
| Narrow at text scale 2.0, right to left: nothing overflows; 24 by 24, 44 by 44 under touch; contrast | matched | `narrow at text scale 2.0, right to left: …` |

## Example with file_selector

```dart
import 'package:file_selector/file_selector.dart';
import 'package:invisible_ui/invisible_ui.dart' as iu;

Future<List<iu.UploadFile>> pickImages() async {
  final files = await openFiles(
    acceptedTypeGroups: const [
      XTypeGroup(label: 'Images', extensions: ['png', 'jpg', 'jpeg']),
    ],
  );
  return [
    for (final file in files)
      iu.UploadFile(
        name: file.name,
        size: await file.length(),
        type: file.mimeType ?? '',
        data: file,
      ),
  ];
}

iu.UploadDropArea(
  accept: '.png,.jpg,.jpeg',
  multiple: true,
  onBrowse: pickImages,
  onFiles: (files) => setState(() => attachments.addAll(files)),
  onRejected: (rejected) => log(rejected),
  files: attachments,
  onRemove: (file) => setState(() => attachments.remove(file)),
)
```
