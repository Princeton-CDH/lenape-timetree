/*
 * For details on the Lighthouse CI configuration API, see:
 * https://github.com/GoogleChrome/lighthouse-ci/blob/master/docs/configuration.md
 */

module.exports = {
  ci: {
    collect: {
      staticDistDir: "./public",
      // if new page types are added to the site, they must be added here also
      url: [
        "/",
        // "/about/",
        // "/404.html"
    ]
    },
    assert: {
      preset: "lighthouse:no-pwa",
      assertions: {
        /* Can't find an explicit mapping from mailures to IDs.
        However, in the Lighthouse interface, the div's ID is the key.
        A list of SOME tests:
        https://github.com/GoogleChrome/lighthouse-ci/blob/72107f3bf462ab60596f576967ff1a5e0aad622b/packages/utils/src/presets/all.js
        IDs are also available in GH Actions output. */
      }
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
