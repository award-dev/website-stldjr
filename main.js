/* STL Demolition and Junk Removal — site interactivity (vanilla JS, no dependencies) */
(function () {
  "use strict";

  /* Mobile nav toggle */
  var navToggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");
  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mobileNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* Scroll fade-in reveal (progressive enhancement — see .js gate in main.css) */
  var animated = document.querySelectorAll("[data-animate]");
  if ("IntersectionObserver" in window && animated.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    animated.forEach(function (el) { io.observe(el); });

    /* Safety net: if anything is still hidden after 2.5s (slow layout,
       an observer edge case, a very short page, etc.), reveal it anyway.
       Content must never stay permanently invisible because of this
       purely decorative effect. */
    window.setTimeout(function () {
      animated.forEach(function (el) { el.classList.add("is-visible"); });
    }, 2500);
  } else {
    animated.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* FAQ accordion */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-question");
    var answer = item.querySelector(".faq-answer");
    if (!btn || !answer) return;
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      document.querySelectorAll(".faq-question[aria-expanded='true']").forEach(function (other) {
        if (other !== btn) {
          other.setAttribute("aria-expanded", "false");
          other.closest(".faq-item").querySelector(".faq-answer").style.maxHeight = null;
        }
      });
      btn.setAttribute("aria-expanded", expanded ? "false" : "true");
      answer.style.maxHeight = expanded ? null : answer.scrollHeight + "px";
    });
  });

  /* Testimonial carousel controls */
  document.querySelectorAll("[data-testimonial-track]").forEach(function (track) {
    var wrap = track.closest(".testimonial-track-wrap");
    if (!wrap) return;
    var prev = wrap.querySelector("[data-tc-prev]");
    var next = wrap.querySelector("[data-tc-next]");
    var scrollAmount = function () {
      var card = track.querySelector(".testimonial-card");
      return card ? card.offsetWidth + 22 : 340;
    };
    if (next) next.addEventListener("click", function () { track.scrollBy({ left: scrollAmount(), behavior: "smooth" }); });
    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -scrollAmount(), behavior: "smooth" }); });
  });

  /* Gallery filter */
  var filterBtns = document.querySelectorAll("[data-gallery-filter]");
  var galleryItems = document.querySelectorAll("[data-gallery-item]");
  if (filterBtns.length && galleryItems.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var filter = btn.getAttribute("data-gallery-filter");
        filterBtns.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        galleryItems.forEach(function (item) {
          var cat = item.getAttribute("data-gallery-item");
          var show = filter === "all" || cat === filter;
          item.classList.toggle("is-visible", show);
        });
      });
    });
  }

  /* Quote form submission (Formspree-ready) */
  var quoteForms = document.querySelectorAll("[data-quote-form]");
  quoteForms.forEach(function (form) {
    var statusEl = form.querySelector("[data-form-status]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      /* Honeypot spam check */
      var honeypot = form.querySelector("input[name='_gotcha']");
      if (honeypot && honeypot.value) return;

      var submitBtn = form.querySelector("button[type='submit']");
      var formAction = form.getAttribute("action") || "";

      if (formAction.indexOf("YOUR_FORM_ID") !== -1) {
        /* Backend not yet configured — see README.md to connect Formspree */
        if (statusEl) {
          statusEl.textContent = "Form backend not yet connected — please call " + (window.SITE_PHONE_DISPLAY || "us") + " for now. (See README.md: connect Formspree to enable online submissions.)";
          statusEl.setAttribute("data-state", "error");
        }
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending..."; }
      if (statusEl) { statusEl.textContent = ""; statusEl.removeAttribute("data-state"); }

      var data = new FormData(form);
      fetch(formAction, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      })
        .then(function (response) {
          if (response.ok) {
            window.location.href = "/thank-you/";
          } else {
            return response.json().then(function (json) {
              throw new Error((json && json.errors && json.errors.map(function (e) { return e.message; }).join(", ")) || "Something went wrong.");
            });
          }
        })
        .catch(function (err) {
          if (statusEl) {
            statusEl.textContent = "We couldn't send that — please try again or call " + (window.SITE_PHONE_DISPLAY || "us") + " directly.";
            statusEl.setAttribute("data-state", "error");
          }
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn.getAttribute("data-original-label") || "Send My Request"; }
        });
    });
  });

  /* Header shadow on scroll */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.style.boxShadow = window.scrollY > 4 ? "0 2px 10px rgba(20,24,27,0.08)" : "none";
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();
