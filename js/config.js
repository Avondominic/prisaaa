/* ================================================================
   CONFIG — the only file you need to edit for content.

   Everything in [SQUARE BRACKETS] is a placeholder. Replace it.
   Asset paths are relative to index.html. Images can be .gif,
   .webp, .png, .jpg or .svg; short looping clips can be .mp4 or
   .webm (they play muted, inline, on loop — much lighter than GIF).
================================================================= */
window.BIRTHDAY = {

  /* ---------- who it's for ---------- */
  name: "[NAME]",
  pageTitle: "a little something for you",

  /* ---------- 1. intro ---------- */
  intro: {
    tag: "psst",                     // small handwritten tag above the cat
    greeting: "HEY!!",
    line: "I made something for you...",
    hint: "(choose wisely)",         // handwritten note pointing at the buttons
    yes: "YES",
    no: "no",

    // Shown one after another each time NO is pressed (loops on the last one).
    noReplies: [
      "excuse me??",
      "wrong button.",
      "the cat is judging you.",
      "try that again.",
      "it's literally a surprise. press yes."
    ],
    // The NO button's label changes with each press (stays on the last one).
    noLabels: ["no", "still no?", "really??", "be serious", "…ok fine"],

    yesReply: "YAY. good choice."
  },

  /* ---------- 2. opening ---------- */
  opening: {
    text: "opening",
    durationMs: 1800                 // how long the "opening..." moment lasts
  },

  /* ---------- 3. reveal ---------- */
  reveal: {
    title: "Happy Birthday",
    // The three goofy images. Leave src empty ("") to keep the placeholder.
    goofy: [
      { src: "", alt: "[GOOFY IMAGE 1 DESCRIPTION]" },
      { src: "", alt: "[GOOFY IMAGE 2 DESCRIPTION]" },
      { src: "", alt: "[GOOFY IMAGE 3 DESCRIPTION]" }
    ]
  },

  /* ---------- 4. song (never autoplays) ---------- */
  song: {
    title: "[SONG TITLE]",
    artist: "[SONG ARTIST]",
    src: "assets/music/song.mp3"     // drop your .mp3 here with this exact name
  },

  /* ---------- 5. memories ---------- */
  memories: [
    // { src: "assets/memories/01.jpg", caption: "[CAPTION]", date: "[DATE]" },
  ],

  /* ---------- 6. letter ---------- */
  letter: {
    greeting: "[GREETING],",
    body: "[YOUR MESSAGE GOES HERE. Use a blank line between paragraphs.]",
    signature: "[YOUR NAME]"
  },

  /* ---------- hidden easter egg ---------- */
  easterEgg: {
    enabled: true,
    // Which cat to tap, and how many times in a row.
    // target: any element id; "reveal-cat" is the cat on the birthday reveal.
    trigger: { target: "reveal-cat", taps: 5 },
    message: "[EASTER EGG MESSAGE]"
  },

  /* ---------- cat reactions ----------
     One image per mood. Replace the placeholder SVGs with your own
     cat GIFs / stickers / clips. */
  cats: {
    neutral: { src: "assets/cats/cat-neutral.svg", alt: "a cat, waiting" },
    happy:   { src: "assets/cats/cat-happy.svg",   alt: "a very happy cat" },
    angry:   { src: "assets/cats/cat-angry.svg",   alt: "an offended cat" },
    shock:   { src: "assets/cats/cat-shock.svg",   alt: "a shocked cat" },
    love:    { src: "assets/cats/cat-love.svg",    alt: "a cat in love" }
  }
};
