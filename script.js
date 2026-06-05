/**
 * MERIDIAN LEGAL — script.js
 * Handles: BCI Disclaimer Modal · Navigation · Scroll Reveal ·
 *          Active Nav Links · Form Validation (DPDP Act 2023)
 */

'use strict';

/* ── UTILITY: DOM selector shortcuts ─────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   1. BCI DISCLAIMER MODAL
   Must appear on every first load. Cannot be dismissed
   by clicking outside. "I Do Not Agree" closes the tab.
   ============================================================ */
(function initDisclaimer() {
  const modal   = $('#disclaimer-modal');
  const btnAgree    = $('#modal-agree');
  const btnDisagree = $('#modal-disagree');

  if (!modal) return;

  // Prevent body scroll while modal is open
  document.body.classList.add('modal-open');

  // Focus the agree button on load for accessibility
  window.addEventListener('load', () => {
    btnAgree.focus();
  });

  // "I Agree & Proceed" — dismiss modal
  btnAgree.addEventListener('click', () => {
    modal.classList.add('is-hidden');
    document.body.classList.remove('modal-open');
    // Remember agreement for this session (sessionStorage — not persistent)
    try { sessionStorage.setItem('bci_agreed', '1'); } catch (e) {}
    // Return focus to main content
    const firstHeading = $('#hero-name') || $('main');
    if (firstHeading) firstHeading.focus();
  });

  // "I Do Not Agree" — attempt to close the tab / redirect
  btnDisagree.addEventListener('click', () => {
    try {
      window.close();
    } catch (e) {}
    // Fallback: redirect to a neutral page if window.close() is blocked
    window.location.href = 'https://www.google.com';
  });

  // Trap focus within modal when open
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = $$('button, a[href], input, [tabindex]:not([tabindex="-1"])', modal)
      .filter(el => !el.disabled);
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Prevent ESC from dismissing (BCI compliance — must be explicit choice)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('is-hidden')) {
      e.preventDefault();
    }
  });
})();

/* ============================================================
   2. STICKY NAVIGATION
   — Adds .scrolled class for blur effect
   — Highlights active section link on scroll
   — Closes mobile nav on link click
   ============================================================ */
(function initNav() {
  const header      = $('#site-header');
  const hamburger   = $('#hamburger');
  const mobileNav   = $('#mobile-nav');
  const mobileClose = $('#mobile-close');
  const mobileLinks = $$('.mobile-link');
  const navLinks    = $$('.nav-links a');
  const sections    = $$('section[id], div[id="hero"]');

  if (!header) return;

  /* -- Scroll: add .scrolled class ----------------------- */
  const onScroll = () => {
    if (window.scrollY > 48) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    updateActiveLink();
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  /* -- Active nav link based on scroll position --------- */
  function updateActiveLink() {
    let current = '';
    sections.forEach(section => {
      const top = section.getBoundingClientRect().top;
      if (top <= 100) {
        current = section.id;
      }
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }

  /* -- Mobile nav toggle --------------------------------- */
  function openMobileNav() {
    mobileNav.classList.add('is-open');
    mobileNav.removeAttribute('aria-hidden');
    hamburger.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    mobileClose.focus();
  }

  function closeMobileNav() {
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    hamburger.focus();
  }

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.contains('is-open');
      if (isOpen) { closeMobileNav(); } else { openMobileNav(); }
    });
  }

  if (mobileClose) {
    mobileClose.addEventListener('click', closeMobileNav);
  }

  // Close mobile nav when a link is clicked
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMobileNav();
    });
  });

  // Close mobile nav on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
      closeMobileNav();
    }
  });

  /* -- Smooth scroll with offset for fixed header -------- */
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      const headerH = header.offsetHeight;
      const targetY = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    });
  });
})();

/* ============================================================
   3. SCROLL REVEAL
   Uses IntersectionObserver to fade-up elements with
   .reveal class as they enter the viewport.
   ============================================================ */
(function initReveal() {
  // Skip if prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('.reveal').forEach(el => el.classList.add('is-visible'));
    return;
  }

  if (!('IntersectionObserver' in window)) {
    // Fallback: show all immediately
    $$('.reveal').forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // Only animate once
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -48px 0px',
    }
  );

  $$('.reveal').forEach(el => observer.observe(el));
})();

/* ============================================================
   4. CONTACT FORM VALIDATION
   — Real-time field validation
   — DPDP Act 2023 mandatory consent checkbox (unticked default)
   — Submit disabled until consent ticked
   — On success: shows confirmation message
   ============================================================ */
(function initForm() {
  const form        = $('#contact-form');
  const submitBtn   = $('#submit-btn');
  const dpdpCheck   = $('#dpdp-consent');
  const successMsg  = $('#form-success');

  if (!form) return;

  /* -- Keep submit button state synced with DPDP checkbox - */
  function updateSubmitState() {
    if (dpdpCheck.checked) {
      submitBtn.removeAttribute('disabled');
      submitBtn.setAttribute('aria-disabled', 'false');
    } else {
      submitBtn.setAttribute('disabled', '');
      submitBtn.setAttribute('aria-disabled', 'true');
    }
  }

  // Initialise as disabled (checkbox unchecked by default — DPDP compliance)
  updateSubmitState();
  dpdpCheck.addEventListener('change', updateSubmitState);

  /* -- Field validators ----------------------------------- */
  const validators = {
    'full-name': {
      validate: (v) => v.trim().length >= 2,
      message: 'Please enter your full name (minimum 2 characters).',
    },
    'email': {
      validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      message: 'Please enter a valid email address.',
    },
    'query-type': {
      validate: (v) => v !== '' && v !== null,
      message: 'Please select a nature of query.',
    },
    'message': {
      validate: (v) => v.trim().length >= 10,
      message: 'Please provide a brief description (minimum 10 characters).',
    },
  };

  const errorIds = {
    'full-name':   'name-error',
    'email':       'email-error',
    'query-type':  'query-error',
    'message':     'message-error',
  };

  /* -- Show / clear field error message ------------------ */
  function showError(fieldId, message) {
    const field = $(`#${fieldId}`);
    const errorEl = $(`#${errorIds[fieldId]}`);
    if (field) field.classList.add('is-invalid');
    if (errorEl) errorEl.textContent = message;
  }

  function clearError(fieldId) {
    const field = $(`#${fieldId}`);
    const errorEl = $(`#${errorIds[fieldId]}`);
    if (field) field.classList.remove('is-invalid');
    if (errorEl) errorEl.textContent = '';
  }

  /* -- Real-time validation on blur ---------------------- */
  Object.keys(validators).forEach(fieldId => {
    const field = $(`#${fieldId}`);
    if (!field) return;

    field.addEventListener('blur', () => {
      const { validate, message } = validators[fieldId];
      if (!validate(field.value)) {
        showError(fieldId, message);
      } else {
        clearError(fieldId);
      }
    });

    // Clear error on input
    field.addEventListener('input', () => {
      clearError(fieldId);
    });
  });

  /* -- DPDP consent validation --------------------------- */
  function validateDPDP() {
    const errorEl = $('#dpdp-error');
    if (!dpdpCheck.checked) {
      if (errorEl) errorEl.textContent = 'You must provide explicit consent under the DPDP Act, 2023 to submit this form.';
      return false;
    }
    if (errorEl) errorEl.textContent = '';
    return true;
  }

  /* -- Full form validation before submit ---------------- */
  function validateAll() {
    let isValid = true;

    Object.keys(validators).forEach(fieldId => {
      const field = $(`#${fieldId}`);
      if (!field) return;
      const { validate, message } = validators[fieldId];
      if (!validate(field.value)) {
        showError(fieldId, message);
        isValid = false;
      } else {
        clearError(fieldId);
      }
    });

    if (!validateDPDP()) {
      isValid = false;
    }

    return isValid;
  }

  /* -- Form submission ------------------------------------ */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Double-check DPDP consent (belt-and-suspenders — button should be disabled anyway)
    if (!dpdpCheck.checked) {
      validateDPDP();
      dpdpCheck.focus();
      return;
    }

    if (!validateAll()) {
      // Focus the first invalid field
      const firstInvalid = form.querySelector('.is-invalid, [aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Simulate submission (replace with actual fetch/XHR in production)
    submitBtn.textContent = 'Sending…';
    submitBtn.setAttribute('disabled', '');

    setTimeout(() => {
      // Show success message
      if (successMsg) {
        successMsg.removeAttribute('hidden');
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        successMsg.focus();
      }

      // Reset form
      form.reset();
      updateSubmitState();
      submitBtn.textContent = 'Submit Enquiry';

    }, 1200); // Simulated 1.2s delay — replace with real API call
  });
})();

/* ============================================================
   5. HERO: stagger animation trigger
   Re-triggers fade-up if hero already loaded
   ============================================================ */
(function initHeroAnim() {
  const fadeEls = $$('.fade-up');
  // Elements are animated via CSS animation — no JS needed for initial load.
  // This function is a hook for any future dynamic hero content.
})();
