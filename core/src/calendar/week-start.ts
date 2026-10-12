/**
 * The first day of the week a locale uses, from CLDR's week data, with no
 * dependency on the runtime's `Intl` support. The Flutter adapter carries the
 * same table; both answer the shared vectors in `__vectors__/week-start.json`.
 */

/** A day of the week, 1 = Monday … 7 = Sunday (ISO 8601). */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** CLDR 46 `weekData` `firstDay` for the regions that do not start on Monday. */
const FIRST_DAY_BY_REGION: Record<string, IsoWeekday> = {};
const NON_MONDAY: [IsoWeekday, string][] = [
  [5, "MV"],
  [6, "AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY"],
  [
    7,
    "AG AS BD BR BS BT BW BZ CA CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ " +
      "NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW",
  ],
];
for (const [day, regions] of NON_MONDAY) {
  for (const region of regions.split(" ")) FIRST_DAY_BY_REGION[region] = day;
}

/**
 * The likely region of each language whose likely region does not start the
 * week on Monday (CLDR likely subtags). Every other language falls back to
 * Monday, the world default.
 */
const LIKELY_REGION: Record<string, string> = {
  aa: "ET",
  ae: "IR",
  af: "ZA",
  am: "ET",
  ar: "EG",
  as: "IN",
  bn: "BD",
  ch: "GU",
  cr: "CA",
  dv: "MV",
  dz: "BT",
  en: "US",
  fa: "IR",
  gn: "PY",
  gu: "IN",
  he: "IL",
  hi: "IN",
  id: "ID",
  ik: "US",
  iu: "CA",
  ja: "JP",
  jv: "ID",
  ki: "KE",
  km: "KH",
  kn: "IN",
  ko: "KR",
  ks: "IN",
  lo: "LA",
  mh: "MH",
  ml: "IN",
  mr: "IN",
  mt: "MT",
  my: "MM",
  nd: "ZW",
  ne: "NP",
  nr: "ZA",
  nv: "US",
  oj: "CA",
  om: "ET",
  or: "IN",
  pa: "IN",
  pi: "IN",
  ps: "AF",
  pt: "BR",
  qu: "PE",
  sa: "IN",
  sd: "PK",
  sm: "WS",
  sn: "ZW",
  ss: "ZA",
  st: "ZA",
  su: "ID",
  ta: "IN",
  te: "IN",
  th: "TH",
  ti: "ET",
  tn: "ZA",
  ts: "ZA",
  ur: "PK",
  ve: "ZA",
  xh: "ZA",
  zu: "ZA",
};

const FW: Record<string, IsoWeekday> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };

/** The table above, for the shared vectors test. */
export const weekStartData = { firstDayByRegion: FIRST_DAY_BY_REGION, likelyRegion: LIKELY_REGION };

/**
 * The CLDR first day of the week for a BCP 47 locale tag. In order: the
 * `-u-fw-` keyword, the `-u-rg-` region override, the tag's region, the
 * language's likely region, then Monday. A region missing from the table,
 * such as `419`, starts on Monday, as in CLDR.
 */
export function weekStartForLocale(locale: string): IsoWeekday {
  const subtags = locale.toLowerCase().split(/[-_]/);
  let region: string | undefined;
  let i = 1;
  for (; i < subtags.length && subtags[i]!.length > 1; i++) {
    const tag = subtags[i]!;
    if (region === undefined && (/^[a-z]{2}$/.test(tag) || /^\d{3}$/.test(tag))) {
      region = tag.toUpperCase();
    }
  }
  for (; i < subtags.length; i++) {
    if (subtags[i] === "x") break;
    if (subtags[i] !== "u") continue;
    for (let j = i + 1; j + 1 < subtags.length && subtags[j]!.length > 1; j++) {
      const value = subtags[j + 1]!;
      if (subtags[j] === "fw" && FW[value]) return FW[value]!;
      if (subtags[j] === "rg" && /^[a-z]{2}z{4}$/.test(value))
        region = value.slice(0, 2).toUpperCase();
    }
  }
  region ??= LIKELY_REGION[subtags[0]!];
  return (region && FIRST_DAY_BY_REGION[region]) || 1;
}
