// Seat-availability mask. Caps the displayed remaining seats based on how close
// the class is, to create urgency without ever showing "1 left" (which looks
// awkward the moment someone buys).
//
// Rules:
//   - real ≤ 0  →  "Full — join waitlist"
//   - real == 1 →  "Last seat!" (no number)
//   - else       →  shown = max(2, min(real, cap(daysOut)))
//
// The cap depends only on daysOut, so a purchase doesn't decrement the badge
// unless real seats drop below the cap.
(function (root) {
  function cap(daysOut) {
    if (daysOut >= 90) return Infinity;
    if (daysOut >= 60) return 12;
    if (daysOut >= 30) return 8;
    if (daysOut >= 14) return 5;
    if (daysOut >= 7)  return 3;
    return 2;
  }

  function maskSeats(realSeats, daysOut) {
    const real = Number(realSeats) || 0;
    if (real <= 0) return { count: 0, label: 'Full · join waitlist', full: true, urgent: false };
    if (real === 1) return { count: 1, label: 'Last seat!',          full: false, urgent: true };
    const shown = Math.max(2, Math.min(real, cap(Number(daysOut) || 0)));
    return {
      count: shown,
      label: `${shown} seat${shown === 1 ? '' : 's'} left`,
      full: false,
      urgent: shown <= 4,
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
