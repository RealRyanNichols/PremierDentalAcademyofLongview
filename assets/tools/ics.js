/*!
 * Premier Dental Academy — iCalendar (.ics) generation.
 *
 * Produces an RFC 5545 calendar of class start dates that somebody can subscribe to in Apple
 * Calendar, Google Calendar or Outlook, so a new cohort appears in their diary without them
 * having to come back and check the website.
 *
 * Two fussy details that break calendar files if you get them wrong, and are easy to get wrong:
 *   - Lines must be CRLF terminated and folded at 75 octets. Long SUMMARY or DESCRIPTION values
 *     silently corrupt the file in some clients otherwise.
 *   - Commas, semicolons, backslashes and newlines inside a text value must be escaped, or the
 *     parser reads them as field separators and drops everything after them.
 *
 * All-day events use DATE values and an exclusive DTEND, so a one-day event ends the FOLLOWING
 * day. Getting that wrong is why events sometimes show as two days long.
 *
 * Pinned by scripts/test/ics.test.mjs.
 */
(function () {
  'use strict';

  function escapeText(s) {
    return String(s == null ? '' : s)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  // RFC 5545 section 3.1: fold at 75 octets, continuation lines begin with a single space.
  function fold(line) {
    if (line.length <= 75) return line;
    var out = line.slice(0, 75), rest = line.slice(75);
    while (rest.length > 74) {
      out += '\r\n ' + rest.slice(0, 74);
      rest = rest.slice(74);
    }
    return rest.length ? out + '\r\n ' + rest : out;
  }

  function ymd(iso) { return String(iso).slice(0, 10).replace(/-/g, ''); }

  function addDays(iso, n) {
    var d = new Date(String(iso).slice(0, 10) + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  /**
   * @param {Object} cfg
   *   name        calendar name shown in the subscriber's app
   *   description calendar description
   *   stamp       a fixed ISO timestamp for DTSTAMP (kept stable so regenerating an unchanged
   *               calendar produces an identical file rather than a spurious diff)
   *   events      [{ uid, start, end?, summary, description?, location?, url? }]
   */
  function build(cfg) {
    cfg = cfg || {};
    var stamp = String(cfg.stamp || '20260101T000000Z');
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Premier Dental Academy of Longview//Class Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:' + escapeText(cfg.name || 'Premier Dental Academy classes'),
      'X-WR-CALDESC:' + escapeText(cfg.description || ''),
      'X-PUBLISHED-TTL:PT12H'
    ];

    (cfg.events || []).forEach(function (e) {
      // DTEND is exclusive for all-day events, so a single-day event ends the next day.
      var endExclusive = addDays(e.end || e.start, 1);
      lines.push('BEGIN:VEVENT');
      lines.push('UID:' + escapeText(e.uid));
      lines.push('DTSTAMP:' + stamp);
      lines.push('DTSTART;VALUE=DATE:' + ymd(e.start));
      lines.push('DTEND;VALUE=DATE:' + ymd(endExclusive));
      lines.push('SUMMARY:' + escapeText(e.summary));
      if (e.description) lines.push('DESCRIPTION:' + escapeText(e.description));
      if (e.location) lines.push('LOCATION:' + escapeText(e.location));
      if (e.url) lines.push('URL:' + escapeText(e.url));
      lines.push('TRANSP:TRANSPARENT');
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.map(fold).join('\r\n') + '\r\n';
  }

  var API = { build: build, escapeText: escapeText, fold: fold, addDays: addDays, ymd: ymd };

  if (typeof window !== 'undefined') window.PDA_ICS = API;
  else globalThis.PDA_ICS = API;
})();
