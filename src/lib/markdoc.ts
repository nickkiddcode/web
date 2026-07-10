import Markdoc from '@markdoc/markdoc';

/** Render a Markdoc string (Keystatic fields.markdoc.inline) to HTML. */
export function renderMarkdoc(source: string): string {
  if (!source) return '';
  const html = Markdoc.renderers.html(Markdoc.transform(Markdoc.parse(source)));
  // Markdoc wraps output in <article>; the Webflow rich-text divs provide the block context.
  return html.replace(/^<article>/, '').replace(/<\/article>$/, '');
}
