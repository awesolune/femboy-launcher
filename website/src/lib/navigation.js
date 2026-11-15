import { parse, serialize } from 'parse5';
import { sectionPage } from './routes.js';

// Retarget old landing-page links while preserving local anchors and downloads.
export function rewriteSectionLinks(html, base = '/') {
  const tree = parse(html), ids = new Set();
  const walk = (node, fn) => { fn(node); for (const child of node.childNodes || []) walk(child, fn); };
  walk(tree, node => { const id = node.attrs?.find(a => a.name === 'id'); if (id) ids.add(id.value); });
  walk(tree, node => {
    if (node.tagName !== 'a' || node.attrs?.some(a => a.name === 'data-language-link')) return;
    const href = node.attrs?.find(a => a.name === 'href');
    if (!href || !href.value.includes('#')) return;
    const [url, hash] = href.value.split('#');
    if (url && url !== base && url !== base + 'en/') return;
    if (!url && ids.has(hash)) return;
    const page = sectionPage(hash);
    if (page === null) return;
    href.value = base + page + '#' + (hash === 'feedback' ? 'contacts-title' : hash);
  });
  return serialize(tree);
}
