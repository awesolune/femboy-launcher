import { defineMiddleware } from 'astro:middleware';
import { localizeHtml } from './lib/localize.js';
import { rewriteSectionLinks } from './lib/navigation.js';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  if (!response.headers.get('content-type')?.includes('text/html')) return response;
  const english = context.url.pathname.startsWith(base + 'en/');
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('Content-Language', english ? 'en' : 'ru');
  const html = rewriteSectionLinks(await response.text(), base);
  return new Response(english ? localizeHtml(html, base) : html, { status: response.status, headers });
});
