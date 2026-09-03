/**
 * Auvexis Systems — client-side interactivity.
 * Kept deliberately small: mobile nav toggle, scroll-reveal, and contact
 * form validation with a mailto: fallback (no backend exists yet — see
 * README.md "Contact form" section for the wiring TODO).
 */

const CONTACT_EMAIL = "auvexissystems@gmail.com";

function initNavToggle(): void {
  const header = document.querySelector<HTMLElement>("[data-header]");
  const toggle = header?.querySelector<HTMLButtonElement>("[data-nav-toggle]");
  const nav = header?.querySelector<HTMLElement>("#main-nav");
  if (!header || !toggle || !nav) return;

  const setOpen = (open: boolean) => {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () => {
    const isOpen = header.classList.contains("is-open");
    setOpen(!isOpen);
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
}

/**
 * Two-level Platform / Products dropdowns. CSS :hover/:focus-within already
 * shows a dropdown on desktop as the no-JS baseline; this adds explicit
 * click-toggle + aria-expanded control on top, for touch devices, keyboard
 * users who want to "pin" a dropdown open without hovering, and screen
 * readers. On the mobile drawer (see main.css, max-width:1080px) dropdowns
 * are always expanded statically, so toggling here has no visual effect
 * there — harmless, and it keeps every link reachable before JS attaches.
 */
function initNavDropdowns(): void {
  const triggers = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-nav-dropdown-trigger]"));
  if (triggers.length === 0) return;

  const items = triggers
    .map((trigger) => trigger.closest<HTMLElement>(".main-nav__item--dropdown"))
    .filter((el): el is HTMLElement => el !== null);

  const closeAll = (except?: HTMLElement): void => {
    items.forEach((item) => {
      if (item === except) return;
      item.classList.remove("is-open");
      item.querySelector<HTMLButtonElement>("[data-nav-dropdown-trigger]")?.setAttribute("aria-expanded", "false");
    });
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const item = trigger.closest<HTMLElement>(".main-nav__item--dropdown");
      if (!item) return;
      const isOpen = item.classList.contains("is-open");
      closeAll(isOpen ? undefined : item);
      item.classList.toggle("is-open", !isOpen);
      trigger.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target as Node;
    const clickedInsideAnyDropdown = items.some((item) => item.contains(target));
    if (!clickedInsideAnyDropdown) closeAll();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAll();
  });
}

function initScrollReveal(): void {
  const items = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
  if (items.length === 0) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced || !("IntersectionObserver" in window)) {
    // No animation: content simply stays in its normal, fully visible state.
    return;
  }

  // Only now — with JS confirmed running and IntersectionObserver available —
  // do we hide elements ahead of animating them in. Content is never hidden
  // by default CSS alone.
  items.forEach((el) => el.classList.add("reveal-pending"));

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.remove("reveal-pending");
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((el) => observer.observe(el));
}

interface FieldConfig {
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  wrapper: HTMLElement;
  errorEl: HTMLElement | null;
}

function initContactForm(): void {
  const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
  if (!form) return;

  const statusEl = form.querySelector<HTMLElement>("[data-form-status]");
  const submitBtn = form.querySelector<HTMLButtonElement>("[data-submit-btn]");
  const msgRequired = form.dataset.msgRequired || "This field is required.";
  const msgEmail = form.dataset.msgEmail || "Please enter a valid email address.";
  const msgSending = form.dataset.msgSending || "Sending …";
  const msgSubmit = form.dataset.msgSubmit || submitBtn?.textContent || "Send";

  const requiredFields: FieldConfig[] = Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[required]")
  ).map((el) => {
    const wrapper = el.closest<HTMLElement>(".form-field") || el.parentElement!;
    return { el, wrapper, errorEl: wrapper.querySelector<HTMLElement>(".form-field__error") };
  });

  function setFieldError(field: FieldConfig, message: string | null): void {
    if (message) {
      field.wrapper.classList.add("has-error");
      if (field.errorEl) field.errorEl.textContent = message;
      field.el.setAttribute("aria-invalid", "true");
    } else {
      field.wrapper.classList.remove("has-error");
      if (field.errorEl) field.errorEl.textContent = "";
      field.el.removeAttribute("aria-invalid");
    }
  }

  function validate(): boolean {
    let valid = true;
    for (const field of requiredFields) {
      const value = field.el.value.trim();
      if (!value) {
        setFieldError(field, msgRequired);
        valid = false;
        continue;
      }
      if (field.el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setFieldError(field, msgEmail);
        valid = false;
        continue;
      }
      setFieldError(field, null);
    }
    return valid;
  }

  requiredFields.forEach((field) => {
    field.el.addEventListener("blur", () => {
      const value = field.el.value.trim();
      if (!value) return; // don't nag before first submit attempt
      if (field.el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setFieldError(field, msgEmail);
      } else {
        setFieldError(field, null);
      }
    });
  });

  function showStatus(kind: "success" | "error", title: string, body: string): void {
    if (!statusEl) return;
    statusEl.className = `form-status is-visible form-status--${kind}`;
    statusEl.innerHTML = "";
    const t = document.createElement("p");
    t.textContent = title;
    const b = document.createElement("p");
    b.textContent = body;
    statusEl.append(t, b);
    statusEl.setAttribute("tabindex", "-1");
    statusEl.focus();
  }

  function buildMailto(data: Record<string, string>): string {
    const subject = `Projektanfrage (${data.projectType}) — ${data.name}`;
    const bodyLines = [
      `Name: ${data.name}`,
      `E-Mail: ${data.email}`,
      data.organisation ? `Organisation: ${data.organisation}` : null,
      `Projektart: ${data.projectType}`,
      "",
      data.message,
    ].filter((line): line is string => line !== null);
    const params = new URLSearchParams({ subject, body: bodyLines.join("\n") });
    return `mailto:${CONTACT_EMAIL}?${params.toString().replace(/\+/g, "%20")}`;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validate()) {
      const firstInvalid = requiredFields.find((f) => f.wrapper.classList.contains("has-error"));
      firstInvalid?.el.focus();
      return;
    }

    const data: Record<string, string> = {};
    new FormData(form).forEach((value, key) => {
      data[key] = String(value);
    });

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = msgSending;
    }

    const successTitle = form.dataset.successTitle || "";
    const successBody = form.dataset.successBody || "";

    window.setTimeout(() => {
      window.location.href = buildMailto(data);
      showStatus("success", successTitle, successBody);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = msgSubmit;
      }
    }, 300);
  });
}

function init(): void {
  initNavToggle();
  initNavDropdowns();
  initScrollReveal();
  initContactForm();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
