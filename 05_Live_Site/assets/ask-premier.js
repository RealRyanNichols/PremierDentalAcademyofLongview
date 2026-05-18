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
      reply: 'Tuition is **$1,997** — same price whether you choose **In-Person** at our Longview campus or **Online** (live from home).\n\nPayment plans available, and we accept TWC vouchers, GI Bill, and WIOA funding.',
      cta: { label: 'See enrollment options →', href: '/enroll' } },

    { match: /\b(how long|duration|weeks|time|months|schedule)\b/i,
      reply: 'Pick the format that fits you:\n• **In-Person** at our Longview campus\n• **Online** — live video classes from anywhere\n\nSame curriculum, same instructors, same certificate. Tap to see class dates.',
      cta: { label: 'See upcoming classes →', href: '/classes' } },

    { match: /\b(when|next class|start|begin|cohort)\b/i,
      reply: 'Our next class starts soon — multiple cohorts each year (May, June, August, September, November). Tap below to see the full schedule and reserve your seat.',
      cta: { label: 'View upcoming classes →', href: '/classes' } },

    { match: /\b(payment|monthly|finance|installment|pay over time|plan)\b/i,
      reply: 'Yes — payment plans are available for the **$1,997** tuition. We also accept **TWC vouchers**, **GI Bill / veterans benefits**, and **WIOA workforce funding**. Apply and we\'ll walk through what fits you.',
      cta: { label: 'Apply →', href: '/apply' } },

    { match: /\b(twc|workforce|wioa|veteran|gi bill|funding|scholarship|grant|fafsa)\b/i,
      reply: 'Yes! We accept **TWC vocational vouchers**, **GI Bill / veterans benefits**, and **WIOA workforce funding**. We help you navigate eligibility — submit a free application and we\'ll get on a call.',
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
      reply: 'Premier Dental Academy was founded by **Amanda Williams** — a 20-year veteran of East Texas dental offices. She started PDA so new RDAs would walk in already fluent in the software, not learning it the hard way.',
      cta: { label: 'Read Amanda\'s story →', href: '/about' } },

    { match: /\b(location|address|where|campus|directions|map)\b/i,
      reply: 'Our campus is at **2800 Gilmer Rd, Suite 106, Longview, TX 75604**. Drop-ins welcome during business hours; tours by appointment.',
      cta: { label: 'Get directions →', href: 'https://maps.google.com/?q=2800+Gilmer+Rd+Suite+106+Longview+TX+75604' } },

    { match: /\b(phone|call|number)\b/i,
      reply: 'Call us at **(903) 913-6444** — Mon–Fri, 9am–6pm CT.',
      cta: { label: '📞 Call now', href: 'tel:+19039136444' } },

    { match: /\b(email|contact|message|reach)\b/i,
      reply: 'Email **hello@PremierDentalAcademyOfLongview.com** — we reply within 1 business day. Or send a message through our contact form.',
      cta: { label: 'Send a message →', href: '/contact' } },

    { match: /\b(refund|money back|guarantee|cancel)\b/i,
      reply: '**14-day full money-back guarantee.** If within the first two weeks you decide it\'s not for you, we refund 100%. No questions. After that, pro-rated by completion percentage.',
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
    { label: '🎖 Do you accept GI Bill / TWC?',  q: 'Do you accept GI Bill or TWC funding?' },
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
    .ap-launcher { position: fixed; bottom: 20px; right: 20px; z-index: 999; }
    .ap-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 18px 12px 14px; border-radius: 999px;
      background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%); color: white;
      font-family: Inter, system-ui, sans-serif; font-weight: 600; font-size: 14px;
      box-shadow: 0 12px 30px -8px rgba(13,148,136,.5); cursor: pointer; border: 0;
      transition: transform .15s; }
    .ap-btn:hover { transform: translateY(-2px); }
    .ap-btn .ap-tooth { font-size: 22px; }
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

    .ap-head { background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%); color: white; padding: 14px 16px;
      display: flex; align-items: center; gap: 10px; }
    .ap-head .ap-avatar { width: 36px; height: 36px; border-radius: 50%; background: white;
      display: grid; place-items: center; font-size: 22px; }
    .ap-head h3 { font-weight: 700; font-size: 15px; margin: 0; line-height: 1.2; }
    .ap-head .ap-sub { font-size: 11px; opacity: .85; margin-top: 1px; }
    .ap-head .ap-close { margin-left: auto; background: transparent; border: 0; color: white; font-size: 20px;
      cursor: pointer; opacity: .8; padding: 4px 8px; }
    .ap-head .ap-close:hover { opacity: 1; }

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
      <div class="ap-panel" id="ap-panel" role="dialog" aria-label="Ask Premier chatbot">
        <div class="ap-head">
          <div class="ap-avatar">🦷</div>
          <div>
            <h3>Ask Premier</h3>
            <div class="ap-sub">Premier Dental Academy · usually replies instantly</div>
          </div>
          <button class="ap-close" id="ap-close" aria-label="Close chat">✕</button>
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
