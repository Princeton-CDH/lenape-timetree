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
      ],
    },
    assert: {
      preset: "lighthouse:no-pwa",
      assertions: {
        /* Can't find an explicit mapping from mailures to IDs.
        However, in the Lighthouse interface, the div's ID is the key.
        A list of SOME tests:
        https://github.com/GoogleChrome/lighthouse-ci/blob/72107f3bf462ab60596f576967ff1a5e0aad622b/packages/utils/src/presets/all.js
        IDs are also available in GH Actions output. */

        "csp-xss": "warn",
        // complains about passive event listeners for scroll; seems to be a d3 issue
        // (should be fixed in newer versions?)
        "uses-passive-event-listeners": "warn",

        // flags the leaves in the tree, which are too small when unzoomed
        // on some devices
        "tap-targets": "warn",

        // lighthouse flags google analytics js as unused...
        "unused-javascript": "warn",
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
