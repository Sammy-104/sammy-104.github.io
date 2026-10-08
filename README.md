# Samuel Shaw — Portfolio

Personal portfolio for Samuel Shaw, a Mechatronics Engineering student at the University of Waterloo searching for spring 2027 internships.

Static HTML, CSS, and JavaScript with no build step. The repository root is the published website.

- Home: introduction and recent projects.
- About: seven photos with editable captions saved in the visitor’s browser and a JSON export.
- Projects: Digital Music Library and Vollo, with screenshots and the Vollo demo video.
- Background: pixel mountains with a cursor-following sun behind the terrain, dynamic lighting and clouds. OffscreenCanvas runs in a worker when supported, with a compatibility fallback, hidden-page pause, and reduced-motion support.

Open `index.html` locally or use `npm run dev`. Hash routes allow direct links on static hosts, including `/#/about`, `/#/projects/library`, and `/#/projects/vollo`.

Edit copy in `content.js` and `app.js`, layouts in `styles.css`, and animation in `background.js`. Media is in `media/`.

`CNAME` retains samuelshaw.ca. `vercel.json` serves the repository root as a static site. `.nojekyll` allows GitHub Pages to serve the files directly. The previous website pages and assets have been replaced; Git history retains earlier revisions.
