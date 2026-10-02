# a little birthday surprise

One continuous, interactive birthday experience — no page hopping, no
"continue" buttons. Plain HTML / CSS / JavaScript, no build step.

```
intro → opening → reveal → song → memories → letter → gift → finale
```

> **Work in progress.** Built so far: project skeleton, styling system,
> scene controller, cat reactions, **intro**, **opening** and the **birthday
> reveal** (with the easter egg). Song, memories, letter, gift and finale come next.

## Make it yours

1. **All text, names and file paths live in [`js/config.js`](js/config.js).**
   Anything in `[SQUARE BRACKETS]` is a placeholder.
2. Drop your files into `assets/` (see [`assets/README.md`](assets/README.md))
   and update the matching paths in `config.js`.
3. Colours, fonts and motion timing live in [`css/tokens.css`](css/tokens.css).

The easter egg is under `easterEgg` in `config.js`: pick which element to tap
(`trigger.target`, default the big cat on the reveal), how many taps
(`trigger.taps`) and the secret `message`.

The three goofy images on the reveal are `reveal.goofy` — set each `src`
(e.g. `assets/goofy/1.jpg`) and `caption`; empty `src` shows a placeholder.
Music never autoplays — it only starts from the song section's player.

## Preview

Double-click `index.html`, or for the most accurate result run a tiny local server:

```
python3 -m http.server
```

then open <http://localhost:8000>.

## Project structure

```
index.html            every scene lives here as a <section data-scene>
css/
  fonts.css           self-hosted fonts
  tokens.css          colours, type, spacing, easing
  base.css            reset, page canvas, accessibility helpers
  components.css      buttons, sticker, tape, tag, doodles, reaction toast
  scenes.css          per-scene layout
  motion.css          keyframes + reduced-motion overrides
js/
  config.js           ← edit this
  utils.js            helpers (animation, media, text binding)
  reactions.js        cat reaction system
  scenes.js           scene controller
  intro.js            scene 1
  opening.js          scene 2
  reveal.js           scene 3 — birthday reveal
  easter-egg.js       hidden tap-to-unlock note
  parallax.js         subtle mouse parallax on desktop (off for touch / reduced motion)
  main.js             boot
assets/               cats, goofy images, memories, music, fonts
```

## Accessibility

- Respects `prefers-reduced-motion` (motion becomes short fades).
- Keyboard friendly; focus follows each scene; reactions are announced to
  screen readers.
- Designed for desktop first (1280×720 → 1920×1080), with tablet and phone
  (down to ~390px wide) fully supported.

## License

MIT — see [LICENSE](LICENSE). Fonts (Bricolage Grotesque, Caveat, Figtree)
are under the SIL Open Font License.
