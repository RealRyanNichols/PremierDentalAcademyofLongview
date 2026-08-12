/*!
 * Onboarding & Competency Hub (working name) — shared constants.
 *
 * INTERIM SOURCE OF TRUTH for hub-specific constants, imported everywhere the
 * hub needs them (browser modules AND api/hub/* serverless functions). The
 * repo-wide business facts live in assets/site-facts.js (window.PDA_FACTS);
 * the CONTACT block below mirrors those values and must stay in sync with it
 * (scripts/check-hub.mjs verifies parity).
 *
 * HUB_DISPLAY_NAME: the product has NO approved public name yet. Public pages
 * use neutral copy ("our onboarding hub for dental offices"); the app UI reads
 * this constant, so renaming after Amanda approves a name is a one-line change.
 */

export const HUB_DISPLAY_NAME = 'Onboarding & Competency Hub';
export const HUB_SLUG = 'office-hub';

export const CONTACT = {
  name: 'Premier Dental Academy of Longview',
  address: '2800 Gilmer Rd, Suite 106, Longview, TX 75604',
  phoneDisplay: '(903) 913-6444',
  phoneHref: 'tel:+19039136444',
  email: 'hello@premierdentalacademyoflongview.com',
  site: 'https://www.premierdentalacademyoflongview.com',
};

// Rendered on the readiness report footer, generator results that include
// radiology items, and help content. Required by design — do not remove.
export const TRAINING_RECORD_DISCLAIMER =
  'This is an internal training record kept by your practice. It is not a ' +
  'certification, license, HIPAA or OSHA credential, or a substitute for ' +
  'state-required training.';

export const TEXAS_RADIOLOGY_NOTE =
  'In Texas, x-ray positioning and exposure require the TSBDE Registered ' +
  'Dental Assistant radiology certificate. Items in this category are ' +
  'practice-internal familiarization only and do not authorize exposing ' +
  'radiographs.';

// Roles inside a practice workspace (mirrors the hub_role enum, minus
// premier_support which is never assignable by practices).
export const WORKSPACE_ROLES = ['owner', 'manager', 'trainer', 'employee'];

// Free tier: one active (non-archived) hire per practice. Enforced in the
// database by trigger; this constant only drives UI messaging.
export const FREE_TIER_ACTIVE_HIRES = 1;

// Paid tier has NO price anywhere by rule. This exact sentence is the only
// thing the upgrade surface may show about cost.
export const PRICING_PENDING_COPY =
  'Pricing is being finalized — talk to Premier.';
