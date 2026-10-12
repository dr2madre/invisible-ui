import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/src/upload_drop_area/upload_files.dart';

// The language-neutral vectors core/src/upload-drop-area/vectors.test.ts runs
// against core/. Present in a checkout of the whole repository; a copy of
// this package alone skips them.
final File _file = File(
  '../../core/src/upload-drop-area/__vectors__/upload-drop-area.json',
);

List<Map<String, dynamic>> _cases(Object? json) =>
    (json! as List<dynamic>).cast<Map<String, dynamic>>();

UploadFile _upload(Map<String, dynamic> json) => UploadFile(
  name: json['name'] as String,
  size: 0,
  type: json['type'] as String,
);

void main() {
  final skip = _file.existsSync() ? false : 'core/ is not in this checkout';
  final file = _file.existsSync()
      ? jsonDecode(_file.readAsStringSync()) as Map<String, dynamic>
      : const <String, dynamic>{};

  group('upload drop area vectors', () {
    if (skip != false) return;
    for (final v in _cases(file['accepts'])) {
      test('accepts: ${v['name']}', () {
        expect(
          acceptsFile(
            v['accept'] as String,
            _upload(v['file'] as Map<String, dynamic>),
          ),
          v['expect'],
        );
      });
    }
    for (final v in _cases(file['split'])) {
      test('split: ${v['name']}', () {
        final split = splitFiles(
          [for (final f in _cases(v['files'])) _upload(f)],
          accept: v['accept'] as String,
          multiple: v['multiple'] as bool,
        );
        expect({
          'accepted': [for (final f in split.accepted) f.name],
          'rejected': [
            for (final r in split.rejected)
              {'name': r.file.name, 'reason': r.reason.name},
          ],
        }, v['expect']);
      });
    }
  }, skip: skip);
}
