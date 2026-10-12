import 'package:flutter/foundation.dart';

/// A file an app hands to an [UploadDropArea], picked or dropped. The area
/// reads only the [name], the [size] and the [type]; [data] is the app's,
/// such as the picker's own file object.
@immutable
class UploadFile {
  /// Describes a file.
  const UploadFile({
    required this.name,
    required this.size,
    this.type = '',
    this.data,
  });

  /// The file name, with its extension.
  final String name;

  /// The size in bytes.
  final int size;

  /// The media type, such as `image/png`; empty when the platform did not
  /// say.
  final String type;

  /// The app's own handle on the file.
  final Object? data;

  @override
  String toString() => 'UploadFile($name, $size, $type)';
}

/// Why an [UploadDropArea] left a file out.
enum UploadRejectReason {
  /// Its type is not in the accept list.
  type,

  /// The area takes one file and another came first.
  count,
}

/// A file an [UploadDropArea] left out, and why.
@immutable
class UploadRejection {
  /// Describes a rejected [file].
  const UploadRejection(this.file, this.reason);

  /// The file.
  final UploadFile file;

  /// Why it was left out.
  final UploadRejectReason reason;
}

/// Whether [file] matches [accept], a comma-separated list in the format of
/// the web's `accept` attribute: extensions (`.pdf`), media types
/// (`application/pdf`) and type families (`image/*`), without case. An
/// empty or null list accepts every file. A file with no [UploadFile.type]
/// matches by extension only.
bool acceptsFile(String? accept, UploadFile file) {
  if (accept == null || accept.trim().isEmpty) return true;
  final name = file.name.toLowerCase();
  final type = file.type.toLowerCase();
  for (final raw in accept.split(',')) {
    final token = raw.trim().toLowerCase();
    if (token.isEmpty) continue;
    if (token.startsWith('.')) {
      if (name.endsWith(token)) return true;
    } else if (token.endsWith('/*')) {
      if (type.isNotEmpty &&
          type.startsWith(token.substring(0, token.length - 1))) {
        return true;
      }
    } else if (type.isNotEmpty && type == token) {
      return true;
    }
  }
  return false;
}

/// Splits [files] into the ones an area takes and the ones it leaves out:
/// the type must match [accept], and without [multiple] only the first
/// matching file is taken. Picked and dropped files go through the same
/// split.
({List<UploadFile> accepted, List<UploadRejection> rejected}) splitFiles(
  List<UploadFile> files, {
  String? accept,
  bool multiple = false,
}) {
  final accepted = <UploadFile>[];
  final rejected = <UploadRejection>[];
  for (final file in files) {
    if (!acceptsFile(accept, file)) {
      rejected.add(UploadRejection(file, UploadRejectReason.type));
    } else if (!multiple && accepted.isNotEmpty) {
      rejected.add(UploadRejection(file, UploadRejectReason.count));
    } else {
      accepted.add(file);
    }
  }
  return (accepted: accepted, rejected: rejected);
}
