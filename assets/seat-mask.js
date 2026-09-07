// Seat-availability label. Shows the REAL number of open seats.
//
// History: until Sep 7, 2026 this capped the displayed count by how close the
// class was (a class with 6 open seats showed "3 seats left" inside a week of
// start). That is invented urgency, which Amanda's rule forbids and which a
// refund complaint could use against us, so the cap is gone. The function keeps
// its name and shape so calendar.html and enroll.html need no change.
//
// Rules:
//   - real ≤ 0  →  "Full · join waitlist"
//   - real == 1 →  "Last seat!" (no number)
//   - else       →  "<real> seats left"
(function (root) {
  function maskSeats(realSeats, daysOut) {
    const real = Number(realSeats) || 0;
    if (real <= 0) return { count: 0, label: 'Full · join waitlist', full: true, urgent: false };
    if (real === 1) return { count: 1, label: 'Last seat!',          full: false, urgent: true };
    return {
      count: real,
      label: `${real} seat${real === 1 ? '' : 's'} left`,
      full: false,
      urgent: real <= 3,
    };
  }

  function daysUntil(isoDate) {
    if (!isoDate) return 0;
    const target = new Date(isoDate + 'T00:00:00').getTime();
    const today  = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00').getTime();
    return Math.max(0, Math.round((target - today) / 86400000));
  }

  root.PDASeats = { maskSeats, daysUntil };
})(window);
