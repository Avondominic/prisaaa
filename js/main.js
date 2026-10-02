/* ================================================================
   MAIN — fill text from config, then start the experience
================================================================= */
(() => {
  const config = window.BIRTHDAY;

  document.title = config.pageTitle;
  U.bindText(config);

  Scenes.start();
})();
