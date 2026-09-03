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
  // AYVIE — a four-point spark/instance glyph, deliberately distinct from
  // "brain" (used elsewhere) so AYVIE reads as its own central entity.
  spark: `<svg viewBox="0 0 24 24" ${stroke}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><circle cx="18.5" cy="18.5" r="1.6"/></svg>`,
  // AI Workers — a simple worker/agent head, distinct from the more organic
  // "brain" glyph to signal an executing unit rather than the thinking layer.
  bot: `<svg viewBox="0 0 24 24" ${stroke}><rect x="5.5" y="8.5" width="13" height="9.5" rx="2.2"/><circle cx="9.5" cy="13" r="1.1"/><circle cx="14.5" cy="13" r="1.1"/><path d="M12 8.5V5.3M9.2 5.3h5.6"/><path d="M3.2 12h2.3M18.5 12h2.3"/></svg>`,
  // Dashboard / Control Layer — a gauge/dial, reads as monitoring & control.
  gauge: `<svg viewBox="0 0 24 24" ${stroke}><path d="M4.5 16a7.5 7.5 0 1 1 15 0"/><path d="M12 16l3.6-4.6"/><circle cx="12" cy="16" r="1.2"/><path d="M4.5 16h-1.3M20.8 16h-1.3"/></svg>`,
  // Knowledge Infrastructure — a stacked database, reads as structured
  // storage rather than the more abstract "layers" glyph used elsewhere.
  database: `<svg viewBox="0 0 24 24" ${stroke}><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6"/><path d="M5 12v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-6"/></svg>`,
};
