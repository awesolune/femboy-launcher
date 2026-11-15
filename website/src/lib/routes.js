export const SITE_PAGES = ['', 'features/', 'interface/', 'download/', 'help/', 'releases/', 'guides/setup-or-portable/', 'guides/install-modrinth-modpack/', 'privacy/', 'code-signing/'];

export function sectionPage(id) {
  if (id === 'download') return 'download/';
  if (id === 'features' || id.startsWith('feature-')) return 'features/';
  if (id === 'gallery' || id === 'themes' || id === 'compare-range') return 'interface/';
  if (id === 'start' || id === 'help' || id.startsWith('help-') || id === 'faq' || id.startsWith('faq-') || id === 'feedback') return 'help/';
  if (id === 'overview' || id === 'top') return '';
  return null;
}
