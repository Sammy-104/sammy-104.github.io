# Samuel Shaw — Portfolio

Personal portfolio for Samuel Shaw, a Mechatronics Engineering student at the University of Waterloo searching for spring 2027 internships.

Static HTML, CSS, and JavaScript. The repository root is the published website. Generated HTML is committed, so GitHub Pages needs no build service or JavaScript to show the content.

- Home: introduction and recent projects.
- About: seven photos with editable captions saved in the visitor’s browser and a JSON export.
- Projects: Digital Music Library and Vollo, with screenshots and the Vollo demo video.
- Background: pixel mountains with a cursor-following sun behind the terrain, dynamic lighting and clouds. OffscreenCanvas runs in a worker when supported, with a compatibility fallback, hidden-page pause, and reduced-motion support.

Use `npm run dev` to regenerate pages and start a local HTTP server. Public URLs are `/`, `/about/`, `/projects/`, `/projects/library/`, and `/projects/vollo/`. Each URL has a complete HTML document, title, description, canonical URL, and crawlable navigation. Existing `/#/...` links migrate to the matching clean URL in the browser. Navigation uses the History API when JavaScript is enabled and normal page loads otherwise.

Edit copy and media in `content.js`, shared rendering in `pages.js`, browser interactions in `app.js`, layouts in `styles.css`, and animation in `background.js`. Media is in `media/`; keep asset URLs root-relative. The document shell is `scripts/page-template.html`.

After edits, run `npm run build` to regenerate all five pages, `404.html`, and `sitemap.xml`. Run `npm test` to check direct-page content, metadata, local assets, navigation, Back, and old hash links. Commit the generated HTML and sitemap along with source edits. The shared renderer is used for both generation and browser navigation to keep the content consistent.

`CNAME` retains samuelshaw.ca. `vercel.json` serves the repository root as a static site. `.nojekyll` allows GitHub Pages to serve the files directly. The previous website pages and assets have been replaced; Git history retains earlier revisions.
