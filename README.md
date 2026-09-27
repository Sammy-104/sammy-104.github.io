# Samuel Shaw — Portfolio

Personal portfolio site for Samuel Shaw: Mechatronics Engineering student at the
University of Waterloo, technology leader, lifeguard, and musician.

Static HTML, CSS and JavaScript — **no build step, no dependencies, no framework.**

## Structure

```
.
├── index.html          # Home (hero, about, experience, projects, education, connect)
├── music-library.html  # Project report: Digitalized Sortable Music Library
├── styles.css          # Design system + all page styles
├── script.js           # Mobile nav, scroll reveals, scroll-spy
├── assets/             # Images (WebP with JPG/PNG fallbacks)
├── package.json        # Project metadata (must stay at the repo root)
├── vercel.json         # Static hosting config
└── .gitignore
```

## Running it locally

Any static file server works. With Node installed:

```bash
npm run dev
```

Then open the URL it prints (usually <http://localhost:3000>).

You can also just double-click `index.html` — there is no build step, so it
opens straight in a browser.

## Deploying to Vercel

1. Push this folder to a GitHub repository. **`package.json` must sit at the
   repository root**, not inside a subfolder.
2. In Vercel, click **Add New → Project** and import the repository.
3. Leave the defaults. `vercel.json` already declares it as a static site with
   no framework, serving from the repository root.
4. Deploy.

If Vercel reports *"No package.json found"*, the files were committed one level
too deep. Either move them up to the repository root, or set
**Project → Settings → General → Root Directory** to the subfolder.

## Accessibility & browser support

- All text meets WCAG AA contrast (minimum measured 5.1:1).
- Every interactive control has a touch target of at least 44×44 px.
- Animations are disabled under `prefers-reduced-motion`.
- Responsive from 390 px upward with no horizontal overflow.
