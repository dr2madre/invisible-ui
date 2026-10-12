import 'dart:ui' show Locale;

// The first day of the week a locale uses, from CLDR's week data. The same
// table is in core/src/calendar/week-start.ts; both answer the shared vectors
// in core/src/calendar/__vectors__/week-start.json.

/// CLDR 46 `weekData` `firstDay` for the regions that do not start on Monday.
const Map<int, String> _nonMonday = {
  DateTime.friday: 'MV',
  DateTime.saturday: 'AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY',
  DateTime.sunday:
      'AG AS BD BR BS BT BW BZ CA CO DM DO ET GT GU HK HN ID IL IN JM JP KE '
      'KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT '
      'TW UM US VE VI WS YE ZA ZW',
};

/// The first day of each region in [_nonMonday]. Package-internal, read by
/// the shared vectors test.
final Map<String, int> firstDayByRegion = {
  for (final MapEntry(key: day, value: regions) in _nonMonday.entries)
    for (final region in regions.split(' ')) region: day,
};

/// The likely region of each language whose likely region does not start
/// the week on Monday (CLDR likely subtags). Package-internal.
const Map<String, String> likelyRegion = {
  'aa': 'ET',
  'ae': 'IR',
  'af': 'ZA',
  'am': 'ET',
  'ar': 'EG',
  'as': 'IN',
  'bn': 'BD',
  'ch': 'GU',
  'cr': 'CA',
  'dv': 'MV',
  'dz': 'BT',
  'en': 'US',
  'fa': 'IR',
  'gn': 'PY',
  'gu': 'IN',
  'he': 'IL',
  'hi': 'IN',
  'id': 'ID',
  'ik': 'US',
  'iu': 'CA',
  'ja': 'JP',
  'jv': 'ID',
  'ki': 'KE',
  'km': 'KH',
  'kn': 'IN',
  'ko': 'KR',
  'ks': 'IN',
  'lo': 'LA',
  'mh': 'MH',
  'ml': 'IN',
  'mr': 'IN',
  'mt': 'MT',
  'my': 'MM',
  'nd': 'ZW',
  'ne': 'NP',
  'nr': 'ZA',
  'nv': 'US',
  'oj': 'CA',
  'om': 'ET',
  'or': 'IN',
  'pa': 'IN',
  'pi': 'IN',
  'ps': 'AF',
  'pt': 'BR',
  'qu': 'PE',
  'sa': 'IN',
  'sd': 'PK',
  'sm': 'WS',
  'sn': 'ZW',
  'ss': 'ZA',
  'st': 'ZA',
  'su': 'ID',
  'ta': 'IN',
  'te': 'IN',
  'th': 'TH',
  'ti': 'ET',
  'tn': 'ZA',
  'ts': 'ZA',
  'ur': 'PK',
  've': 'ZA',
  'xh': 'ZA',
  'zu': 'ZA',
};

const Map<String, int> _fw = {
  'mon': DateTime.monday,
  'tue': DateTime.tuesday,
  'wed': DateTime.wednesday,
  'thu': DateTime.thursday,
  'fri': DateTime.friday,
  'sat': DateTime.saturday,
  'sun': DateTime.sunday,
};

final RegExp _regionTag = RegExp(r'^([a-z]{2}|\d{3})$');
final RegExp _regionOverride = RegExp(r'^[a-z]{2}z{4}$');

/// The CLDR first day of the week of a BCP 47 locale tag,
/// [DateTime.monday] to [DateTime.sunday]. In order: the `-u-fw-` keyword,
/// the `-u-rg-` region override, the tag's region, the language's likely
/// region, then Monday. A region missing from the table, such as `419`,
/// starts on Monday, as in CLDR.
int weekStartForTag(String tag) {
  final subtags = tag.toLowerCase().split(RegExp('[-_]'));
  String? region;
  var i = 1;
  for (; i < subtags.length && subtags[i].length > 1; i++) {
    if (region == null && _regionTag.hasMatch(subtags[i])) {
      region = subtags[i].toUpperCase();
    }
  }
  for (; i < subtags.length; i++) {
    if (subtags[i] == 'x') break;
    if (subtags[i] != 'u') continue;
    for (var j = i + 1; j + 1 < subtags.length && subtags[j].length > 1; j++) {
      final value = subtags[j + 1];
      final day = _fw[value];
      if (subtags[j] == 'fw' && day != null) return day;
      if (subtags[j] == 'rg' && _regionOverride.hasMatch(value)) {
        region = value.substring(0, 2).toUpperCase();
      }
    }
  }
  region ??= likelyRegion[subtags.first];
  return firstDayByRegion[region] ?? DateTime.monday;
}

/// The CLDR first day of the week of [locale], [DateTime.monday] to
/// [DateTime.sunday], from its country, else its language's likely region.
int weekStartForLocale(Locale locale) =>
    weekStartForTag(locale.toLanguageTag());
