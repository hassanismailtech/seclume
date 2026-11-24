// UTF-8 decoded as a legacy encoding leaves these characteristic sequences.
export function hasMojibake(value) {
  return /\uFFFD|[\u0080-\u009F]|\u00C3[\u0080-\u00BF]|\u00C2[\u0080-\u00BF]|\u00E2[\u0080-\u00BF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u02C6\u02DC\u2013-\u201A\u201C-\u201E\u2020-\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]|\u00F0[\u0080-\u00BF\u0178]|\u00EF\u00BB\u00BF/u.test(value);
}
