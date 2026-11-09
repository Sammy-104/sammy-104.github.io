import fs from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const root = new URL('../', import.meta.url);
export function loadPages() {
  const context = vm.createContext({ window: {} });
  for (const file of ['content.js', 'pages.js']) {
    vm.runInContext(fs.readFileSync(new URL(file, root), 'utf8'), context, { filename: file });
  }
  return { pages: context.PortfolioPages, config: context.window.PORTFOLIO };
}
const origin = 'https://samuelshaw.ca';
function structuredData(path) {
  const context = 'https://schema.org';
  if (path === '/') return { '@context': context, '@type': 'WebSite', name: 'Samuel Shaw', url: origin + '/' };
  if (path === '/about/') return {
    '@context': context,
    '@type': 'ProfilePage',
    url: origin + path,
    mainEntity: {
      '@type': 'Person',
      '@id': origin + '/#samuel-shaw',
      name: 'Samuel Shaw',
      url: origin + '/',
      sameAs: ['https://github.com/Sammy-104', 'https://www.linkedin.com/in/samuel-robert-shaw/']
    }
  };
}

export function documentFor(result) {
  const schema = structuredData(result.canonicalPath);
  const schemaTag = schema ? '  <script type="application/ld+json">' + JSON.stringify(schema) + '</script>\n' : '';
  const escape = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return fs.readFileSync(new URL('scripts/page-template.html', root), 'utf8')
    .replace(/src="\/(content|pages|app|background)\.js"/g, (_, name) => {
      const revision = createHash('sha256').update(fs.readFileSync(new URL(name + '.js', root))).digest('hex').slice(0, 12);
      return 'src="/' + name + '.js?v=' + revision + '"';
    })
    .replace('href="/styles.css"', () => 'href="/styles.css?v=' + createHash('sha256').update(fs.readFileSync(new URL('styles.css', root))).digest('hex').slice(0, 12) + '"')
    .replace('</head>', () => schemaTag + '</head>')
    .replace(/<title>.*?<\/title>/, () => '<title>' + escape(result.title) + '</title>')
    .replace(/<meta name="description" content="[^"]*">/, () => '<meta name="description" content="' + escape(result.description) + '">')
    .replace(/<link rel="canonical" href="[^"]*">/, () => result.notFound ? '<meta name="robots" content="noindex">' : '<link rel="canonical" href="https://samuelshaw.ca' + result.canonicalPath + '">')
    .replace(/<a href="([^\"]*)" data-nav="([^\"]*)">/g, (tag, href, page) => page === result.page ? tag.replace('>', ' aria-current="page">') : tag)
    .replace('<main id="main" tabindex="-1"></main>', () => '<main id="main" tabindex="-1" data-page="' + result.page + '" data-route="' + result.canonicalPath + '">' + result.html + '</main>');
}
export function build() {
  const { pages, config } = loadPages();
  for (const route of [...pages.routes, '/404.html']) {
    const file = new URL(route === '/404.html' ? '404.html' : route.slice(1) + 'index.html', root);
    fs.mkdirSync(new URL('.', file), { recursive: true });
    fs.writeFileSync(file, documentFor(pages.render(config, route)));
  }
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + pages.routes.map(route => '  <url><loc>https://samuelshaw.ca' + route + '</loc></url>').join('\n') + '\n</urlset>\n';
  fs.writeFileSync(new URL('sitemap.xml', root), sitemap);
  console.log('Generated five static pages, 404.html, and sitemap.xml.');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) build();
