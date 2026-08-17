// Hand-drawn, dependency-free line icons (24x24, stroke-based).
// Kept intentionally simple and geometric to match the "precision engineering"
// character of the brand rather than pulling in an icon library.

const stroke = 'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"';

export const icons = {
  brain: `<svg viewBox="0 0 24 24" ${stroke}><circle cx="6" cy="7" r="2.4"/><circle cx="18" cy="7" r="2.4"/><circle cx="12" cy="12" r="2.6"/><circle cx="7" cy="17" r="2.2"/><circle cx="17" cy="17" r="2.2"/><path d="M8.1 8.5 10 10.5M15.9 8.5 14 10.5M10 14 8.5 15.4M14 14l1.5 1.4"/></svg>`,
  code: `<svg viewBox="0 0 24 24" ${stroke}><path d="M9 6 3.5 12 9 18M15 6l5.5 6L15 18"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" ${stroke}><path d="M12 3 21 8l-9 5-9-5 9-5Z"/><path d="M3 12l9 5 9-5"/><path d="M3 16l9 5 9-5"/></svg>`,
  workflow: `<svg viewBox="0 0 24 24" ${stroke}><rect x="3" y="4" width="6" height="5" rx="1"/><rect x="15" y="4" width="6" height="5" rx="1"/><rect x="9" y="15" width="6" height="5" rx="1"/><path d="M6 9v3h12V9M12 12v3"/></svg>`,
  wrench: `<svg viewBox="0 0 24 24" ${stroke}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L4 16.7 7.3 20l5.3-5.3a4 4 0 0 0 5.1-5.4l-3 3-2.4-2.4 3-3Z"/></svg>`,
  cpu: `<svg viewBox="0 0 24 24" ${stroke}><rect x="7" y="7" width="10" height="10" rx="1.4"/><rect x="10" y="10" width="4" height="4" rx="0.6"/><path d="M9 3v2M12 3v2M15 3v2M9 19v2M12 19v2M15 19v2M3 9h2M3 12h2M3 15h2M19 9h2M19 12h2M19 15h2"/></svg>`,
};
