const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const publicSiteUrl = String(process.env.PUBLIC_SITE_URL || 'https://housora.app').replace(/\/$/, '');
const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'route-manifest.json'), 'utf8'));
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');

function htmlFile(route) {
  return route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.replace(/^\//, '') + '.html');
}
function content(html, pattern) { return html.match(pattern)?.[1]?.trim() || ''; }
function count(html, pattern) { return (html.match(pattern) || []).length; }
function structuredTypes(html) {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(match => {
    try { return JSON.parse(match[1])['@type'] || 'unknown'; } catch (_) { return 'invalid'; }
  });
}

const rows = manifest.routes.filter(route => route.behavior === 'page').map(route => {
  const file = htmlFile(route.path);
  const html = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const canonicalTag = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i)?.[0] || html.match(/<link[^>]+href=["'][^"']+["'][^>]*rel=["']canonical["'][^>]*>/i)?.[0] || '';
  const canonical = canonicalTag.match(/href=["']([^"']+)/i)?.[1] || '';
  const description = content(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i);
  const og = name => content(html, new RegExp(`<meta[^>]+property=["']og:${name}["'][^>]+content=["']([^"']*)`, 'i'));
  const noindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
  return {
    route: route.path,
    status: html ? 200 : 0,
    canonical,
    indexability: noindex ? 'noindex' : 'index',
    title: content(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    description,
    h1Count: count(html, /<h1\b/gi),
    lang: content(html, /<html[^>]+\blang=["']([^"']+)/i),
    structuredData: structuredTypes(html),
    og: { url: og('url'), title: og('title'), description: og('description'), image: og('image') },
    twitter: { title: content(html, /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']*)/i), description: content(html, /<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']*)/i), image: content(html, /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']*)/i) },
    sitemapMembership: sitemap.includes(`<loc>${publicSiteUrl}${route.path}</loc>`)
  };
});

const report = { generatedAt: new Date().toISOString(), publicSiteUrl, routes: rows };
const reportDir = path.join(root, 'reports');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'seo-crawl.json'), JSON.stringify(report, null, 2) + '\n');
const columns = ['route', 'status', 'indexability', 'canonical', 'title', 'description', 'h1Count', 'lang', 'structuredData', 'og', 'sitemapMembership'];
const markdown = ['# Housora SEO crawl', '', `Generated: ${report.generatedAt}`, `Public site URL: ${publicSiteUrl}`, '', `| ${columns.join(' | ')} |`, `| ${columns.map(() => '---').join(' | ')} |`, ...rows.map(row => `| ${columns.map(column => {
  const value = column === 'structuredData' ? row.structuredData.join(', ') : column === 'og' ? `${row.og.url} / ${row.og.title} / ${row.og.description} / ${row.og.image}` : row[column];
  return String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
}).join(' | ')} |`), ''].join('\n');
fs.writeFileSync(path.join(reportDir, 'seo-crawl.md'), markdown);
console.log(`SEO crawl written to reports/seo-crawl.json and reports/seo-crawl.md (${rows.length} page routes).`);

const failures = rows.filter(row => row.status !== 200 || !row.canonical || !row.title || !row.description || row.h1Count !== 1 || row.lang !== 'en' || !row.og.url || !row.og.title || !row.og.description || !row.og.image || !row.twitter.title || !row.twitter.description || !row.twitter.image || (row.indexability === 'index' && !row.sitemapMembership));
if (failures.length) {
  console.error(`${failures.length} SEO route checks need attention.`);
  process.exitCode = 1;
}
