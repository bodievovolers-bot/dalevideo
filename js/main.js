(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Sticky header ---------------- */
  var header = document.getElementById("siteHeader");
  function onScrollHeader() {
    if (window.scrollY > 12) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------------- Hero background video ---------------- */
  var heroVideo = document.getElementById("heroVideo");
  if (heroVideo) {
    if (reduceMotion) {
      heroVideo.pause();
      heroVideo.removeAttribute("autoplay");
    } else if ("IntersectionObserver" in window) {
      // Pause while scrolled off-screen to save battery/CPU.
      new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) heroVideo.play().catch(function () {});
            else heroVideo.pause();
          });
        },
        { threshold: 0.1 }
      ).observe(heroVideo);
    }

    // Track the video's actual letterboxed (object-fit: contain) rect so the
    // watermark-masking patch stays aligned with the source clip's bottom-left
    // corner at any viewport size.
    var wmCover = document.getElementById("heroWatermarkCover");
    var heroSection = document.getElementById("home");
    if (wmCover && heroSection) {
      var positionWatermarkCover = function () {
        var vw = heroVideo.videoWidth, vh = heroVideo.videoHeight;
        if (!vw || !vh) return;
        var rect = heroVideo.getBoundingClientRect();
        var heroRect = heroSection.getBoundingClientRect();
        var videoAspect = vw / vh;
        var boxAspect = rect.width / rect.height;
        var dispW, dispH, offX, offY;
        if (boxAspect > videoAspect) {
          dispH = rect.height;
          dispW = dispH * videoAspect;
          offX = (rect.width - dispW) / 2;
          offY = 0;
        } else {
          dispW = rect.width;
          dispH = dispW / videoAspect;
          offX = 0;
          offY = (rect.height - dispH) / 2;
        }
        var patchW = dispW * 0.16;
        var patchH = dispH * 0.12;
        wmCover.style.left = (rect.left - heroRect.left + offX) + "px";
        wmCover.style.top = (rect.top - heroRect.top + offY + dispH - patchH) + "px";
        wmCover.style.width = patchW + "px";
        wmCover.style.height = patchH + "px";
      };
      if (heroVideo.readyState >= 1) positionWatermarkCover();
      heroVideo.addEventListener("loadedmetadata", positionWatermarkCover);
      window.addEventListener("resize", positionWatermarkCover, { passive: true });
      window.addEventListener("load", positionWatermarkCover);
    }
  }

  /* ---------------- Portfolio thumbnail videos ---------------- */
  var thumbVideos = document.querySelectorAll(".work-thumb .thumb-video");
  if (thumbVideos.length) {
    if (!reduceMotion && "IntersectionObserver" in window) {
      var thumbVideoObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) entry.target.play().catch(function () {});
            else entry.target.pause();
          });
        },
        { threshold: 0.2 }
      );
      thumbVideos.forEach(function (v) { thumbVideoObserver.observe(v); });
    }
    document.querySelectorAll(".work-thumb .sound-toggle").forEach(function (btn) {
      var video = btn.parentElement.querySelector(".thumb-video");
      if (!video) return;
      btn.addEventListener("click", function () {
        video.muted = !video.muted;
        btn.setAttribute("aria-pressed", video.muted ? "false" : "true");
        btn.setAttribute("aria-label", video.muted ? "Unmute video" : "Mute video");
      });
    });
  }

  /* ---------------- Mobile menu ---------------- */
  var navToggle = document.getElementById("navToggle");
  var mobileMenu = document.getElementById("mobileMenu");

  function closeMenu() {
    navToggle.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  function openMenu() {
    navToggle.setAttribute("aria-expanded", "true");
    mobileMenu.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  navToggle.addEventListener("click", function () {
    var expanded = navToggle.getAttribute("aria-expanded") === "true";
    if (expanded) closeMenu(); else openMenu();
  });
  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) {
      closeMenu();
      navToggle.focus();
    }
  });

  /* ---------------- Active nav link on scroll ---------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = "#" + entry.target.id;
            navLinks.forEach(function (a) {
              a.classList.toggle("is-active", a.getAttribute("href") === id);
            });
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ---------------- Stat counters ---------------- */
  var statsGroup = document.getElementById("statsGroup");
  var counted = false;
  function animateCounters() {
    if (counted) return;
    counted = true;
    var nums = statsGroup.querySelectorAll(".stat-num");
    nums.forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduceMotion) {
        el.textContent = target + suffix;
        return;
      }
      var start = 0;
      var duration = 1400;
      var startTime = null;
      function step(ts) {
        if (startTime === null) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.round(start + (target - start) * eased);
        el.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }
  if ("IntersectionObserver" in window && statsGroup) {
    var statsObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounters();
          }
        });
      },
      { threshold: 0.4 }
    );
    statsObserver.observe(statsGroup);
  } else if (statsGroup) {
    animateCounters();
  }

  /* ---------------- Process line + step reveal ---------------- */
  var processTrack = document.querySelector(".process-track");
  var processFill = document.getElementById("processFill");
  var processSteps = document.querySelectorAll(".process-step");
  if (processTrack && "IntersectionObserver" in window) {
    var processObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (processFill) processFill.style.width = "100%";
            processSteps.forEach(function (step, i) {
              setTimeout(function () { step.classList.add("is-visible"); }, reduceMotion ? 0 : i * 140);
            });
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    processObserver.observe(processTrack);
  }

  /* ---------------- Portfolio filter ---------------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var portfolioCards = document.querySelectorAll("#portfolioGrid .work-card");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var filter = btn.getAttribute("data-filter");
      portfolioCards.forEach(function (card) {
        var match = filter === "all" || card.getAttribute("data-category") === filter;
        card.classList.toggle("is-hidden", !match);
      });
    });
  });

  /* ---------------- Load more ---------------- */
  var loadMoreBtn = document.getElementById("loadMoreBtn");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", function () {
      var hiddenBatch = document.querySelectorAll("#portfolioGrid .work-card.is-hidden-batch");
      hiddenBatch.forEach(function (card) {
        card.classList.remove("is-hidden-batch");
        if (!reduceMotion) {
          card.classList.add("card-enter");
          card.addEventListener("animationend", function handler() {
            card.classList.remove("card-enter");
            card.removeEventListener("animationend", handler);
          });
        }
      });
      loadMoreBtn.setAttribute("disabled", "true");
      loadMoreBtn.textContent = "All Projects Loaded";
    });
  }

  /* ---------------- Ambient inline video preview ---------------- */
  if (!reduceMotion) {
    document.querySelectorAll(".video-card[data-youtube-id]").forEach(function (card) {
      var id = card.getAttribute("data-youtube-id");
      var thumb = card.querySelector(".work-thumb") || card;
      var wrap = document.createElement("div");
      wrap.className = "yt-ambient-wrap";
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/" + id +
        "?autoplay=1&mute=1&loop=1&playlist=" + id +
        "&controls=0&modestbranding=1&playsinline=1&rel=0&enablejsapi=1";
      iframe.setAttribute("allow", "autoplay; encrypted-media");
      iframe.title = "Video preview";
      iframe.setAttribute("aria-hidden", "true");
      iframe.tabIndex = -1;
      wrap.appendChild(iframe);
      // Insert right after the poster image, below the play button/overlay/label.
      thumb.insertBefore(wrap, thumb.querySelector(".play-btn"));

      // Sound toggle: talks to the embedded player over postMessage since
      // it's a cross-origin iframe, not a native <video> we can just mute.
      var toggle = card.querySelector(".sound-toggle");
      if (toggle) {
        var muted = true;
        toggle.addEventListener("click", function () {
          muted = !muted;
          iframe.contentWindow.postMessage(JSON.stringify({
            event: "command",
            func: muted ? "mute" : "unMute",
            args: []
          }), "*");
          toggle.setAttribute("aria-pressed", muted ? "false" : "true");
          toggle.setAttribute("aria-label", muted ? "Unmute video" : "Mute video");
        });
      }
    });
  }

  /* ---------------- Video lightbox ---------------- */
  var lightbox = document.getElementById("videoLightbox");
  var lightboxEmbed = document.getElementById("videoLightboxEmbed");
  var lightboxClose = document.getElementById("videoLightboxClose");
  var lightboxBackdrop = document.getElementById("videoLightboxBackdrop");
  var lastFocusBeforeLightbox = null;

  function openVideoLightbox(youtubeId, triggerEl) {
    lastFocusBeforeLightbox = triggerEl || document.activeElement;
    var iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube.com/embed/" + youtubeId + "?autoplay=1&rel=0&modestbranding=1&playsinline=1";
    iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
    iframe.setAttribute("allowfullscreen", "");
    iframe.title = "Video player";
    lightboxEmbed.innerHTML = "";
    lightboxEmbed.appendChild(iframe);
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lightboxClose.focus();
  }
  function openLocalVideoLightbox(src, triggerEl) {
    lastFocusBeforeLightbox = triggerEl || document.activeElement;
    var video = document.createElement("video");
    video.src = src;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    lightboxEmbed.innerHTML = "";
    lightboxEmbed.appendChild(video);
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lightboxClose.focus();
  }
  function closeVideoLightbox() {
    lightbox.hidden = true;
    lightboxEmbed.innerHTML = ""; // removing the player stops playback
    document.body.style.overflow = "";
    if (lastFocusBeforeLightbox) lastFocusBeforeLightbox.focus();
  }
  if (lightbox && lightboxEmbed && lightboxClose && lightboxBackdrop) {
    document.querySelectorAll(".video-card[data-youtube-id]").forEach(function (card) {
      var id = card.getAttribute("data-youtube-id");
      var trigger = card.querySelector(".play-btn") || card;
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        openVideoLightbox(id, trigger);
      });
    });
    document.querySelectorAll("[data-local-video]").forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        openLocalVideoLightbox(trigger.getAttribute("data-local-video"), trigger);
      });
    });
    lightboxClose.addEventListener("click", closeVideoLightbox);
    lightboxBackdrop.addEventListener("click", closeVideoLightbox);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !lightbox.hidden) closeVideoLightbox();
    });
  }

  /* ---------------- Contact form ---------------- */
  var form = document.getElementById("contactForm");
  var formSuccess = document.getElementById("formSuccess");
  var formError = document.getElementById("formError");
  var formErrorText = document.getElementById("formErrorText");
  var submitBtn = document.getElementById("formSubmitBtn");
  var submitBtnLabel = submitBtn ? submitBtn.querySelector(".btn-label") : null;
  if (form) {
    form.setAttribute("novalidate", "true"); // native validation stays on if this script fails to run
    var fields = [
      { id: "name", wrapper: "nameField", validate: function (v) { return v.trim().length > 1; } },
      { id: "email", wrapper: "emailField", validate: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); } },
      { id: "project", wrapper: "projectField", validate: function (v) { return v !== ""; } },
      { id: "message", wrapper: "messageField", validate: function (v) { return v.trim().length > 4; } }
    ];

    function validateField(f) {
      var el = document.getElementById(f.id);
      var wrapper = document.getElementById(f.wrapper);
      var valid = f.validate(el.value);
      wrapper.classList.toggle("has-error", !valid);
      el.setAttribute("aria-invalid", valid ? "false" : "true");
      return valid;
    }

    fields.forEach(function (f) {
      var el = document.getElementById(f.id);
      el.addEventListener("blur", function () { validateField(f); });
      el.addEventListener("input", function () {
        var wrapper = document.getElementById(f.wrapper);
        if (wrapper.classList.contains("has-error")) validateField(f);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var allValid = fields.map(validateField).every(Boolean);
      if (!allValid) {
        var firstInvalid = form.querySelector(".has-error input, .has-error select, .has-error textarea");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      formSuccess.classList.remove("is-visible");
      formError.classList.remove("is-visible");
      if (submitBtn) submitBtn.disabled = true;
      if (submitBtnLabel) submitBtnLabel.textContent = "Sending...";

      var payload = Object.fromEntries(new FormData(form));

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.success) {
            formSuccess.classList.add("is-visible");
            form.reset();
            fields.forEach(function (f) {
              document.getElementById(f.wrapper).classList.remove("has-error");
            });
          } else {
            formErrorText.textContent = data.message || "Something went wrong sending your message. Please try again, or email me directly.";
            formError.classList.add("is-visible");
          }
        })
        .catch(function () {
          formErrorText.textContent = "Couldn't send your message — check your connection and try again, or email me directly.";
          formError.classList.add("is-visible");
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
          if (submitBtnLabel) submitBtnLabel.textContent = "Send Message";
          setTimeout(function () {
            var target = formSuccess.classList.contains("is-visible") ? formSuccess : formError;
            target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
          }, 50);
        });
    });
  }

  /* ---------------- Back to top ---------------- */
  var toTop = document.getElementById("toTop");
  function onScrollTop() {
    if (window.scrollY > 700) toTop.classList.add("is-visible");
    else toTop.classList.remove("is-visible");
  }
  onScrollTop();
  window.addEventListener("scroll", onScrollTop, { passive: true });
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
})();
