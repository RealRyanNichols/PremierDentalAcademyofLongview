/* PDA — Ask Premier 🦷
 * Floating chatbot widget. Loads on every public marketing page.
 * Has canned responses for the most-asked PDA questions, escapes to a
 * human via /contact for anything it can't answer. All conversations
 * are logged to Supabase `chat_messages` if the table exists.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || window.__askPremierLoaded) return;
  window.__askPremierLoaded = true;

  // Don't load inside the trainers (they have their own UI) or admin
  const path = location.pathname;
  if (/^\/tools\//.test(path) || /^\/admin\//.test(path)) return;

  // Supabase (optional — only used to log conversations)
  let sb = null;
  if (window.supabase?.createClient) {
    try {
      sb = window.supabase.createClient(
        'https://lmbsuwslsycukynzpzik.supabase.co',
        'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh'
      );
    } catch (e) {}
  }

  // Knowledge base — keyword matchers + canned responses
  const KB = [
    { match: /\b(price|cost|tuition|how much|fee|charge)\b/i,
      reply: '🔥 **LIMITED TIME** — Online is **$397 one-time** (regularly $997). Start any day, no class schedule.\n\n**In-Person** at our Longview campus is **$3,000 paid in full**, or **$3,500 on a plan** ($500 down, then weekly or monthly payments).\n\nOnline is non-refundable at the sale price, but if it isn\'t right for you we\'ll transfer your full $397 as credit toward the In-Person program — your money is never lost.',
      cta: { label: 'See enrollment options →', href: '/enroll' } },

    { match: /\b(how long|duration|weeks|time|months|schedule)\b/i,
      reply: 'Pick the format that fits you:\n• **In-Person** at our Longview campus\n• **Online** — live video classes from anywhere\n\nSame curriculum, same instructors, same certificate. Tap to see class dates.',
      cta: { label: 'See upcoming classes →', href: '/classes' } },

    { match: /\b(when|next class|start|begin|cohort)\b/i,
      reply: 'Our next class starts soon — multiple cohorts each year (May, June, August, September, November). Tap below to see the full schedule and reserve your seat.',
      cta: { label: 'View upcoming classes →', href: '/classes' } },

    { match: /\b(payment|monthly|finance|installment|pay over time|plan)\b/i,
      reply: '**In-Person** is **$3,000 paid in full**, or **$3,500 on a plan** — $500 down, then weekly or monthly payments (up to 12) until paid off.\n\n**Online** is a flat $397 one-time payment (limited-time sale, normally $997). At that price it\'s one-and-done.\n\nYou may also qualify for **WIOA funding** through **Workforce Solutions East Texas** — you apply directly with them (free).',
      cta: { label: 'Apply →', href: '/apply' } },

    { match: /\b(twc|workforce|wioa|veteran|gi bill|funding|scholarship|grant|fafsa)\b/i,
      reply: 'Yes — through **WIOA funding** with **Workforce Solutions East Texas**. You apply directly with them (not through PDA): fill out their free WIOA interest form and they\'ll contact you within about 3 business days by phone, text, or email. The process takes ~6–8 weeks, so start early to be funded in time for your class. Start here: https://www.easttexasworkforce.org/apply',
      cta: { label: 'Apply for funding →', href: '/apply' } },

    { match: /\b(salary|pay|earn|how much.*make|income|wage)\b/i,
      reply: 'RDA starting pay in East Texas is **$36k–$46k/yr**. With software fluency + 1 year experience: **$42k–$56k**.\n\nTry our calculator to see what you could earn:',
      cta: { label: 'Run the numbers →', href: '/salary' } },

    { match: /\b(job|hire|hired|placement|placed|career|employed)\b/i,
      reply: 'Most students interview before graduation and have offers within 2 weeks after. We help match grads with East Texas offices that hire from PDA every cohort.',
      cta: { label: 'See where our grads work →', href: '/graduates' } },

    { match: /\b(apply|sign up|enroll|register|application)\b/i,
      reply: 'Tap below to fill out a free application. Amanda or someone from PDA will reach out within 1 business day to schedule a campus tour.',
      cta: { label: 'Apply now →', href: '/apply' } },

    { match: /\b(amanda|williams|founder|owner|who runs)\b/i,
      reply: 'Premier Dental Academy is owned by **Amanda Williams** — and she\'s not a doctor or a corporate trainer. She took this same course, earned her RDA, and worked chairside in an East Texas office. Then she was asked to take the school over, and she bought it. She runs PDA so new RDAs walk in already fluent — instead of learning it the hard way like she had to.',
      cta: { label: 'Read Amanda\'s story →', href: '/about' } },

    { match: /\b(location|address|where|campus|directions|map)\b/i,
      reply: 'Our campus is at **2800 Gilmer Rd, Suite 106, Longview, TX 75604**. Drop-ins welcome during business hours; tours by appointment.',
      cta: { label: 'Get directions →', href: 'https://maps.google.com/?q=2800+Gilmer+Rd+Suite+106+Longview+TX+75604' } },

    { match: /\b(text|sms|message me|chat now|right now|instant)\b/i,
      reply: 'Want a real person right now? **Text us at (903) 913-6444** and Amanda\'s team replies fast — usually within minutes during business hours.',
      cta: { label: '📲 Text (903) 913-6444', href: 'sms:+19039136444' } },

    { match: /\b(phone|call|number)\b/i,
      reply: 'Call us at **(903) 913-6444** — Mon–Fri, 9am–6pm CT. Prefer texting? We answer those fast too.',
      cta: { label: '📞 Call now', href: 'tel:+19039136444' } },

    { match: /\b(email|contact|message|reach)\b/i,
      reply: 'Email **hello@PremierDentalAcademyOfLongview.com** — we reply within 1 business day. Or send a message through our contact form.',
      cta: { label: 'Send a message →', href: '/contact' } },

    { match: /\b(refund|money back|guarantee|cancel)\b/i,
      reply: '**Online ($397 sale):** non-refundable at the sale price — but if Online isn\'t right for you we\'ll transfer your full $397 as credit toward the In-Person program. Your money is never lost.\n\n**In-Person ($3,000, or $3,500 on a plan):** pro-rated refund per Texas state proprietary-school guidelines.',
      cta: { label: 'See full policy →', href: '/terms' } },

    { match: /\b(certification|certificate|license|state board|rda|register|registration|texas)\b/i,
      reply: 'PDA gives you a **Certificate of Completion**. Texas RDA registration is a separate step with the Texas State Board of Dental Examiners — and our curriculum prepares you for it (radiology, jurisprudence, infection control, all included).',
      cta: { label: 'Read the registration guide →', href: '/blog/texas-rda-registration-guide' } },

    { match: /\b(software|dentrix|eaglesoft|practice management|chart|chairside|practice pro|trainer)\b/i,
      reply: 'PDA built our own practice management trainers from scratch — **Practice Pro** (front-desk + business) and **ChairSide** (clinical workflow). Students get hundreds of hours of real software practice before their first day on the job.',
      cta: { label: 'Try the free preview →', href: '/tools/practice-pro' } },

    { match: /\b(tour|visit|see|campus)\b/i,
      reply: 'Yes! Campus tours are by appointment. Apply (free, no obligation) and we\'ll schedule one.',
      cta: { label: 'Book a tour →', href: '/apply' } },

    { match: /\b(experience|prior|never|new to|background|qualif)\b/i,
      reply: 'No dental experience required. About 70% of our students start with zero dental background — the curriculum and trainers are designed for that.' },

    { match: /\b(age|old|young|teen|adult|18|16|65)\b/i,
      reply: 'You need to be at least 16 to enroll. Most students are between 18 and 45, but we\'ve had students in their 50s and 60s do great too.' },

    { match: /\b(person|human|real|talk to|speak with|representative)\b/i,
      reply: 'Of course! Tap below to send Amanda a message — she or someone from her team will reach out within 1 business day.',
      cta: { label: 'Talk to a human →', href: '/contact' } },

    // Greetings
    { match: /\b(hi|hello|hey|howdy|good morning|good afternoon)\b/i,
      reply: 'Hi! 👋 I\'m Premier — PDA\'s assistant. Ask me anything about our RDA program, classes, cost, or funding. Or tap a quick-reply below to get started.' },

    // Thanks
    { match: /\b(thanks|thank you|appreciate)\b/i,
      reply: 'You\'re welcome! Anything else I can help with?' },
  ];

  const QUICK_REPLIES = [
    { label: '💰 How much does it cost?',       q: 'How much does it cost?' },
    { label: '⏱ How long does the program take?', q: 'How long does the program take?' },
    { label: '📅 When\'s the next class?',       q: 'When is the next class?' },
    { label: '💵 Can I pay monthly?',            q: 'Can I pay monthly?' },
    { label: '💰 Can WIOA funding cover it?',  q: 'Can WIOA funding cover my tuition?' },
    { label: '📝 I want to apply',              q: 'I want to apply' },
    { label: '👋 Talk to a real person',        q: 'I want to talk to a human' },
  ];

  function findReply(text) {
    for (const item of KB) if (item.match.test(text)) return item;
    return {
      reply: 'I\'m still learning! For specific questions, Amanda or someone from PDA can help directly.',
      cta: { label: 'Send a message →', href: '/contact' },
    };
  }

  // Style block — scoped
  const STYLE = `
    .ap-launcher { position: fixed; bottom: 22px; right: 22px; z-index: 999; }
    .ap-btn { position: relative; display: inline-flex; align-items: center; gap: 10px; padding: 16px 24px 16px 20px; border-radius: 999px;
      background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%); color: white;
      font-family: Inter, system-ui, sans-serif; font-weight: 800; font-size: 17px; letter-spacing: .2px;
      box-shadow: 0 16px 42px -8px rgba(13,148,136,.7); cursor: pointer; border: 0;
      transition: transform .15s, box-shadow .15s; animation: ap-attn 4s ease-in-out 3s infinite; }
    .ap-btn:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 22px 52px -8px rgba(13,148,136,.85); }
    .ap-btn .ap-tooth { font-size: 27px; }
    @keyframes ap-attn { 0%,90%,100%{transform:none} 93%{transform:translateY(-5px)} 96%{transform:translateY(-1px)} 98%{transform:translateY(-4px)} }

    /* Proactive teaser bubble — invites a stuck visitor to engage + capture intent */
    .ap-teaser { position: fixed; bottom: 96px; right: 22px; z-index: 1001; max-width: 300px;
      background: #fff; border: 1px solid #e2e8f0; border-radius: 16px 16px 4px 16px;
      box-shadow: 0 22px 54px -12px rgba(15,23,42,.45); padding: 14px 14px 13px;
      font-family: Inter, system-ui, sans-serif;
      transform: translateY(10px) scale(.96); opacity: 0; pointer-events: none; transition: all .25s ease-out; }
    .ap-teaser.show { transform: none; opacity: 1; pointer-events: auto; }
    .ap-teaser .ap-tx { display: flex; gap: 9px; align-items: flex-start; }
    .ap-teaser .ap-tt-av { width: 32px; height: 32px; border-radius: 50%; flex: 0 0 32px;
      background: linear-gradient(135deg, #2dd4bf, #38bdf8); display: grid; place-items: center; font-size: 18px; }
    .ap-teaser p { margin: 0; font-size: 13.5px; line-height: 1.45; color: #0f172a; font-weight: 600; padding-right: 12px; }
    .ap-teaser .ap-tt-close { position: absolute; top: 6px; right: 9px; border: 0; background: transparent; color: #94a3b8; font-size: 15px; cursor: pointer; }
    .ap-teaser .ap-tt-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 11px; }
    .ap-teaser .ap-tt-chips button { background: #ecfeff; border: 1px solid #a5f3fc; color: #0e7490; font-size: 12px; font-weight: 600;
      padding: 6px 11px; border-radius: 999px; cursor: pointer; }
    .ap-teaser .ap-tt-chips button:hover { background: #cffafe; }

    /* Inline lead-capture form inside the chat */
    .ap-lead { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px; margin-top: 2px; align-self: flex-start; max-width: 88%; width: 88%; }
    .ap-lead input { width: 100%; box-sizing: border-box; padding: 9px 11px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 13px; margin-bottom: 7px; font-family: inherit; }
    .ap-lead input:focus { outline: none; border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,.15); }
    .ap-lead button { width: 100%; background: #f59e0b; color: #0f172a; font-weight: 800; border: 0; border-radius: 999px; padding: 10px; font-size: 13.5px; cursor: pointer; }
    .ap-lead button:hover { background: #d97706; color: #fff; }
    .ap-btn .ap-pulse { position: absolute; top: 8px; right: 8px; width: 10px; height: 10px;
      background: #f59e0b; border-radius: 999px; box-shadow: 0 0 0 0 rgba(245,158,11,.7);
      animation: ap-pulse 2s infinite; }
    @keyframes ap-pulse { 0%{box-shadow:0 0 0 0 rgba(245,158,11,.7)} 70%{box-shadow:0 0 0 14px rgba(245,158,11,0)} 100%{box-shadow:0 0 0 0 rgba(245,158,11,0)} }

    .ap-panel { position: fixed; bottom: 88px; right: 20px; width: 380px; max-width: calc(100vw - 24px);
      height: 580px; max-height: calc(100vh - 110px); z-index: 1000;
      background: white; border-radius: 18px; box-shadow: 0 24px 60px -10px rgba(15,23,42,.35);
      overflow: hidden; display: flex; flex-direction: column;
      font-family: Inter, system-ui, sans-serif; color: #0f172a;
      transform: translateY(20px) scale(.96); opacity: 0; pointer-events: none; transition: all .2s ease-out; }
    .ap-panel.open { transform: none; opacity: 1; pointer-events: auto; }

    .ap-head { background: linear-gradient(135deg, #0a1226 0%, #0e2049 100%); color: white; padding: 14px 16px;
      display: flex; align-items: center; gap: 10px; }
    .ap-head .ap-avatar { width: 38px; height: 38px; border-radius: 50%;
      background: linear-gradient(135deg, #2dd4bf, #38bdf8); color: #06283d;
      display: grid; place-items: center; font-size: 21px;
      box-shadow: 0 6px 18px -6px rgba(45,212,191,.7); }
    .ap-head h3 { font-weight: 700; font-size: 15px; margin: 0; line-height: 1.2; }
    .ap-head .ap-online { display: inline-block; width: 8px; height: 8px; border-radius: 999px;
      background: #34d399; vertical-align: middle; margin-left: 3px;
      box-shadow: 0 0 0 0 rgba(52,211,153,.7); animation: ap-pulse 2s infinite; }
    .ap-head .ap-sub { font-size: 11px; opacity: .85; margin-top: 1px; }
    .ap-head .ap-close { margin-left: auto; background: transparent; border: 0; color: white; font-size: 20px;
      cursor: pointer; opacity: .8; padding: 4px 8px; }
    .ap-head .ap-close:hover { opacity: 1; }

    /* Instant human contact — text or call, right from the chat */
    .ap-now { display: flex; gap: 8px; padding: 10px 12px; background: #fff; border-bottom: 1px solid #e2e8f0; }
    .ap-now a { flex: 1; text-align: center; text-decoration: none; font-weight: 700; font-size: 12.5px;
      padding: 9px 10px; border-radius: 999px; transition: transform .12s, filter .12s; }
    .ap-now a:hover { transform: translateY(-1px); filter: brightness(1.04); }
    .ap-now .ap-now-text { background: #0d9488; color: #fff; box-shadow: 0 6px 16px -8px rgba(13,148,136,.8); }
    .ap-now .ap-now-call { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; }

    .ap-body { flex: 1; overflow-y: auto; padding: 14px; background: #f8fafc; display: flex; flex-direction: column; gap: 10px; }
    .ap-msg { max-width: 88%; padding: 9px 12px; border-radius: 14px; font-size: 13.5px; line-height: 1.45; white-space: pre-wrap; }
    .ap-msg-bot { align-self: flex-start; background: white; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px; }
    .ap-msg-user { align-self: flex-end; background: #0d9488; color: white; border-bottom-right-radius: 4px; }
    .ap-msg-bot strong { color: #0f172a; font-weight: 600; }
    .ap-msg .ap-cta { display: inline-block; margin-top: 8px; background: #f59e0b; color: #0f172a;
      font-weight: 700; font-size: 12px; padding: 5px 11px; border-radius: 8px; text-decoration: none; }
    .ap-msg .ap-cta:hover { background: #d97706; color: white; }

    .ap-quick { padding: 0 14px 6px; display: flex; gap: 6px; flex-wrap: wrap; background: #f8fafc; }
    .ap-quick button { background: white; border: 1px solid #cffafe; color: #0e7490; font-size: 12px;
      padding: 6px 10px; border-radius: 999px; cursor: pointer; font-weight: 500; }
    .ap-quick button:hover { background: #ecfeff; border-color: #67e8f9; }

    .ap-input { display: flex; padding: 10px 12px; gap: 8px; border-top: 1px solid #e2e8f0; background: white; }
    .ap-input input { flex: 1; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 999px;
      font-size: 13.5px; outline: none; font-family: inherit; }
    .ap-input input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,.15); }
    .ap-input button { background: #0d9488; border: 0; color: white; width: 36px; height: 36px;
      border-radius: 50%; cursor: pointer; font-size: 16px; flex-shrink: 0; }
    .ap-input button:hover { background: #0f766e; }

    .ap-foot { text-align: center; font-size: 10px; color: #94a3b8; padding: 6px; background: #f8fafc; }
    .ap-foot a { color: #0d9488; }

    .ap-typing { display: inline-flex; gap: 3px; padding: 10px 14px; align-self: flex-start;
      background: white; border: 1px solid #e2e8f0; border-radius: 14px; }
    .ap-typing span { width: 6px; height: 6px; background: #cbd5e1; border-radius: 50%; animation: ap-dot 1.4s infinite; }
    .ap-typing span:nth-child(2) { animation-delay: .2s; }
    .ap-typing span:nth-child(3) { animation-delay: .4s; }
    @keyframes ap-dot { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }

    @media (max-width: 480px) {
      .ap-panel { right: 8px; bottom: 84px; width: calc(100vw - 16px); height: calc(100vh - 100px); }
      .ap-launcher { bottom: 12px; right: 12px; }
      .ap-btn .ap-label { display: none; }
      .ap-btn { padding: 14px; }
    }
  `;

  function mount() {
    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.className = 'ap-launcher';
    root.innerHTML = `
      <button class="ap-btn" id="ap-toggle" aria-label="Ask Premier — chat with us">
        <span class="ap-tooth" aria-hidden="true">🦷</span>
        <span class="ap-label">Ask Premier</span>
        <span class="ap-pulse" aria-hidden="true"></span>
      </button>
      <div class="ap-teaser" id="ap-teaser" role="dialog" aria-label="Quick question from Premier">
        <button class="ap-tt-close" id="ap-tt-close" aria-label="Dismiss">✕</button>
        <div class="ap-tx"><div class="ap-tt-av" aria-hidden="true">🦷</div><p>Hey! 👋 Quick question — what brought you to PDA today?</p></div>
        <div class="ap-tt-chips" id="ap-tt-chips"></div>
      </div>
      <div class="ap-panel" id="ap-panel" role="dialog" aria-label="Ask Premier chatbot">
        <div class="ap-head">
          <div class="ap-avatar">🦷</div>
          <div>
            <h3>Ask Premier <span class="ap-online" aria-hidden="true"></span></h3>
            <div class="ap-sub">Instant answers · real team replies fast</div>
          </div>
          <button class="ap-close" id="ap-close" aria-label="Close chat">✕</button>
        </div>
        <div class="ap-now">
          <a class="ap-now-text" href="sms:+19039136444" data-event="chat_text_click">📲 Text us now</a>
          <a class="ap-now-call" href="tel:+19039136444" data-event="call_click">📞 Call (903) 913-6444</a>
        </div>
        <div class="ap-body" id="ap-body"></div>
        <div class="ap-quick" id="ap-quick"></div>
        <form class="ap-input" id="ap-form">
          <input type="text" id="ap-text" placeholder="Type your question…" autocomplete="off" />
          <button type="submit" aria-label="Send">→</button>
        </form>
        <div class="ap-foot">Powered by Premier Dental Academy · <a href="/contact">Reach a human</a></div>
      </div>
    `;
    document.body.appendChild(root);

    const panel = root.querySelector('#ap-panel');
    const body  = root.querySelector('#ap-body');
    const quick = root.querySelector('#ap-quick');
    const form  = root.querySelector('#ap-form');
    const input = root.querySelector('#ap-text');
    const sessionId = 'ap-' + Math.random().toString(36).slice(2, 10);

    function addMsg(text, who) {
      const div = document.createElement('div');
      div.className = 'ap-msg ap-msg-' + who;
      // Convert **bold** + \n -> <strong> + <br>
      const html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
      div.innerHTML = html;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
      logMsg(text, who);
      return div;
    }
    function addCta(href, label) {
      const a = body.lastElementChild;
      if (!a) return;
      const link = document.createElement('a');
      link.className = 'ap-cta'; link.href = href; link.textContent = label;
      if (/^https?:/.test(href)) link.target = '_blank';
      a.appendChild(document.createElement('br'));
      a.appendChild(link);
    }
    function addTyping() {
      const div = document.createElement('div');
      div.className = 'ap-typing';
      div.innerHTML = '<span></span><span></span><span></span>';
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
      return div;
    }
    async function logMsg(text, who) {
      if (!sb) return;
      try {
        await sb.from('chat_messages').insert({
          session_id: sessionId, role: who, content: text, page: location.pathname,
        });
      } catch (e) {}
    }

    function renderQuick() {
      quick.innerHTML = QUICK_REPLIES.map((q, i) => `<button data-i="${i}">${q.label}</button>`).join('');
      quick.querySelectorAll('button').forEach(b => {
        b.onclick = () => respond(QUICK_REPLIES[+b.dataset.i].q);
      });
    }
    function hideQuick() { quick.style.display = 'none'; }
    function showQuick() { quick.style.display = 'flex'; }

    async function respond(userText) {
      addMsg(userText, 'user');
      input.value = '';
      hideQuick();
      const t = addTyping();
      await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
      t.remove();
      const reply = findReply(userText);
      addMsg(reply.reply, 'bot');
      if (reply.cta) addCta(reply.cta.href, reply.cta.label);
      showQuick();
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (text) respond(text);
    });

    // Open/close
    const toggle = root.querySelector('#ap-toggle');
    toggle.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      if (open && body.children.length === 0) {
        addMsg('Hi! 👋 I\'m Premier, PDA\'s assistant. Ask me anything about our RDA program — or tap a quick-reply below.', 'bot');
        renderQuick();
      }
    });
    root.querySelector('#ap-close').addEventListener('click', () => panel.classList.remove('open'));

    // ── Proactive intake: ask why they're here + capture the lead ──────────────
    const REASONS = [
      { label: '🔎 Exploring the career', v: 'Exploring the dental assistant career' },
      { label: '✅ Ready to enroll',       v: 'Ready to enroll' },
      { label: '💰 Cost & funding',        v: 'Cost & funding' },
      { label: '📅 Class dates / timing',  v: 'Class dates and timing' },
      { label: '👀 Just curious',          v: 'Just curious for now' },
    ];
    const teaser = root.querySelector('#ap-teaser');
    const ttChips = root.querySelector('#ap-tt-chips');
    ttChips.innerHTML = REASONS.map((r, i) => `<button data-i="${i}">${r.label}</button>`).join('');
    function dismissTeaser() { teaser.classList.remove('show'); try { sessionStorage.setItem('ap_teaser_done', '1'); } catch (e) {} }
    root.querySelector('#ap-tt-close').addEventListener('click', dismissTeaser);
    toggle.addEventListener('click', () => teaser.classList.remove('show'));
    ttChips.querySelectorAll('button').forEach((b) => {
      b.addEventListener('click', () => {
        const reason = REASONS[+b.dataset.i].v;
        dismissTeaser();
        if (!panel.classList.contains('open')) panel.classList.add('open');
        startIntake(reason);
      });
    });

    function startIntake(reason) {
      hideQuick();
      addMsg(reason, 'user');
      addMsg('Awesome — thanks for telling me! 🙌 Want Amanda to personally follow up with your exact next step? Drop your first name and the best number or email and she\'ll reach out. (Optional — or just keep chatting below.)', 'bot');
      const wrap = document.createElement('div');
      wrap.className = 'ap-lead';
      wrap.innerHTML = '<input id="ap-l-name" placeholder="First name" autocomplete="given-name"><input id="ap-l-contact" placeholder="Phone or email" autocomplete="tel"><button type="button" id="ap-l-send">Send to Amanda →</button>';
      body.appendChild(wrap);
      body.scrollTop = body.scrollHeight;
      wrap.querySelector('#ap-l-send').addEventListener('click', () => {
        const nm = wrap.querySelector('#ap-l-name').value.trim();
        const ct = wrap.querySelector('#ap-l-contact').value.trim();
        if (!ct) { wrap.querySelector('#ap-l-contact').focus(); return; }
        submitLead(nm, ct, reason);
        wrap.remove();
      });
    }

    async function submitLead(name, contact, reason) {
      const rec = { first_name: name || null, source: 'ask-premier', interest_path: reason,
        message: 'Ask Premier intake — ' + reason + ' · page ' + location.pathname };
      if (/@/.test(contact)) rec.email = contact; else rec.phone = contact;
      addMsg((name ? name + ', y' : 'Y') + 'ou\'re all set! 🎉 Amanda or someone from PDA will reach out as quickly as possible. Ask me anything else in the meantime.', 'bot');
      try { if (sb) await sb.from('leads').insert(rec); } catch (e) {}
      showQuick();
    }

    // Show the teaser after a short delay — once per session, only if chat is closed.
    try {
      if (!sessionStorage.getItem('ap_teaser_done')) {
        setTimeout(() => { if (!panel.classList.contains('open')) teaser.classList.add('show'); }, 12000);
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
