"use strict";
const CONTACT_EMAIL = "auvexissystems@gmail.com";
function initNavToggle() {
    const header = document.querySelector("[data-header]");
    const toggle = header === null || header === void 0 ? void 0 : header.querySelector("[data-nav-toggle]");
    const nav = header === null || header === void 0 ? void 0 : header.querySelector("#main-nav");
    if (!header || !toggle || !nav)
        return;
    const setOpen = (open) => {
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
function initNavDropdowns() {
    const triggers = Array.from(document.querySelectorAll("[data-nav-dropdown-trigger]"));
    if (triggers.length === 0)
        return;
    const items = triggers
        .map((trigger) => trigger.closest(".main-nav__item--dropdown"))
        .filter((el) => el !== null);
    const closeAll = (except) => {
        items.forEach((item) => {
            var _a, _b;
            if (item === except)
                return;
            item.classList.remove("is-open");
            (_a = item.querySelector("[data-nav-dropdown-trigger]")) === null || _a === void 0 ? void 0 : _a.setAttribute("aria-expanded", "false");
            if (item.contains(document.activeElement)) {
                (_b = document.activeElement) === null || _b === void 0 ? void 0 : _b.blur();
            }
        });
    };
    triggers.forEach((trigger) => {
        trigger.addEventListener("click", () => {
            const item = trigger.closest(".main-nav__item--dropdown");
            if (!item)
                return;
            const isOpen = item.classList.contains("is-open");
            closeAll(isOpen ? undefined : item);
            item.classList.toggle("is-open", !isOpen);
            trigger.setAttribute("aria-expanded", String(!isOpen));
        });
    });
    items.forEach((item) => {
        item.addEventListener("mouseenter", () => closeAll(item));
        item.addEventListener("focusin", () => closeAll(item));
    });
    document.addEventListener("click", (event) => {
        const target = event.target;
        const clickedInsideAnyDropdown = items.some((item) => item.contains(target));
        if (!clickedInsideAnyDropdown)
            closeAll();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape")
            closeAll();
    });
}
function initScrollReveal() {
    const items = Array.from(document.querySelectorAll(".reveal"));
    if (items.length === 0)
        return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !("IntersectionObserver" in window)) {
        return;
    }
    items.forEach((el) => el.classList.add("reveal-pending"));
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                entry.target.classList.remove("reveal-pending");
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        }
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach((el) => observer.observe(el));
}
function initContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form)
        return;
    const statusEl = form.querySelector("[data-form-status]");
    const submitBtn = form.querySelector("[data-submit-btn]");
    const msgRequired = form.dataset.msgRequired || "This field is required.";
    const msgEmail = form.dataset.msgEmail || "Please enter a valid email address.";
    const msgSending = form.dataset.msgSending || "Sending …";
    const msgSubmit = form.dataset.msgSubmit || (submitBtn === null || submitBtn === void 0 ? void 0 : submitBtn.textContent) || "Send";
    const requiredFields = Array.from(form.querySelectorAll("[required]")).map((el) => {
        const wrapper = el.closest(".form-field") || el.parentElement;
        return { el, wrapper, errorEl: wrapper.querySelector(".form-field__error") };
    });
    function setFieldError(field, message) {
        if (message) {
            field.wrapper.classList.add("has-error");
            if (field.errorEl)
                field.errorEl.textContent = message;
            field.el.setAttribute("aria-invalid", "true");
        }
        else {
            field.wrapper.classList.remove("has-error");
            if (field.errorEl)
                field.errorEl.textContent = "";
            field.el.removeAttribute("aria-invalid");
        }
    }
    function validate() {
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
            if (!value)
                return;
            if (field.el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                setFieldError(field, msgEmail);
            }
            else {
                setFieldError(field, null);
            }
        });
    });
    function showStatus(kind, title, body) {
        if (!statusEl)
            return;
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
    function buildMailto(data) {
        const subject = `Projektanfrage (${data.projectType}) — ${data.name}`;
        const bodyLines = [
            `Name: ${data.name}`,
            `E-Mail: ${data.email}`,
            data.organisation ? `Organisation: ${data.organisation}` : null,
            `Projektart: ${data.projectType}`,
            "",
            data.message,
        ].filter((line) => line !== null);
        const params = new URLSearchParams({ subject, body: bodyLines.join("\n") });
        return `mailto:${CONTACT_EMAIL}?${params.toString().replace(/\+/g, "%20")}`;
    }
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!validate()) {
            const firstInvalid = requiredFields.find((f) => f.wrapper.classList.contains("has-error"));
            firstInvalid === null || firstInvalid === void 0 ? void 0 : firstInvalid.el.focus();
            return;
        }
        const data = {};
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
function init() {
    initNavToggle();
    initNavDropdowns();
    initScrollReveal();
    initContactForm();
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
}
else {
    init();
}
