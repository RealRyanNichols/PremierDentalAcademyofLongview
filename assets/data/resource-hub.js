/*!
 * Premier Dental Academy — student resource hub, as shared data.
 *
 * These are crisis and assistance resources: childcare, food, rent, mental health, domestic
 * violence, GED. They used to be built by JavaScript, which meant a student on a locked-down
 * or low-end device could load the page and see an empty box. That is the worst possible page
 * to fail silently, so the list now lives here and is written into the HTML at build time by
 * scripts/build-static-content.mjs. Edit the content HERE — the page has no copy of its own.
 *
 * Every entry is an independent third-party service. PDA is not affiliated with any of them and
 * availability can change; the page carries that disclaimer.
 */
(function () {
  'use strict';

  var RESOURCES = [
    { icon: '🧸', title: 'Childcare help',
      body: 'Texas can help working or in-training parents pay for childcare. Ask your local Workforce Solutions office, or visit <a class="link" href="https://www.twc.texas.gov/programs/child-care" target="_blank" rel="noopener">twc.texas.gov</a>. Need it fast? Dial <a class="link" href="tel:211">211</a>.' },
    { icon: '🍎', title: 'Food assistance',
      body: 'Apply for SNAP food benefits at <a class="link" href="https://www.yourtexasbenefits.com" target="_blank" rel="noopener">YourTexasBenefits.com</a>. For a food pantry near you, contact the <a class="link" href="https://www.easttexasfoodbank.org" target="_blank" rel="noopener">East Texas Food Bank</a> or dial <a class="link" href="tel:211">211</a>.' },
    { icon: '🏠', title: 'Rent, utilities & bills',
      body: 'Dial <a class="link" href="tel:211">211</a> (211 Texas) — a free, 24/7 line that connects you to local rent, utility, and emergency-assistance programs.' },
    { icon: '💬', title: 'Someone to talk to',
      body: 'Free and confidential, 24/7. Call or text <a class="link" href="tel:988">988</a> (Suicide &amp; Crisis Lifeline), or the SAMHSA helpline at <a class="link" href="tel:18006624357">1-800-662-4357</a> for mental health or substance support.' },
    { icon: '🛟', title: 'Safety at home',
      body: 'If you are not safe, you deserve help. The National Domestic Violence Hotline is <a class="link" href="tel:18007997233">1-800-799-7233</a> (or text START to 88788), free and confidential. Dial <a class="link" href="tel:211">211</a> for local shelters.' },
    { icon: '🎓', title: 'Finish your GED',
      body: 'No high-school diploma yet? Free GED and adult-education classes are available across East Texas. Dial <a class="link" href="tel:211">211</a> or ask Workforce Solutions to find one near you.' }
  ];

  var API = { RESOURCES: RESOURCES };

  if (typeof window !== 'undefined') window.PDA_RESOURCES = API;
  else globalThis.PDA_RESOURCES = API;
})();
