/* ============================================================
   Premier Dental Academy — shared header/footer + interactions
   Injected into every page. One file = consistent site-wide.
   ============================================================ */
(function () {
  var PHONE = "(903) 913-6444", TEL = "tel:+19039136444", SMS = "sms:+19039136444";
  var EMAIL = "hello@PremierDentalAcademyOfLongview.com";

  var TOOTH = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3c-3 0-4 1.4-4 1.4S7 3 5 3.6C2.8 4.3 2.4 7 3.2 10.5c.6 2.6 1.2 5 1.9 7.2.5 1.6 1 2.8 1.9 2.8 1.1 0 1.2-2.4 2-4.4.5-1.3 1-1.9 3-1.9s2.5.6 3 1.9c.8 2 .9 4.4 2 4.4.9 0 1.4-1.2 1.9-2.8.7-2.2 1.3-4.6 1.9-7.2C21.6 7 21.2 4.3 19 3.6 17 3 16 4.4 16 4.4S15 3 12 3z" fill="#fff"/></svg>';
  var PHONEIC = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';

  var NAV = [
    ["Programs", "index.html#programs"], ["Calendar", "classes.html"], ["Salary", "salary.html"],
    ["About", "about.html"], ["Graduates", "graduates.html"], ["For offices", "employers.html"], ["Contact", "contact.html"]
  ];

  function brand() {
    return '<a class="brand" href="index.html"><span class="mark" aria-hidden="true">' + TOOTH +
      '</span><span><b>Premier Dental Academy</b><small>Longview, Texas</small></span></a>';
  }

  function buildHeader() {
    var page = document.body.getAttribute("data-page") || "";
    var links = NAV.map(function (n) {
      var key = n[1].split(".")[0];
      var active = (key === page) ? " active" : "";
      return '<a class="' + active.trim() + '" href="' + n[1] + '">' + n[0] + "</a>";
    }).join("");
    var extra = '<a href="blog.html">Blog</a><a href="skills-lab.html">Free tools</a><a href="login.html">Sign in</a>';
    var h = document.createElement("header");
    h.className = "site-nav";
    h.innerHTML =
      '<div class="wrap">' + brand() +
      '<nav class="navlinks" id="navlinks">' + links + extra + "</nav>" +
      '<div class="navcta">' +
      '<a class="navphone" href="' + TEL + '">' + PHONEIC + '<span><b>' + PHONE + "</b><small>Call or text Amanda</small></span></a>" +
      '<a class="btn btn-amber" href="enroll.html">Enroll</a>' +
      '<button class="burger" aria-label="Menu" id="burger"><svg width="26" height="26" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 12h18M3 6h18M3 18h18"/></svg></button>' +
      "</div></div>";
    document.body.insertBefore(h, document.body.firstChild);
    document.getElementById("burger").addEventListener("click", function () {
      document.getElementById("navlinks").classList.toggle("open");
    });
  }

  function buildFooter() {
    var f = document.createElement("footer");
    f.className = "site-foot";
    f.innerHTML =
      '<div class="wrap"><div class="foot-grid">' +
      '<div>' + brand() + '<p class="blurb">East Texas RDA training built on real practice-management software. Get hired faster.</p></div>' +
      '<div><h5>Programs</h5><a href="enroll.html">In-person — $3,000</a><a href="enroll.html">Online — $397</a><a href="index.html#pricing">Pricing</a><a href="apply.html">Apply now</a><a href="classes.html">Cohort calendar</a></div>' +
      '<div><h5>Free trainers</h5><a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro">PDA Practice Pro</a><a href="https://www.premierdentalacademyoflongview.com/tools/chairside">PDA ChairSide</a><a href="skills-lab.html">Skills Lab</a><a href="salary.html">Salary calculator</a><a href="guide.html">Free guide</a></div>' +
      '<div><h5>Contact</h5><a href="' + TEL + '">' + PHONE + '</a><a href="' + SMS + '">Text us</a><a href="mailto:' + EMAIL + '">Email us</a><a href="contact.html">2800 Gilmer Rd, Ste 106<br>Longview, TX 75604</a><a href="employers.html">For dental offices</a></div>' +
      "</div>" +
      '<div class="foot-bottom"><span>© 2026 Premier Dental Academy of Longview · Owned by Amanda Williams</span><span>Trainers use fictional data only — no real PHI</span></div>' +
      '</div>';
    document.body.appendChild(f);
    var flag = document.createElement("div");
    flag.className = "concept-flag";
    flag.textContent = "Design concept — PDA";
    document.body.appendChild(flag);
  }

  /* ---- payment calculator (in-person) ---- */
  function initCalc() {
    var root = document.getElementById("pdacalc");
    if (!root) return;
    var state = { plan: "inperson", mode: "monthly" }, TOTAL = 3500, DOWN = 500;
    function render() {
      var t = root.querySelector("#term");
      var n = parseInt(t.value, 10);
      var per = Math.round((TOTAL - DOWN) / n);
      var unit = state.mode === "weekly" ? "wk" : "mo";
      root.querySelector("#termlbl").textContent = n + (state.mode === "weekly" ? " weeks" : " months");
      root.querySelector("#payamt").textContent = "$" + per.toLocaleString() + "/" + unit;
      root.querySelector("#paycount").textContent = n + " payments";
    }
    root.querySelectorAll(".plan-opt").forEach(function (b) {
      b.addEventListener("click", function () {
        state.plan = b.dataset.plan;
        root.querySelectorAll(".plan-opt").forEach(function (x) { x.classList.toggle("active", x === b); });
        root.querySelector("#calcbody").style.display = state.plan === "online" ? "none" : "block";
        root.querySelector("#onlinebox").style.display = state.plan === "online" ? "block" : "none";
        if (state.plan === "inperson") render();
      });
    });
    root.querySelector("#wk").addEventListener("click", function () { setMode("weekly"); });
    root.querySelector("#mo").addEventListener("click", function () { setMode("monthly"); });
    function setMode(m) {
      state.mode = m;
      root.querySelector("#wk").classList.toggle("on", m === "weekly");
      root.querySelector("#mo").classList.toggle("on", m === "monthly");
      var t = root.querySelector("#term");
      if (m === "weekly") { t.min = 4; t.max = 24; t.value = 12; } else { t.min = 1; t.max = 12; t.value = 6; }
      render();
    }
    root.querySelector("#term").addEventListener("input", render);
    render();
  }

  /* ---- salary calculator ---- */
  function initSalary() {
    var root = document.getElementById("salarycalc");
    if (!root) return;
    function render() {
      var wage = parseFloat(root.querySelector("#wage").value);
      var hours = parseInt(root.querySelector("#hours").value, 10);
      var annual = Math.round(wage * hours * 52);
      var monthly = Math.round(annual / 12);
      var weeksToPayback = Math.max(1, Math.round(3000 / (wage * hours)));
      root.querySelector("#wageout").textContent = "$" + wage.toFixed(2) + "/hr";
      root.querySelector("#hoursout").textContent = hours + " hrs/wk";
      root.querySelector("#annual").textContent = "$" + annual.toLocaleString();
      root.querySelector("#monthly").textContent = "$" + monthly.toLocaleString() + "/mo";
      root.querySelector("#payback").textContent = weeksToPayback + (weeksToPayback === 1 ? " week" : " weeks");
    }
    root.querySelector("#wage").addEventListener("input", render);
    root.querySelector("#hours").addEventListener("input", render);
    render();
  }

  function boot() { buildHeader(); buildFooter(); initCalc(); initSalary(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
