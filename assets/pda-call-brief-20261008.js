(function(root) {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text = (v, limit = 260) => typeof v === 'string' || typeof v === 'number'
    ? String(v).replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, limit) : '';
  function standing(lead) {
    const blocks = [...String(lead.amanda_notes || '').matchAll(/\[PREMIER STANDING\]\s*\n([\s\S]*?)\n\[\/PREMIER STANDING\]/g)];
    const block = blocks.at(-1)?.[1] || '';
    const field = name => block.match(new RegExp('^' + name + ':\\s*([^\\n]*)$', 'm'))?.[1] || '';
    const stage = lead.pipeline_stage || lead.status || '';
    const stale = !!field('Status') && field('Status') !== stage;
    return { summary: stale ? '' : text(field('Summary')), next: stale ? '' : text(field('Next')),
      updated: !stale && Number.isFinite(Date.parse(field('Updated'))) ? field('Updated') : '', stale };
  }
  function sourcePath(value) {
    const raw = text(value, 500);
    try {
      if (raw.startsWith('/') && !raw.startsWith('//')) return raw.split(/[?#]/)[0];
      const u = new URL(raw);
      return /^https?:$/.test(u.protocol) && !u.username && !u.password ? u.hostname + u.pathname : '';
    } catch { return ''; }
  }
  function intake(lead) {
    let u = lead.utm;
    if (typeof u === 'string') { try { u = JSON.parse(u); } catch { u = {}; } }
    if (!u || typeof u !== 'object' || Array.isArray(u)) u = {};
    const answer = value => text(value, 180).replace(/_/g, ' ');
    const programs = {rda:'Dental assistant training',online:'Online program',in_person:'In-person program'};
    return [['Program', programs[lead.interest_path] || answer(lead.interest_path)], ['Learning format', answer(lead.path_preference)],
      ['Ready to start', answer(lead.ready_timeline)], ['Source', u.utm_source || u.source || lead.source],
      ['Campaign', u.utm_campaign || u.campaign], ['Ad / content', u.utm_content || u.content],
      ['Form', u.form || u.form_id], ['Landing page', sourcePath(lead.landing_page)]]
      .map(([label, value]) => [label, text(value, 180)]).filter(([, value]) => value);
  }
  function body(lead) {
    const s = standing(lead), rows = intake(lead);
    const reviewed = s.updated ? new Date(s.updated).toLocaleString('en-US', {timeZone:'America/Chicago', month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}) + ' CT' : '';
    return `<div class="pda-brief-heading">Current standing</div><p>${escape(s.summary || (s.stale ? 'The stage changed after the last reviewed brief. Check contact history for the latest update.' : 'No reviewed call summary yet.'))}</p>` +
      (s.next ? `<div class="pda-brief-heading">Next step</div><p class="pda-brief-next">${escape(s.next)}</p>` : '') +
      (reviewed ? `<p class="pda-brief-evidence">Reviewed ${escape(reviewed)}</p>` : '') +
      `<div class="pda-brief-heading">Intake & ad context</div>` +
      (rows.length ? `<dl>${rows.map(([k,v])=>`<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join('')}</dl>` : '<p>No source details recorded.</p>') +
      '<p class="pda-brief-evidence">From this Premier lead’s saved fields. Missing ad details are not inferred.</p>';
  }
  function preview(lead) {
    return `<details class="pda-call-brief"><summary aria-label="Call brief and intake for ${escape([lead.first_name,lead.last_name].filter(Boolean).join(' ') || 'this lead')}"><span>Call brief</span><span class="pda-brief-hint">Standing · next step · ad context</span><span aria-hidden="true">↗</span></summary><div class="pda-brief-panel">${body(lead)}</div></details>`;
  }
  const api = {standing,intake,body,preview};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else {
    root.PdaCallBrief = api;
    document.addEventListener('pointerover', event => {
      if (event.pointerType !== 'mouse') return;
      const card = event.target.closest?.('.pda-call-brief');
      if (card && !card.open) { card.dataset.hoverOpen = 'true'; card.open = true; }
    });
    document.addEventListener('pointerout', event => {
      const card = event.target.closest?.('.pda-call-brief');
      if (card?.dataset.hoverOpen && !card.contains(event.relatedTarget) && !card.contains(document.activeElement)) {
        card.open = false; delete card.dataset.hoverOpen;
      }
    });
    document.addEventListener('click', event => {
      const summary = event.target.closest?.('.pda-call-brief > summary');
      if (summary?.parentElement.dataset.hoverOpen) {
        event.preventDefault(); delete summary.parentElement.dataset.hoverOpen;
      }
    });
  }
})(typeof window !== 'undefined' ? window : this);
