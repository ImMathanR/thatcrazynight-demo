/* THE CRAZY NIGHT — motion + form */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("is-ready");

  // QA/debug: ?flat renders everything revealed and flattens the vh hero
  // so the full page can be screenshotted in one pass.
  var flat = /[?&](qa|flat)\b/.test(location.search);
  if (flat) root.classList.add("flat");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || flat;

  /* ---------- scroll reveals ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".js-reveal, .js-stamp, .js-rise, .js-step"));

  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });

    reveals.forEach(function (el) { io.observe(el); });

    /* stagger items that share a parent for a hand-dealt feel */
    document.querySelectorAll(".pillars, .hero__shout, .hero__actions").forEach(function (group) {
      var kids = group.querySelectorAll(".js-reveal, .js-rise");
      kids.forEach(function (kid, i) {
        kid.style.transitionDelay = Math.min(i * 90, 450) + "ms";
      });
    });

    /* the hero is in view at load — kick its reveal immediately so the
       mask-rise never depends on observer timing */
    requestAnimationFrame(function () {
      document.querySelectorAll(".hero .js-reveal, .hero .js-rise, .js-stamp").forEach(function (el) {
        el.classList.add("in");
      });
    });
  }

  /* ---------- form submit -> Web3Forms ---------- */
  var form = document.getElementById("apply-form");
  var done = document.getElementById("form-done");

  if (form) {
    form.addEventListener("submit", function (e) {
      var key = form.querySelector('[name="access_key"]').value;

      // If the key hasn't been set yet, let the native POST proceed so it's
      // obvious during setup that the form is wired but un-keyed.
      if (!key || key.indexOf("YOUR_WEB3FORMS") === 0) {
        return; // native submit (will error at Web3Forms until keyed) — intentional during setup
      }

      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var original = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Sending…";

      var data = new FormData(form);

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.success) {
            form.hidden = true;
            if (done) {
              done.hidden = false;
              done.classList.add("in");
              done.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
            }
          } else {
            throw new Error(res && res.message ? res.message : "failed");
          }
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = original;
          alert("The door jammed. Try again, or message us on Telegram.");
        });
    });
  }

  /* ---------- The Code: glitch-scramble the heading on hover/focus ---------- */
  var hoverable = window.matchMedia("(hover: hover)").matches;
  if (hoverable && !reduce) {
    var glitch = "ABCDEFGHIJKLMNPQRSTUVWXYZ#%&/\\<>*+=?0123456789";
    document.querySelectorAll(".rule").forEach(function (rule) {
      var line = rule.querySelector(".rule__line");
      if (!line) return;
      line.dataset.final = line.textContent;
      var raf = null;

      function rand() { return glitch.charAt(Math.floor(Math.random() * glitch.length)); }

      function scramble() {
        var text = line.dataset.final;
        var queue = [];
        for (var i = 0; i < text.length; i++) {
          var start = Math.floor(Math.random() * 7);
          queue.push({ to: text.charAt(i), start: start, end: start + 6 + Math.floor(Math.random() * 12), ch: null });
        }
        if (raf) cancelAnimationFrame(raf);
        var frame = 0;
        (function tick() {
          var out = "", done = 0;
          for (var i = 0; i < queue.length; i++) {
            var q = queue[i];
            if (q.to === " ") { out += " "; done++; continue; }
            if (frame >= q.end) { out += q.to; done++; }
            else {
              if (frame < q.start) { out += '<span class="scramble-x">' + rand() + "</span>"; }
              else {
                if (!q.ch || Math.random() < 0.3) q.ch = rand();
                out += '<span class="scramble-x">' + q.ch + "</span>";
              }
            }
          }
          line.innerHTML = out;
          if (done >= queue.length) { line.textContent = text; raf = null; return; }
          frame++; raf = requestAnimationFrame(tick);
        })();
      }

      rule.addEventListener("mouseenter", scramble);
      rule.addEventListener("focus", scramble);
    });
  }

  /* ---------- the timeline: clone fillable mugs, pour the beers in left to right ---------- */
  var timeline = document.querySelector(".timeline");
  var bar = timeline && timeline.querySelector(".timeline__bar");
  var mugTpl = document.getElementById("mug-tpl");
  if (bar && mugTpl && "content" in mugTpl && mugTpl.content.firstElementChild) {
    var count = parseInt(bar.getAttribute("data-mugs"), 10) || 7;
    var mugs = [];
    for (var m = 0; m < count; m++) {
      var node = mugTpl.content.firstElementChild.cloneNode(true);
      if (m === count - 1) node.classList.add("mug--last");
      bar.appendChild(node);
      mugs.push(node);
    }

    var canPour = !reduce && typeof mugs[0].animate === "function";

    function fillStatic() {
      mugs.forEach(function (mug, i) {
        var p = mug.querySelector(".mug__pour");
        if (p) p.style.transform = "translateY(0)";
        mug.classList.add("is-poured");
        if (i === mugs.length - 1) mug.classList.add("is-drunk");
      });
    }

    function pour() {
      mugs.forEach(function (mug, i) {
        var last = i === mugs.length - 1;
        var p = mug.querySelector(".mug__pour");
        mug.classList.remove("is-poured", "is-drunk");
        if (!p) return;
        if (p.getAnimations) p.getAnimations().forEach(function (a) { a.cancel(); });

        // the beer glugs up with a little overshoot; the last one overfills
        var end = last ? -2 : 0;
        var anim = p.animate([
          { transform: "translateY(24px)" },
          { transform: "translateY(" + (end - 3) + "px)", offset: .68 },
          { transform: "translateY(" + (end + 1.6) + "px)", offset: .85 },
          { transform: "translateY(" + end + "px)" }
        ], { duration: 680, delay: 200 + i * 165, fill: "both", easing: "cubic-bezier(.3,.7,.2,1)" });

        // foam head + bubbles switch on as each beer lands; last mug gets tipsy
        anim.onfinish = function () {
          mug.classList.add("is-poured");
          if (last) mug.classList.add("is-drunk");
        };
      });
    }

    if (!canPour || !("IntersectionObserver" in window)) {
      fillStatic();
    } else {
      // empty until the timeline reaches the centre band; replay on re-entry
      var tio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) pour(); });
      }, { rootMargin: "-30% 0px -30% 0px", threshold: 0 });
      tio.observe(timeline);
    }
  }

  /* ---------- dictionary popover: anchor the fixed card to the word ---------- */
  document.querySelectorAll(".defword").forEach(function (word) {
    var card = word.querySelector(".defcard");
    if (!card) return;
    var hideTimer = null;

    function place() {
      var w = word.getBoundingClientRect();
      var gap = 10, margin = 10;
      var cw = card.offsetWidth, ch = card.offsetHeight;
      var wordCx = w.left + w.width / 2;

      // prefer above the word; flip below if it would clip the top
      var below = w.top - ch - gap < margin;
      card.classList.toggle("is-below", below);
      var top = below ? w.bottom + gap : w.top - ch - gap;

      // centre horizontally on the word, clamped to the viewport
      var left = wordCx - cw / 2;
      left = Math.max(margin, Math.min(left, window.innerWidth - cw - margin));

      card.style.top = Math.round(top) + "px";
      card.style.left = Math.round(left) + "px";
      // caret tracks the word even after horizontal clamping
      card.style.setProperty("--caret", Math.round(wordCx - left) + "px");
    }

    function open() {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      word.classList.add("is-open");
      place();
    }
    function close() {
      hideTimer = setTimeout(function () { word.classList.remove("is-open"); }, 110);
    }

    word.addEventListener("pointerenter", open);
    word.addEventListener("pointerleave", close);
    word.addEventListener("focusin", open);
    word.addEventListener("focusout", close);

    // keep it pinned to the word while open
    window.addEventListener("scroll", function () {
      if (word.classList.contains("is-open")) place();
    }, { passive: true });
    window.addEventListener("resize", function () {
      if (word.classList.contains("is-open")) place();
    });
  });

  /* ---------- night number (single source of truth) ---------- */
  // Bump this each week. Stays a literal so the build needs no data layer.
  var NIGHT = "001";
  document.querySelectorAll("[data-night]").forEach(function (el) { el.textContent = NIGHT; });
})();
