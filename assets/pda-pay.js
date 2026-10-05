/* assets/pda-pay.js — where the checkout pages send a card payment.
 *
 * pdaPay('buy-product', init) posts to the site's own API (/api/buy-product on the droplet).
 * Only if that route doesn't exist yet (404) or the request never reached a server does it
 * fall back to the old Supabase function of the same name. Both ends build the same Square
 * idempotency key from the card token, so a fallback can never charge twice.
 * Remove the fallback once Supabase is switched off (see ops/square/README.md).
 */
(function () {
  'use strict';
  var OLD_BASE = 'https://lmbsuwslsycukynzpzik.supabase.co/functions/v1/';
  var OLD_KEY = 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh';
  window.pdaPay = async function (fn, init) {
    init = init || {};
    var res = null;
    try { res = await fetch('/api/' + fn, init); } catch (e) { res = null; }
    if (res && res.status !== 404) return res;
    var headers = {};
    var given = init.headers || {};
    for (var k in given) { if (Object.prototype.hasOwnProperty.call(given, k)) headers[k] = given[k]; }
    if (!headers.apikey) headers.apikey = OLD_KEY;
    if (!headers.Authorization && !headers.authorization) headers.Authorization = 'Bearer ' + OLD_KEY;
    return fetch(OLD_BASE + fn, { method: init.method || 'POST', headers: headers, body: init.body });
  };
})();
