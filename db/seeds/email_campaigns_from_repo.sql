-- Seed: load the repo's ready-made marketing emails into email_campaigns as DRAFTS.
-- Idempotent (NOT EXISTS on internal_title). status='draft' => never sent by email-worker.
-- Generated from marketing/series/*.html + marketing/email-*.html.

insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 01 · phones-back-on$pda_t$, $pda_t$Our phone was down — it's fixed. Call or text us 📞$pda_t$, $pda_t$We're back on$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">We're back on</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Our phone was down. It's fixed. Call or text us &mdash; you'll get a <span style="color:#0d9488;">real person.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">Quick, honest note: a setting on our phone had quietly switched off, and for a little while it wasn't letting calls or texts come through. So if you reached out and didn't hear back from us &mdash; <strong>that's why, and we're sorry.</strong> It's fixed now.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">Here's our challenge to you: <strong>call us or text us right now.</strong> Don't believe it's fixed? Text Amanda. Call Amanda. You'll reach <strong>Amanda herself &mdash; a real person. Not a robot. Not an AI.</strong></p>
      </td></tr>

      <!-- call / text buttons -->
      <tr><td style="padding:22px 28px 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="50%" style="padding-right:6px;">
            <a href="tel:+19039136444" style="display:block;text-align:center;background:#f59e0b;color:#ffffff;font-size:17px;font-weight:bold;text-decoration:none;padding:15px 10px;border-radius:10px;">📞 Call Amanda</a>
          </td>
          <td width="50%" style="padding-left:6px;">
            <a href="sms:+19039136444?&body=Hi%20Amanda%2C%20just%20testing%20your%20line%20%E2%80%94%20did%20this%20come%20through%3F" style="display:block;text-align:center;background:#0d9488;color:#ffffff;font-size:17px;font-weight:bold;text-decoration:none;padding:15px 10px;border-radius:10px;">💬 Text Amanda</a>
          </td>
        </tr></table>
        <p style="margin:12px 0 0;text-align:center;color:#475569;font-size:15px;">Call or text <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a> &mdash; we answer.</p>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- while we have you: enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">While we have you</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Our next dental-assistant classes are enrolling.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- free interactive tools -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🦷 Free, no-signup practice tools &mdash; try one tonight</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Build a real instrument tray in our Skills Lab, or take a timed practice exam &mdash; right in your browser.</p>
            <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;margin:0 6px 6px 0;">Open the Skills Lab &rarr;</a>
            <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="display:inline-block;background:#ffffff;color:#0e7490;border:1px solid #0e7490;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Try a practice exam &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Premier%20Dental%20Academy%20of%20Longview%20is%20enrolling%20%E2%80%94%20become%20a%20dental%20assistant%20in%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Become%20a%20dental%20assistant%20in%20Longview&body=Thought%20of%20you%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 01 · phones-back-on$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 02 · skills-lab-tray$pda_t$, $pda_t$Set up a dental tray like you already work here (free) 🦷$pda_t$, $pda_t$Free Skills Lab$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Free Skills Lab</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Set up a dental tray like you <span style="color:#0d9488;">already work here</span> &mdash; free, no signup.</h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">Curious what the job actually feels like? Our <strong>Skills Lab tray builder</strong> lets you set up a real dental instrument tray right in your browser &mdash; pick the instruments, lay them out in order, just like you're standing chairside next to the dentist.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">No account, no email, no catch. <strong>Just open it and start arranging.</strong> It's the fastest way to feel whether this career is for you.</p>
      </td></tr>

      <!-- featured interactive TOOL block -->
      <tr><td style="padding:22px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🦷 Build a real instrument tray &mdash; right now, in your browser</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Drag the instruments into place and set up your tray the way a real chairside assistant does. Free, no signup &mdash; try it tonight.</p>
            <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;margin:0 6px 6px 0;">Open the Skills Lab tray builder &rarr;</a>
            <a href="https://www.premierdentalacademyoflongview.com/tools/flashcards" style="display:inline-block;background:#ffffff;color:#0e7490;border:1px solid #0e7490;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Or run the flashcards &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Ready for the real thing?</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Our next dental-assistant classes are enrolling.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">If the tray builder felt good in your hands, the real training will too. Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help at East Texas dental offices when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 4px;">
        <p style="margin:0;text-align:center;color:#475569;font-size:15px;line-height:1.6;">Questions first? Call or text <strong>Amanda</strong> &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a> or <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">text us here</a>.</p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:18px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Try%20this%20free%20%E2%80%94%20build%20a%20dental%20instrument%20tray%20in%20your%20browser%20at%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Fskills-lab" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Set%20up%20a%20dental%20tray%20for%20free%20in%20your%20browser&body=Thought%20of%20you%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%27s%20free%20Skills%20Lab%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Fskills-lab" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 02 · skills-lab-tray$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 03 · salary$pda_t$, $pda_t$What do dental assistants really make in East Texas?$pda_t$, $pda_t$The pay question$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">The pay question</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">What do dental assistants <span style="color:#0d9488;">really make</span> in East Texas?</h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">It's the first thing most people want to know &mdash; and fair enough. Before you spend a dime or a single evening, you should see what this career actually pays around here.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">So we built an <strong>interactive salary page</strong> with real East Texas numbers. Open it, move the sliders, and see for yourself &mdash; we'd rather you check the figures than take our word for it.</p>
      </td></tr>

      <!-- featured interactive TOOL block -->
      <tr><td style="padding:22px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">💵 See the real East Texas pay &mdash; interactive</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Our salary page lets you explore what dental assistants earn near you. No signup &mdash; just open it and look at the numbers yourself.</p>
            <a href="https://www.premierdentalacademyoflongview.com/salary" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;margin:0 6px 6px 0;">See the real pay &rarr;</a>
            <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="display:inline-block;background:#ffffff;color:#0e7490;border:1px solid #0e7490;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Try the Skills Lab &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Like what you see?</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Our next dental-assistant classes are enrolling.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">When the numbers add up, the next step is training that gets you there. Become a Registered Dental Assistant right here in Longview &mdash; hands-on, career-ready fast, with job-placement help at East Texas dental offices when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 4px;">
        <p style="margin:0;text-align:center;color:#475569;font-size:15px;line-height:1.6;">Want the pay picture for your situation? Call or text <strong>Amanda</strong> &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a> or <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">text us here</a>.</p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:18px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone weighing a career change? Pass it on:</p>
        <a href="sms:?&body=See%20what%20dental%20assistants%20really%20earn%20in%20East%20Texas%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Fsalary" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=What%20dental%20assistants%20really%20make%20in%20East%20Texas&body=Thought%20of%20you%20%E2%80%94%20see%20the%20real%20numbers%20at%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Fsalary" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 03 · salary$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 04 · payment-plan$pda_t$, $pda_t$Start for $500 down — here’s how the payments work$pda_t$, $pda_t$How the payments work$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">How the payments work</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Start for <span style="color:#0d9488;">$500 down</span> &mdash; here's exactly how the payments work.</h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">No big lump sum. <strong>$500 down holds your seat</strong>, then you cover the rest with simple weekly or monthly payments &mdash; whatever fits your budget. That's it.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">And if life happens and you change your mind? <strong>Your payment transfers in full</strong> toward another one of our programs &mdash; so your money is never lost. We've tried to make saying "yes" as low-risk as we possibly can.</p>
      </td></tr>

      <!-- featured interactive TOOL block -->
      <tr><td style="padding:22px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">💵 Not sure it's worth it? Check the pay first &mdash; interactive</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Before you put $500 down, see what dental assistants really earn in East Texas on our interactive salary page. No signup &mdash; look at the numbers yourself.</p>
            <a href="https://www.premierdentalacademyoflongview.com/salary" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;margin:0 6px 6px 0;">See the real pay &rarr;</a>
            <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="display:inline-block;background:#ffffff;color:#0e7490;border:1px solid #0e7490;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Try the Skills Lab &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Hold your seat</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Our next dental-assistant classes are enrolling.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, career-ready fast, with job-placement help at East Texas dental offices when you finish. Pick the plan that fits and start today.</p>
      </td></tr>

      <!-- In-Person (primary) -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest &middot; your payment transfers in full if you change your mind.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 4px;">
        <p style="margin:0;text-align:center;color:#475569;font-size:15px;line-height:1.6;">Want to talk through the payments? Call or text <strong>Amanda</strong> &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a> or <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">text us here</a>.</p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:18px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=You%20can%20start%20dental-assistant%20training%20for%20just%20%24500%20down%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Fenroll%3Fplan%3Din-person" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Start%20dental-assistant%20training%20for%20%24500%20down&body=Thought%20of%20you%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%2C%20%24500%20down%20to%20hold%20your%20seat%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Fenroll%3Fplan%3Din-person" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 04 · payment-plan$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 05 · online-anywhere$pda_t$, $pda_t$Can't get to class? Train 100% online for $397$pda_t$, $pda_t$Learn from anywhere$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Learn from anywhere</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Can't get to class? Train to be a dental assistant <span style="color:#0d9488;">100% online.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">Work nights? Kids at home? Live a ways out from Longview? You don't have to put your career on hold. Our <strong>fully online program is self-paced</strong> &mdash; same curriculum as our in-person class, on your schedule, from your couch or your kitchen table.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">Get career-ready fast &mdash; in months, not years &mdash; without rearranging your whole life to do it.</p>
      </td></tr>

      <!-- featured tool: flashcards -->
      <tr><td style="padding:22px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🦷 Free, no-signup flashcards &mdash; study tonight from anywhere</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Want to see how online learning feels? Run our free flashcard trainer right in your browser &mdash; drill the terms, tools, and tooth names dental assistants use every day. No login, no download.</p>
            <a href="https://www.premierdentalacademyoflongview.com/tools/flashcards" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;margin:0 6px 6px 0;">Open the Flashcards &rarr;</a>
            <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="display:inline-block;background:#ffffff;color:#0e7490;border:1px solid #0e7490;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Try a practice exam &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Ready to start</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Pick the way that fits your life.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Same path to becoming a Registered Dental Assistant &mdash; learn fully online, or come hands-on in Longview. Either way, we're with you.</p>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online and self-paced. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training with job-placement help. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:22px 28px 6px;">
        <p style="margin:0;text-align:center;color:#475569;font-size:15px;line-height:1.6;">Not sure which fits? Call or text <strong>Amanda &mdash; a real person, not an AI</strong> &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a>. <a href="sms:+19039136444?&body=Hi%20Amanda%2C%20I%27m%20interested%20in%20the%20online%20dental-assistant%20program." style="color:#0d9488;font-weight:bold;text-decoration:none;">Text us here.</a></p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Premier%20Dental%20Academy%20of%20Longview%20has%20a%20100%25%20online%20dental-assistant%20program%20%E2%80%94%20learn%20from%20anywhere%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Become%20a%20dental%20assistant%20%E2%80%94%20100%25%20online&body=Thought%20of%20you%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%20has%20a%20fully%20online%20program%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 05 · online-anywhere$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 06 · tooth-chart$pda_t$, $pda_t$Chart teeth like a pro — try our free trainer$pda_t$, $pda_t$Try it free$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Try it free</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Chart teeth like a pro &mdash; try our <span style="color:#0d9488;">free charting trainer.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">Charting is one of the first real skills a dental assistant uses every single day &mdash; and you can practice it right now. Our free <strong>PDA Practice Pro</strong> trainer lets you chart teeth on a real anatomical tooth chart, just like you would in a working dental office.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">No signup, no download. Open it in your browser and give it a try &mdash; it's a real taste of the work, and it's a lot of fun.</p>
      </td></tr>

      <!-- featured tool: practice pro -->
      <tr><td style="padding:22px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🦷 PDA Practice Pro &mdash; chart teeth like you would in the office</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Click into the tooth chart, mark surfaces and findings, and get the feel of real charting &mdash; free, in your browser. New to it? Start with our plain-English beginner guide and you'll be charting in minutes.</p>
            <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;margin:0 6px 6px 0;">Open the charting trainer &rarr;</a>
            <a href="https://www.premierdentalacademyoflongview.com/tools/how-to-chart" style="display:inline-block;background:#ffffff;color:#0e7490;border:1px solid #0e7490;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Read the beginner guide &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Ready for the real thing</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Liked charting? Make it your career.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help when you finish. Or learn the same curriculum fully online.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training with job-placement help. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online and self-paced. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:22px 28px 6px;">
        <p style="margin:0;text-align:center;color:#475569;font-size:15px;line-height:1.6;">Questions about charting or class? Call or text <strong>Amanda &mdash; a real person, not an AI</strong> &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a>. <a href="sms:+19039136444?&body=Hi%20Amanda%2C%20I%20tried%20the%20charting%20trainer%20and%20have%20a%20question%20about%20class." style="color:#0d9488;font-weight:bold;text-decoration:none;">Text us here.</a></p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Try%20this%20free%20tooth-charting%20trainer%20from%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Ftools%2Fpractice-pro" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Free%20tooth-charting%20trainer&body=Thought%20of%20you%20%E2%80%94%20a%20free%20charting%20trainer%20from%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Ftools%2Fpractice-pro" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 06 · tooth-chart$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 07 · day-in-the-life$pda_t$, $pda_t$What's a day really like as a dental assistant?$pda_t$, $pda_t$A day in the life$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">A day in the life</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">What's a day <span style="color:#0d9488;">really like</span> as a dental assistant?</h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">Picture it. You walk in, greet your first patient by name, and help them settle into the chair. You set up a clean tray, hand the dentist the right instrument at the right moment, snap the X-rays, and keep things moving so the whole office runs smoother because <strong>you're</strong> there.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">It's steady, hands-on work alongside the dentist &mdash; not stuck behind a desk. People feel calmer because you're calm. That's a good day, and it's a real career you can start right here in East Texas.</p>
      </td></tr>

      <!-- featured tool: Skills Lab -->
      <tr><td style="padding:22px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🦷 Try the job before you enroll &mdash; free Skills Lab</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Curious if this is for you? Step into our free, no-signup Skills Lab and build a real instrument tray right in your browser. It's the closest thing to standing chairside &mdash; see how it feels in a few minutes.</p>
            <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Open the free Skills Lab &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Ready to start?</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Make that day yours. Our dental-assistant classes are enrolling.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant in months, not years &mdash; hands-on training with job-placement help at East Texas dental offices when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 0;">
        <p style="margin:0;text-align:center;color:#475569;font-size:15px;line-height:1.6;">Have a question first? Call or text Amanda &mdash; a real person, not an AI &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a>. <a href="sms:+19039136444?&body=Hi%20Amanda%2C%20I%20have%20a%20question%20about%20becoming%20a%20dental%20assistant." style="color:#0d9488;font-weight:bold;text-decoration:none;">Text us &rarr;</a></p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Premier%20Dental%20Academy%20of%20Longview%20is%20enrolling%20%E2%80%94%20become%20a%20dental%20assistant%20in%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Become%20a%20dental%20assistant%20in%20Longview&body=Thought%20of%20you%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 07 · day-in-the-life$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 08 · practice-exam$pda_t$, $pda_t$Think you could pass the dental-assistant exam? Try it free$pda_t$, $pda_t$Pop quiz$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Pop quiz</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Think you could pass the dental-assistant exam? <span style="color:#0d9488;">Try it free.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">Here's a fun way to find out where you stand: take our <strong>free, timed mock exam</strong> right in your browser. It's our practice run &mdash; the same kind of questions, the same ticking clock, no signup and no cost.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">Some folks surprise themselves and crush it. Others find out exactly what to study. Either way, you'll know more than you did five minutes ago &mdash; and that's the whole point.</p>
      </td></tr>

      <!-- featured tool: Practice Exam -->
      <tr><td style="padding:22px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🦷 Free timed practice exam &mdash; take the challenge</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Set the timer, answer the questions, see your score. It's free, no signup &mdash; a low-stakes way to test yourself today. (For the real state exam's official rules and requirements, always check the Texas board.)</p>
            <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Take the free practice exam &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Want to be ready for real?</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">We'll get you exam-ready &mdash; and career-ready fast.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant in months, not years &mdash; hands-on training with job-placement help at East Texas dental offices when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 0;">
        <p style="margin:0;text-align:center;color:#475569;font-size:15px;line-height:1.6;">Stuck on a question or want to talk it through? Call or text Amanda &mdash; a real person, not an AI &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a>. <a href="sms:+19039136444?&body=Hi%20Amanda%2C%20I%20just%20tried%20the%20practice%20exam%20%E2%80%94%20can%20you%20tell%20me%20more%3F" style="color:#0d9488;font-weight:bold;text-decoration:none;">Text us &rarr;</a></p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd ace this? Challenge them:</p>
        <a href="sms:?&body=Bet%20you%20can%27t%20pass%20this%20free%20dental-assistant%20practice%20exam%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Ftools%2Fpractice-exam" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Can%20you%20pass%20this%20dental-assistant%20practice%20exam%3F&body=Try%20the%20free%20timed%20practice%20exam%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Ftools%2Fpractice-exam" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 08 · practice-exam$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 09 · offices-hiring$pda_t$, $pda_t$East Texas offices are hiring — and they call us$pda_t$, $pda_t$There's real demand$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">There's real demand</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">East Texas dental offices are hiring &mdash; and <span style="color:#0d9488;">they call us.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">Here's something people don't always know: dental offices around East Texas need trained dental assistants, and when they're short-handed, a lot of them reach out to us looking for good people. There's steady demand for folks who are ready to work chairside.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">That's the whole point of what we do. We train you for the job &mdash; then we help connect you with East Texas dental offices when you finish. You don't have to figure out the hiring part alone.</p>
      </td></tr>

      <!-- featured link: graduates -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🎓 See where this can take you</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Meet our graduates and see what becoming a Registered Dental Assistant in Longview actually looks like &mdash; and the kind of work that's waiting once you're trained.</p>
            <a href="https://www.premierdentalacademyoflongview.com/graduates" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Meet our graduates &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Get ready to be hired</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Our next dental-assistant classes are enrolling.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help connecting you to East Texas dental offices when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td align="center" style="padding:20px 28px 4px;">
        <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">Questions about which path fits you? Call or text Amanda &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a>. <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">Text us here.</a></p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:18px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=East%20Texas%20dental%20offices%20are%20hiring%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%20trains%20dental%20assistants%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Become%20a%20dental%20assistant%20in%20Longview&body=East%20Texas%20offices%20are%20hiring%20%E2%80%94%20thought%20of%20you.%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 09 · offices-hiring$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 10 · resume-builder$pda_t$, $pda_t$Build your dental-assistant résumé free$pda_t$, $pda_t$Free tool inside$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Free tool inside</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Build a dental-assistant résumé that <span style="color:#0d9488;">gets callbacks</span> &mdash; free.</h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">A good résumé can be the difference between a callback and silence. So we built a free, interactive résumé builder made specifically for dental-assistant jobs &mdash; it walks you through what offices actually want to see.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">No signup, no cost. Fill in your info, and it puts together a clean, professional résumé you can hand to a hiring office right here in East Texas.</p>
      </td></tr>

      <!-- featured tool: résumé builder -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">📝 Free interactive résumé builder &mdash; try it tonight</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Built for dental-assistant jobs, right in your browser. No account needed &mdash; start now and have a polished résumé in minutes.</p>
            <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Open the résumé builder &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Give it something to say</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">A résumé is even stronger with real training behind it.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help when you finish. That's the credential that makes a résumé stand out.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td align="center" style="padding:20px 28px 4px;">
        <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">Want a hand with your résumé or picking a class? Call or text Amanda &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a>. <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">Text us here.</a></p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:18px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone job-hunting? Pass it on:</p>
        <a href="sms:?&body=Free%20dental-assistant%20r%C3%A9sum%C3%A9%20builder%20from%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Ftools%2Fresume-builder" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Free%20dental-assistant%20r%C3%A9sum%C3%A9%20builder&body=Thought%20of%20you%20%E2%80%94%20free%20r%C3%A9sum%C3%A9%20builder%20for%20dental-assistant%20jobs%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Ftools%2Fresume-builder" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 10 · resume-builder$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 11 · funding$pda_t$, $pda_t$Veteran or qualify for funding? You may train for $0$pda_t$, $pda_t$Worth checking$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Worth checking</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Veteran or qualify for workforce funding? You <span style="color:#0d9488;">may train for $0.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">Cost holds a lot of people back &mdash; but it may not have to. Depending on your situation, you <strong>may be able to</strong> cover your training through workforce funding or veteran benefits, and some folks may qualify for little to nothing out of pocket.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">We can't promise approval &mdash; every program decides that on its own &mdash; but it costs nothing to find out if <strong>you may qualify.</strong> Take a couple minutes to apply, and we'll help you figure out your options.</p>
      </td></tr>

      <!-- featured button: apply for funding -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">💵 See if you may qualify &mdash; start here</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Apply to find out whether workforce funding or veteran benefits may cover your dental-assistant training. Quick, free, and no obligation.</p>
            <a href="https://www.premierdentalacademyoflongview.com/apply" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Apply for funding &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Ready to enroll?</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">However you pay, our next classes are enrolling.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help when you finish. Pay your own way or check on funding &mdash; either path starts the same place.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td align="center" style="padding:20px 28px 4px;">
        <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">Not sure if funding fits your situation? Call or text Amanda &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a>. <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">Text us here.</a></p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:18px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know a veteran or someone who could use this? Pass it on:</p>
        <a href="sms:?&body=You%20may%20qualify%20to%20train%20as%20a%20dental%20assistant%20for%20%240%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Fapply" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=You%20may%20qualify%20to%20train%20for%20%240&body=Thought%20of%20you%20%E2%80%94%20you%20may%20qualify%20for%20funding%20or%20veteran%20benefits%20at%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Fapply" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 11 · funding$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 12 · evening-classes$pda_t$, $pda_t$Keep your job — train on your own schedule$pda_t$, $pda_t$Keep your paycheck$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Keep your paycheck</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Keep your job. Change your career. <span style="color:#0d9488;">Train on your own schedule.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">You don't have to quit your job to train for a new one. Our <strong>100% online program is self-paced</strong>, so you can study before work, on a lunch break, or after the kids are down &mdash; and keep the income you count on while you do it.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">Prefer to be in the room? Our in-person classes in Longview are <strong>daytime</strong> &mdash; call or text <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a> for the current class days and times. Either way you become a Registered Dental Assistant in <strong>months, not years</strong>, with job-placement help when you finish.</p>
      </td></tr>

      <!-- featured tool/link block -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🦷 See what the training feels like &mdash; free, no signup</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Open our Skills Lab and build a real instrument tray right in your browser. It's the same kind of hands-on work you'll do in the course &mdash; try it tonight after dinner.</p>
            <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;margin:0 6px 6px 0;">Open the Skills Lab &rarr;</a>
            <a href="https://www.premierdentalacademyoflongview.com/classes" style="display:inline-block;background:#ffffff;color:#0e7490;border:1px solid #0e7490;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">See class details &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Two ways to start</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Pick the path that fits your week.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Learn fully online at your own pace, or come in for daytime classes in Longview &mdash; same curriculum either way.</p>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, keep your paycheck</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace &mdash; the easiest way to train without touching your work hours. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training on a set daytime schedule. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call or text Amanda -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0;text-align:center;color:#475569;font-size:15px;line-height:1.6;">Not sure which path fits your schedule? <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">Call</a> or <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">text Amanda</a> at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a> &mdash; a real person who'll help you figure it out.</p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:18px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Premier%20Dental%20Academy%20of%20Longview%20lets%20you%20train%20as%20a%20dental%20assistant%20on%20your%20own%20schedule%20%E2%80%94%20keep%20your%20job%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Train%20as%20a%20dental%20assistant%20on%20your%20own%20schedule&body=Thought%20of%20you%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%20lets%20you%20train%20online%20at%20your%20own%20pace%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->

      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 12 · evening-classes$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 13 · no-experience-faq$pda_t$, $pda_t$No experience? No degree? The honest answer.$pda_t$, $pda_t$The honest answer$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">The honest answer</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">No experience? No degree? <span style="color:#0d9488;">Here's the honest answer.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">This is the question we hear most: <em>"Can I really do this if I've never set foot in a dental office?"</em> The honest answer is <strong>yes.</strong> You don't need experience and you don't need a degree to start. That's exactly who this program is built for.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">Complete beginners do well here all the time. We teach you the skills step by step, hands-on, and you become career-ready in <strong>months, not years.</strong> What you bring is the willingness to show up &mdash; we'll handle the rest.</p>
      </td></tr>

      <!-- featured tool block -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🦷 Don't take our word for it &mdash; prove it to yourself, free</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Try our Skills Lab or take a timed practice exam right now &mdash; no signup, right in your browser. Go in knowing nothing. You'll be surprised how much makes sense by the end. That's the whole point: this is learnable.</p>
            <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;margin:0 6px 6px 0;">Open the Skills Lab &rarr;</a>
            <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="display:inline-block;background:#ffffff;color:#0e7490;border:1px solid #0e7490;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Try a practice exam &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Ready to start fresh</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Begin as a beginner. Finish career-ready.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant in Longview &mdash; with job-placement help when you finish. Pick the path that fits you.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training built for first-timers. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call or text Amanda -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0;text-align:center;color:#475569;font-size:15px;line-height:1.6;">Still nervous about starting with zero experience? <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">Call</a> or <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">text Amanda</a> at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a> &mdash; a real person who's helped a lot of beginners begin.</p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:18px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who thinks they "can't"? Pass it on:</p>
        <a href="sms:?&body=No%20experience%20needed%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%20trains%20beginners%20to%20become%20dental%20assistants%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=No%20experience%20needed%20to%20become%20a%20dental%20assistant&body=Thought%20of%20you%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%20trains%20complete%20beginners%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 13 · no-experience-faq$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 14 · last-call$pda_t$, $pda_t$Seats are filling for our next class — let's talk$pda_t$, $pda_t$Let's talk$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Let's talk</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Seats are filling for our next class &mdash; <span style="color:#0d9488;">let's talk.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">No countdown, no pressure &mdash; just an honest heads-up: our classes fill up, and seats for the next one are going. If you've been thinking about it, now's a good time to start a conversation so you don't miss the group you wanted.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">The easiest first step isn't a form &mdash; it's a quick call or text to <strong>Amanda, a real person</strong>, who can answer your questions and help you pick a class that fits.</p>
      </td></tr>

      <!-- featured calendar link block -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🗓️ See our upcoming classes</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Take a look at the calendar of upcoming classes and find the start date that works for you &mdash; then let's get you a seat.</p>
            <a href="https://www.premierdentalacademyoflongview.com/calendar" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">View the class calendar &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- prominent call / text block -->
      <tr><td style="padding:22px 28px 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="50%" style="padding-right:6px;">
            <a href="tel:+19039136444" style="display:block;text-align:center;background:#f59e0b;color:#ffffff;font-size:17px;font-weight:bold;text-decoration:none;padding:15px 10px;border-radius:10px;">📞 Call Amanda</a>
          </td>
          <td width="50%" style="padding-left:6px;">
            <a href="sms:+19039136444?&body=Hi%20Amanda%2C%20I'd%20like%20to%20talk%20about%20a%20seat%20in%20your%20next%20class." style="display:block;text-align:center;background:#0d9488;color:#ffffff;font-size:17px;font-weight:bold;text-decoration:none;padding:15px 10px;border-radius:10px;">💬 Text Amanda</a>
          </td>
        </tr></table>
        <p style="margin:12px 0 0;text-align:center;color:#475569;font-size:15px;">Call or text <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a> &mdash; a real person, and we answer.</p>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Or save your seat now</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Ready to claim a spot? Enroll today.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant in Longview &mdash; in months, not years, with job-placement help when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Seats%20are%20filling%20for%20the%20next%20class%20at%20Premier%20Dental%20Academy%20of%20Longview%20%E2%80%94%20become%20a%20dental%20assistant%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Seats%20are%20filling%20%E2%80%94%20become%20a%20dental%20assistant%20in%20Longview&body=Thought%20of%20you%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview's%20next%20class%20is%20filling%20up%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 14 · last-call$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 15 · graduate-success$pda_t$, $pda_t$Where our graduates are now$pda_t$, $pda_t$Real careers$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Real careers</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Where our graduates are <span style="color:#0d9488;">now.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">Here's the part that makes this worth it: our graduates are out there working in real dental offices &mdash; in chairs right here in East Texas and beyond. They sit chairside, take x-rays, set up trays, and help patients feel taken care of.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">They came in nervous, did the hands-on work, and walked out into steady, people-facing careers. That's the whole point of what we do &mdash; and it could be you next.</p>
      </td></tr>

      <!-- featured link: graduates -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🎓 See where our graduates landed</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Real offices, real chairs, real careers. Take a look at the kind of work our graduates are doing every day.</p>
            <a href="https://www.premierdentalacademyoflongview.com/graduates" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Meet our graduates &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Your turn</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Start the path to your own dental-assistant career.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 0;" align="center">
        <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">Questions about where this can take you? Call or text Amanda &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a> or <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">text us here</a>.</p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Premier%20Dental%20Academy%20of%20Longview%20is%20enrolling%20%E2%80%94%20become%20a%20dental%20assistant%20in%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Become%20a%20dental%20assistant%20in%20Longview&body=Thought%20of%20you%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 15 · graduate-success$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 16 · day-shift-sim$pda_t$, $pda_t$Run a full day at a dental office — free simulator$pda_t$, $pda_t$Free Skills Lab$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Free Skills Lab</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Run a full day at a dental office &mdash; <span style="color:#0d9488;">free simulator.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">Ever wondered what a real day in the chair feels like? Now you can try it before you ever set foot on campus. Our new <strong>"Day Shift"</strong> simulator lets you run a full day at a dental office &mdash; right in your browser.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">Greet patients, set up the operatory, work through appointments, and see how a busy day flows. No signup, no cost &mdash; just open it and play.</p>
      </td></tr>

      <!-- featured tool: day shift -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🦷 Free, no-signup simulator &mdash; try it tonight</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Step into a virtual dental office and run a full day, start to finish. It's the closest thing to being chairside without leaving your couch.</p>
            <a href="https://www.premierdentalacademyoflongview.com/skills-lab/day-shift" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;margin:0 6px 6px 0;">Run the Day Shift &rarr;</a>
            <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="display:inline-block;background:#ffffff;color:#0e7490;border:1px solid #0e7490;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">See all free tools &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Ready for the real thing?</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Turn a practice day into a real career.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 0;" align="center">
        <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">Got questions after you try it? Call or text Amanda &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a> or <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">text us here</a>.</p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Premier%20Dental%20Academy%20of%20Longview%20is%20enrolling%20%E2%80%94%20become%20a%20dental%20assistant%20in%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Become%20a%20dental%20assistant%20in%20Longview&body=Thought%20of%20you%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 16 · day-shift-sim$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 17 · why-pda$pda_t$, $pda_t$Why students choose Premier Dental Academy$pda_t$, $pda_t$What sets us apart$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">What sets us apart</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Why students choose <span style="color:#0d9488;">Premier Dental Academy.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">There's a real reason folks pick us. We're hands-on from day one &mdash; you learn by doing, not just reading. You train on the same software real dental offices use, so you walk in ready, not lost.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">We're right here in Longview &mdash; a local campus with daytime classes, plus a 100% online self-paced option that fits around your life. And you're never on your own: we support you through the program and help you find work when you finish.</p>
      </td></tr>

      <!-- featured link: about -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">👋 Get to know us</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">See who we are, how we teach, and why the hands-on, local approach makes such a difference for our students.</p>
            <a href="https://www.premierdentalacademyoflongview.com/about" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Learn about PDA &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Come join us</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Our next dental-assistant classes are enrolling.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 0;" align="center">
        <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">Want to talk it through first? Call or text Amanda &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a> or <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">text us here</a>.</p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Premier%20Dental%20Academy%20of%20Longview%20is%20enrolling%20%E2%80%94%20become%20a%20dental%20assistant%20in%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Become%20a%20dental%20assistant%20in%20Longview&body=Thought%20of%20you%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 17 · why-pda$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 18 · split-pay$pda_t$, $pda_t$Split it into easy payments — Klarna, Afterpay, Affirm$pda_t$, $pda_t$Easy payments$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Easy payments</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Split it into easy payments &mdash; <span style="color:#0d9488;">Klarna, Afterpay, or Affirm.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">Money shouldn't be the thing that holds you back. <strong>$500 down holds your seat</strong> &mdash; then you finish it off with simple weekly or monthly payments that fit your budget.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">Want to spread it out even further? You can also split it with <strong>Klarna, Afterpay, or Affirm</strong> right at checkout. And if you ever change your mind, your payment transfers in full.</p>
      </td></tr>

      <!-- featured / primary: enroll in-person -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">💳 Pick the plan that fits your budget</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Start with just $500 down, then weekly or monthly payments &mdash; or split it with Klarna, Afterpay, or Affirm. It's all right there when you enroll.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">See your payment options &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Hold your seat</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Start today &mdash; pay your way.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; weekly or monthly payments &middot; or split with Klarna, Afterpay, or Affirm.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 0;" align="center">
        <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">Not sure which plan fits? Call or text Amanda &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a> or <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">text us here</a>.</p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Premier%20Dental%20Academy%20of%20Longview%20is%20enrolling%20%E2%80%94%20become%20a%20dental%20assistant%20in%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Become%20a%20dental%20assistant%20in%20Longview&body=Thought%20of%20you%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 18 · split-pay$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 19 · how-to-chart$pda_t$, $pda_t$New to tooth charting? Start here — free$pda_t$, $pda_t$Start from zero$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Start from zero</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">New to tooth charting? <span style="color:#0d9488;">Start here &mdash; free.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">If a tooth chart looks like a wall of numbers and symbols right now, that's completely normal. Everybody starts there. The good news: charting is a skill anybody can learn &mdash; one small step at a time.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">So we built a <strong>free beginner trainer</strong> that walks you through it gently &mdash; what the numbers mean, what the symbols mean, and how it all fits together. No signup, no pressure. Just open it and learn.</p>
      </td></tr>

      <!-- featured tool -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🦷 How to Chart &mdash; the gentle, free beginner trainer</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Learn tooth charting from the ground up, right in your browser. When you're feeling confident, jump into Practice Pro and chart on a real-looking tooth chart.</p>
            <a href="https://www.premierdentalacademyoflongview.com/tools/how-to-chart" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;margin:0 6px 6px 0;">Start the charting trainer &rarr;</a>
            <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="display:inline-block;background:#ffffff;color:#0e7490;border:1px solid #0e7490;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Try Practice Pro &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">When you're ready for the real thing</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Charting is one piece &mdash; we'll teach you all of it.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 0;" align="center">
        <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">Stuck on something? Call or text <strong>Amanda</strong> &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a>. <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">Text us here.</a></p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Free%20tooth-charting%20trainer%20from%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Ftools%2Fhow-to-chart" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Learn%20tooth%20charting%20for%20free&body=Thought%20of%20you%20%E2%80%94%20a%20free%20beginner%20charting%20trainer%20from%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Ftools%2Fhow-to-chart" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 19 · how-to-chart$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 20 · front-desk$pda_t$, $pda_t$Run a real dental front desk — practice free$pda_t$, $pda_t$Hands-on the front desk$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Hands-on the front desk</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Run a real dental front desk &mdash; <span style="color:#0d9488;">practice free.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">A dental office runs on more than the chair. There's the schedule to manage, the ledger to keep straight, and insurance claims to send out &mdash; and offices love an assistant who can step in and handle it.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">In <strong>PDA Practice Pro</strong> you can practice all of it &mdash; booking appointments, posting to the ledger, and working claims &mdash; in a safe, free sandbox. Make mistakes here so you walk in confident on day one.</p>
      </td></tr>

      <!-- featured tool -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🦷 PDA Practice Pro &mdash; the front-desk simulator</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Practice scheduling, the patient ledger, and insurance claims the way a real office works &mdash; right in your browser. No signup, no cost.</p>
            <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Open Practice Pro &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Make it your career</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Our dental-assistant classes are enrolling.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 0;" align="center">
        <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">Questions about classes? Call or text <strong>Amanda</strong> &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a>. <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">Text us here.</a></p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Practice%20running%20a%20real%20dental%20front%20desk%20free%20at%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Ftools%2Fpractice-pro" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Practice%20a%20dental%20front%20desk%20for%20free&body=Thought%20of%20you%20%E2%80%94%20PDA%20Practice%20Pro%20from%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Ftools%2Fpractice-pro" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 20 · front-desk$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 21 · flashcards$pda_t$, $pda_t$Master dental terms in 10 minutes a day (free)$pda_t$, $pda_t$Small reps, big results$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Small reps, big results</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Master dental terms in <span style="color:#0d9488;">10 minutes a day</span> (free).</h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">The vocabulary is half the battle. Once the words click &mdash; the tooth names, the surfaces, the instruments &mdash; everything else gets easier, and you sound like you belong in the room.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">Our <strong>free flashcards</strong> make it stick with quick daily reps. Ten minutes on the couch, in the car line, on a break &mdash; that's all it takes. No signup, no cost.</p>
      </td></tr>

      <!-- featured tool -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🦷 Free dental-terminology flashcards</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Flip through the terms you'll use every day on the job &mdash; right in your browser. Do a quick set tonight and watch it start to stick.</p>
            <a href="https://www.premierdentalacademyoflongview.com/tools/flashcards" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Open the flashcards &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Ready for the whole picture</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Turn those terms into a career.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 0;" align="center">
        <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">Want to talk it through? Call or text <strong>Amanda</strong> &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a>. <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">Text us here.</a></p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Free%20dental-terminology%20flashcards%20from%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Ftools%2Fflashcards" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Free%20dental%20flashcards&body=Thought%20of%20you%20%E2%80%94%20free%20dental-terminology%20flashcards%20from%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Ftools%2Fflashcards" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 21 · flashcards$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 22 · employers-hire$pda_t$, $pda_t$Why East Texas offices hire our graduates$pda_t$, $pda_t$Built for local offices$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Built for local offices</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Why East Texas offices <span style="color:#0d9488;">hire our graduates.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">Dental offices around East Texas need assistants who are ready to work &mdash; people who can chart, set a tray, run the front desk, and treat patients with care from the first day.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">That's exactly what we train for. Our program is built around what local offices actually want, so our graduates walk in prepared &mdash; not still learning the basics. And when you finish, we help you connect with offices that are hiring.</p>
      </td></tr>

      <!-- featured link -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🦷 For employers &mdash; and for you</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">See how we partner with East Texas dental offices and prepare graduates they're glad to hire. It's a good read whether you're a future student or an office looking for help.</p>
            <a href="https://www.premierdentalacademyoflongview.com/employers" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">See how we work with offices &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Be the one they hire</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Get the training offices look for.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 0;" align="center">
        <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">Curious about hiring or enrolling? Call or text <strong>Amanda</strong> &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a>. <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">Text us here.</a></p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=East%20Texas%20offices%20hire%20Premier%20Dental%20Academy%20of%20Longview%20graduates%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Femployers" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=East%20Texas%20offices%20hire%20our%20grads&body=Thought%20of%20you%20%E2%80%94%20see%20how%20East%20Texas%20offices%20hire%20Premier%20Dental%20Academy%20of%20Longview%20graduates%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Femployers" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 22 · employers-hire$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 23 · night-class$pda_t$, $pda_t$Train on your own time, keep your paycheck$pda_t$, $pda_t$Keep your paycheck$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Keep your paycheck</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Train on your own time, <span style="color:#0d9488;">keep your paycheck.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">You don't have to quit your job to change your life. Our <strong>100% online program is self-paced</strong> &mdash; learn around your shifts, keep the income you count on, and move at whatever pace your week allows.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">Same hands-on curriculum, in months not years, with job-placement help when you finish. Want to be in the room instead? In-person classes in Longview run in the <strong>daytime</strong> &mdash; call or text <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a> for the current days and times.</p>
      </td></tr>

      <!-- featured link -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🦷 See how the program works</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Get the details on both paths &mdash; the self-paced online course and the daytime in-person class in Longview &mdash; so you can pick the one that fits the job you already have.</p>
            <a href="https://www.premierdentalacademyoflongview.com/classes" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">See how it works &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Start today</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Begin your next chapter &mdash; on your schedule.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant &mdash; on a schedule that keeps your paycheck coming.</p>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, keep your paycheck</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace &mdash; the easiest way to train without touching your work hours. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training on a set daytime schedule. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 0;" align="center">
        <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">Wondering which path fits your schedule? Call or text <strong>Amanda</strong> &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a>. <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">Text us here.</a></p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Train%20as%20a%20dental%20assistant%20on%20your%20own%20schedule%20%E2%80%94%20keep%20your%20job%20while%20you%20train%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Fclasses" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Train%20on%20your%20own%20time%2C%20keep%20your%20paycheck&body=Thought%20of%20you%20%E2%80%94%20self-paced%20dental-assistant%20training%20at%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com%2Fclasses" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->

      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 23 · night-class$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 24 · how-long-faq$pda_t$, $pda_t$How long does it take to become a dental assistant?$pda_t$, $pda_t$The honest answer$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">The honest answer</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">How long does it take to become a <span style="color:#0d9488;">dental assistant?</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">This is the question we hear most, so here's the straight answer: it's measured in <strong>months, not years.</strong> This isn't a four-year degree. It's focused training that gets you ready to work in a real dental office.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">And here's the part people are surprised by: <strong>you don't need a college degree, and you don't need any experience.</strong> Plenty of our folks started with zero background in dentistry. If you're caring, dependable, and ready to learn, you can do this.</p>
      </td></tr>

      <!-- featured: see the classes -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">📚 See exactly what you'll learn</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Want the details on timing, what's covered, and how the program runs? It's all laid out on our classes page &mdash; no sign-up needed.</p>
            <a href="https://www.premierdentalacademyoflongview.com/classes" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">See the classes &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Ready when you are</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Two simple ways to start.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 0;">
        <p style="margin:0;text-align:center;color:#475569;font-size:15px;line-height:1.6;">Got a question first? Call or text Amanda &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a> or <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">text us here</a>.</p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Premier%20Dental%20Academy%20of%20Longview%20is%20enrolling%20%E2%80%94%20become%20a%20dental%20assistant%20in%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Become%20a%20dental%20assistant%20in%20Longview&body=Thought%20of%20you%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 24 · how-long-faq$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 25 · radiology$pda_t$, $pda_t$Dental X-rays made simple — test yourself free$pda_t$, $pda_t$Radiology, demystified$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Radiology, demystified</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Dental X-rays made simple &mdash; <span style="color:#0d9488;">test yourself free.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">Dental X-rays sound intimidating, but they don't have to be. Once you understand the why behind each step &mdash; positioning, safety, reading what's on the film &mdash; it clicks. Taking good radiographs is one of the most useful skills a dental assistant brings to the team.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">Want to see where you stand right now? <strong>Take a free radiology quiz</strong> &mdash; no signup, right in your browser. It's a low-pressure way to learn what you already know and what to brush up on.</p>
      </td></tr>

      <!-- featured tool: quizzes -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🦷 Free quizzes &mdash; test yourself in minutes</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Quick, no-signup quizzes in our Skills Lab. Check your X-ray and dental knowledge tonight &mdash; then explore the rest of the lab.</p>
            <a href="https://www.premierdentalacademyoflongview.com/skills-lab/quizzes" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;margin:0 6px 6px 0;">Take a free quiz &rarr;</a>
            <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="display:inline-block;background:#ffffff;color:#0e7490;border:1px solid #0e7490;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Open the Skills Lab &rarr;</a>
          </td></tr>
        </table>
        <p style="margin:12px 0 0;color:#64748b;font-size:13px;line-height:1.6;">A note on certification: exam and state rules vary, so always check the official Texas State Board of Dental Examiners for the current requirements. Our training is built to get you ready &mdash; ask us and we'll walk you through it.</p>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Learn it for real</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Master radiology &mdash; and the whole job.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 0;">
        <p style="margin:0;text-align:center;color:#475569;font-size:15px;line-height:1.6;">Questions about the quizzes or the program? Call or text Amanda &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a> or <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">text us here</a>.</p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Premier%20Dental%20Academy%20of%20Longview%20is%20enrolling%20%E2%80%94%20become%20a%20dental%20assistant%20in%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Become%20a%20dental%20assistant%20in%20Longview&body=Thought%20of%20you%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 25 · radiology$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 26 · chairside$pda_t$, $pda_t$Chairside assisting: try the SmartDoc trainer free$pda_t$, $pda_t$A day in the chair$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">A day in the chair</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Chairside assisting: try the <span style="color:#0d9488;">SmartDoc trainer</span> free.</h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">Chairside is the heart of the job &mdash; passing the right instrument at the right moment, keeping the patient comfortable, and writing clear clinical notes the dentist can rely on. It's a skill you build by doing.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">So we built a way to practice it from your couch. Our <strong>free ChairSide SmartDoc trainer</strong> walks you through real chairside moments and helps you write the kind of clean, accurate notes a great assistant makes look easy. No signup &mdash; just open it and go.</p>
      </td></tr>

      <!-- featured tool: chairside -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">🦷 ChairSide SmartDoc &mdash; free, no signup</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Practice chairside assisting and clinical note-writing right in your browser. It's the closest thing to being in the room before you're in the room.</p>
            <a href="https://www.premierdentalacademyoflongview.com/tools/chairside" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Try the SmartDoc trainer &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">From practice to paid</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Turn chairside practice into a career.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 0;">
        <p style="margin:0;text-align:center;color:#475569;font-size:15px;line-height:1.6;">Want to talk it through? Call or text Amanda &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a> or <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">text us here</a>.</p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Premier%20Dental%20Academy%20of%20Longview%20is%20enrolling%20%E2%80%94%20become%20a%20dental%20assistant%20in%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Become%20a%20dental%20assistant%20in%20Longview&body=Thought%20of%20you%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 26 · chairside$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 27 · funding-veterans$pda_t$, $pda_t$You may be able to train for $0 — here's how$pda_t$, $pda_t$Worth asking about$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Worth asking about</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">You may be able to train for <span style="color:#0d9488;">$0</span> &mdash; here's how.</h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">Cost is the biggest thing that stops people from starting &mdash; so let's talk about it honestly. Depending on your situation, you <strong>may qualify</strong> for workforce funding or veteran education benefits that could cover some or all of your training.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">We can't promise approval &mdash; nobody honestly can &mdash; but we <em>can</em> help you find out. If you've served in the military, or you're between jobs, it's absolutely worth a conversation. The worst that happens is you learn your options.</p>
      </td></tr>

      <!-- featured: apply -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">✅ Apply free &mdash; we'll help you check your options</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Applying costs nothing and doesn't lock you into anything. Start the application and we'll talk through whether funding or veteran benefits might fit your situation.</p>
            <a href="https://www.premierdentalacademyoflongview.com/apply" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">Apply free &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Or pay your own way</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Either way, the door's open.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 0;">
        <p style="margin:0;text-align:center;color:#475569;font-size:15px;line-height:1.6;">Not sure where you stand? Call or text Amanda &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a> or <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">text us here</a>.</p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Premier%20Dental%20Academy%20of%20Longview%20is%20enrolling%20%E2%80%94%20become%20a%20dental%20assistant%20in%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Become%20a%20dental%20assistant%20in%20Longview&body=Thought%20of%20you%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 27 · funding-veterans$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Daily series · Day 28 · enroll-now$pda_t$, $pda_t$Ready? Let's get you enrolled$pda_t$, $pda_t$Your turn$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>
      <!--QLINKS-top--><tr><td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:11px 14px;" align="center">
        <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Free tools</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/calendar" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📅 Class dates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/salary" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">💵 What you'll earn</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">✅ Apply free</a>
      </td></tr>

      <!-- hero -->
      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Your turn</p>
        <h1 style="margin:0;color:#0f172a;font-size:29px;line-height:1.2;">Ready? Let's get you <span style="color:#0d9488;">enrolled.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">We've shared the tools, the answers, and the honest numbers. If something in you keeps coming back to this &mdash; that's worth listening to. A new career as a dental assistant is closer than you think, and the only thing left is to begin.</p>
        <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.6;">One real thing: our in-person classes have limited seats, and they do fill. No countdowns, no gimmicks &mdash; just check the upcoming dates and grab the spot that fits your life.</p>
      </td></tr>

      <!-- featured: calendar -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">📅 See upcoming classes</p>
            <p style="margin:0 0 12px;color:#155e63;font-size:14px;line-height:1.6;">Take a look at the calendar and find a start date that works for you &mdash; then save your seat.</p>
            <a href="https://www.premierdentalacademyoflongview.com/calendar" style="display:inline-block;background:#0e7490;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:8px;">See upcoming classes &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- divider -->
      <tr><td style="padding:22px 28px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- enroll -->
      <tr><td style="padding:20px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Pick your path</p>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;line-height:1.25;">Start today &mdash; in person or online.</h2>
        <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">Become a Registered Dental Assistant right here in Longview &mdash; hands-on, in months not years, with job-placement help when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payments for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:18px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; start any day, learn anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, fully online at your own pace. <strong style="color:#0f172a;">$397.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- call / text Amanda -->
      <tr><td style="padding:18px 28px 0;">
        <p style="margin:0;text-align:center;color:#475569;font-size:15px;line-height:1.6;">Rather talk first? Call or text Amanda &mdash; a real person &mdash; at <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a> or <a href="sms:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">text us here</a>. She'll help you pick the right start date.</p>
      </td></tr>

      <!-- share row -->
      <tr><td align="center" style="padding:22px 28px 4px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;font-weight:bold;">Know someone who'd be a great dental assistant? Pass it on:</p>
        <a href="sms:?&body=Premier%20Dental%20Academy%20of%20Longview%20is%20enrolling%20%E2%80%94%20become%20a%20dental%20assistant%20in%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">💬 Text a friend</a>
        <a href="mailto:?subject=Become%20a%20dental%20assistant%20in%20Longview&body=Thought%20of%20you%20%E2%80%94%20Premier%20Dental%20Academy%20of%20Longview%3A%20https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">📧 Forward this</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.premierdentalacademyoflongview.com" style="display:inline-block;color:#0d9488;font-size:14px;font-weight:bold;text-decoration:none;padding:8px 12px;">👍 Share on Facebook</a>
      </td></tr>

      <!-- footer -->
      
      <!--QLINKS-bottom--><tr><td style="padding:18px 24px 4px;" align="center">
        <p style="margin:0 0 9px;color:#475569;font-size:13px;font-weight:bold;">More to explore &mdash; tap any of these:</p>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📝 Free practice exam</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🦷 Tooth-chart trainer</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/tools/resume-builder" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">📄 Résumé builder</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/graduates" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🎓 Meet our graduates</a>
        <span style="color:#cbd5e1;">&middot;</span>
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="color:#0d9488;font-size:13px;font-weight:bold;text-decoration:none;padding:4px 8px;">🚀 Enroll now</a>
      </td></tr>
      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list. {{ unsubscribe_link }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Daily series · Day 28 · enroll-now$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Broadcast · Enrollment invite$pda_t$, $pda_t$In about 12 weeks, you could have a career you're proud of$pda_t$, $pda_t$Enrollment is open$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:20px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="34" height="34" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>

      <!-- hero / desire -->
      <tr><td style="padding:36px 28px 8px;">
        <p style="margin:0 0 8px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Enrollment is open</p>
        <h1 style="margin:0;color:#0f172a;font-size:31px;line-height:1.18;">In about 12 weeks, you could have a career you're proud of.</h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">Become a <strong>Registered Dental Assistant</strong> right here in Longview &mdash; a real job, steady pay, and a skill that's always in demand. <strong>No four-year degree. No quitting your job to do it.</strong> Train fully online at your own pace, or in daytime classes in Longview, and we help you get hired when you finish.</p>
      </td></tr>

      <!-- why bullets -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:6px 0;color:#0f172a;font-size:15px;line-height:1.5;">✅ &nbsp;<strong>Fast</strong> &mdash; career-ready in about 11&frac12;&ndash;12 weeks.</td></tr>
          <tr><td style="padding:6px 0;color:#0f172a;font-size:15px;line-height:1.5;">✅ &nbsp;<strong>Hands-on</strong> &mdash; real chairs and the same software dental offices use.</td></tr>
          <tr><td style="padding:6px 0;color:#0f172a;font-size:15px;line-height:1.5;">✅ &nbsp;<strong>Flexible</strong> &mdash; 100% online at your own pace, or daytime classes in Longview.</td></tr>
          <tr><td style="padding:6px 0;color:#0f172a;font-size:15px;line-height:1.5;">✅ &nbsp;<strong>Supported</strong> &mdash; job-placement help with East Texas dental offices.</td></tr>
        </table>
      </td></tr>

      <!-- proof bar -->
      <tr><td style="padding:16px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
          <tr><td align="center" style="padding:12px;color:#475569;font-size:13px;">🎓 400+ graduates &nbsp;·&nbsp; 💼 job-placement help &nbsp;·&nbsp; 🔒 secure Square checkout</td></tr>
        </table>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:22px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:17px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Live, hands-on training. <strong style="color:#0f172a;">Start for just $500 down</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple weekly or monthly payment plan for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:14px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:17px;font-weight:bold;">Online &mdash; start any day</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Same curriculum, learn from anywhere at your own pace. <strong style="color:#0f172a;">$397 one time.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- payments + safety net -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">Easy on your budget &mdash; and risk-free</p>
            <p style="margin:0;color:#155e63;font-size:14px;line-height:1.6;"><strong>$500 down holds your seat</strong>, then split the rest into simple weekly or monthly payments (billed automatically, no big lump sum). Change your mind? Your payment <strong>transfers in full</strong> toward another program &mdash; your money is never lost. You can also split it with Klarna, Afterpay, or Affirm.</p>
          </td></tr>
        </table>
      </td></tr>

      <!-- funding -->
      <tr><td style="padding:14px 28px 0;">
        <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;text-align:center;">💡 Veteran or qualify for workforce funding? You may train for <strong>$0 out of pocket</strong> &mdash; <a href="https://www.premierdentalacademyoflongview.com/apply" style="color:#0d9488;font-weight:bold;text-decoration:none;">apply for funding &rarr;</a></p>
      </td></tr>

      <!-- close CTA -->
      <tr><td align="center" style="padding:24px 28px 6px;">
        <a href="https://www.premierdentalacademyoflongview.com/enroll" style="display:inline-block;background:#0f172a;color:#ffffff;font-size:17px;font-weight:bold;text-decoration:none;padding:15px 36px;border-radius:10px;">Reserve your seat &rarr;</a>
        <p style="margin:14px 0 0;color:#475569;font-size:15px;">Questions? Call or text Amanda: <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a></p>
      </td></tr>

      <tr><td style="padding:20px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Broadcast · Enrollment invite$pda_t$);
insert into email_campaigns (internal_title, subject, preview_text, audience, status, html)
select $pda_t$Broadcast · Upcoming classes$pda_t$, $pda_t$Our next dental-assistant classes are filling — save your seat$pda_t$, $pda_t$New classes starting$pda_t$, 'all', 'draft', $pda_body$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">

      <tr><td style="background:#0f172a;padding:22px 28px;">
        <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" width="36" height="36" alt="Premier Dental Academy" style="vertical-align:middle;border-radius:8px;background:#fff;">
        <span style="color:#ffffff;font-size:17px;font-weight:bold;vertical-align:middle;margin-left:10px;">Premier Dental Academy of Longview</span>
      </td></tr>

      <tr><td style="padding:34px 28px 6px;">
        <p style="margin:0 0 6px;color:#0d9488;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">New classes starting</p>
        <h1 style="margin:0;color:#0f172a;font-size:30px;line-height:1.2;">Become a Registered Dental Assistant&nbsp;&mdash; start for just <span style="color:#0d9488;">$500 down.</span></h1>
        <p style="margin:16px 0 0;color:#334155;font-size:16px;line-height:1.6;">Our next dental-assistant classes are filling now. Train hands-on in Longview and be career-ready in about <strong>11&frac12;&ndash;12 weeks</strong> &mdash; with real practice software and job-placement help when you finish.</p>
      </td></tr>

      <!-- In-Person -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">In-Person &mdash; Longview (daytime)</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Hands-on training, real chairs, real software. <strong style="color:#0f172a;">$500 down to start</strong> &middot; $3,500 total on a plan (or $3,000 paid in full) &middot; simple payment plan for the rest.</p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=in-person" style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;padding:13px 26px;border-radius:9px;">Start in-person &mdash; $500 down &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Online -->
      <tr><td style="padding:14px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:bold;">Online &mdash; learn from anywhere</p>
            <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">Self-paced and ready when you are. <strong style="color:#0f172a;">$397 one time.</strong></p>
            <a href="https://www.premierdentalacademyoflongview.com/enroll?plan=online" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;padding:13px 26px;border-radius:9px;">Enroll online &mdash; $397 &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- How payments work -->
      <tr><td style="padding:18px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 4px;color:#0e7490;font-size:14px;font-weight:bold;">How payments work</p>
            <p style="margin:0;color:#155e63;font-size:14px;line-height:1.6;">Easy: <strong>$500 down holds your seat</strong>, then split the rest into simple weekly or monthly payments &mdash; billed automatically to your card through our secure checkout. No big lump sum.</p>
          </td></tr>
        </table>
      </td></tr>

      <tr><td align="center" style="padding:22px 28px 6px;">
        <p style="margin:0;color:#475569;font-size:15px;">Questions? Call or text Amanda: <a href="tel:+19039136444" style="color:#0d9488;font-weight:bold;text-decoration:none;">(903) 913-6444</a></p>
      </td></tr>

      <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Premier Dental Academy of Longview &middot; 2800 Gilmer Rd, Suite 106, Longview, TX 75604 &middot; (903) 913-6444<br>You're receiving this because you joined our list.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
$pda_body$
where not exists (select 1 from email_campaigns where internal_title = $pda_t$Broadcast · Upcoming classes$pda_t$);
