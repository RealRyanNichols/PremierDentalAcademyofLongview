/*!
 * Onboarding & Competency Hub — analytics event names (single source of truth).
 *
 * The D5 growth package (§15) defines the canonical public/product event
 * lists, but that document is not in the repo yet (docs/hub/REPO-NOTES.md).
 * This set covers the events the prompt names explicitly plus the obvious
 * funnel/product actions; reconcile names against D5 §15 before launch and
 * keep docs/hub/ANALYTICS.md in sync.
 *
 * Rules: no PII in props, no quiz answers, no free-text notes. The server
 * route (api/hub/events.js) enforces the allowlist and strips PII-shaped keys.
 */

export const HUB_EVENT_NAMES = [
  // public funnel
  'hub_landing_viewed',
  'generator_started',
  'generator_completed',
  'generator_email_submitted',
  'tutorial_viewed',
  'tutorial_completed',
  'tutorial_feedback_submitted',
  'hub_contact_clicked',
  // product
  'workspace_started',
  'invite_sent',
  'invite_accepted',
  'template_applied',
  'plan_created',
  'task_completed',
  'first_skill_signed_off',   // activation
  'skill_signed_off',
  'needs_coaching_flagged',
  'quiz_passed',
  'checkin_created',
  'sop_created',
  'report_generated',
  'member_archived',
  'support_grant_created',
  'upgrade_viewed',
  'deletion_requested',
];
// Retention ("weekly_training_action") is server-derived from the SQL view
// hub_weekly_training_actions — it is intentionally NOT a client event.

// Keys stripped from props server-side (defense against accidental PII).
export const PII_PROP_KEYS = ['email', 'name', 'first_name', 'last_name',
  'phone', 'address', 'note', 'notes', 'answers'];
