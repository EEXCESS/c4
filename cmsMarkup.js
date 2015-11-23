/**
 * CMS markup module
 * You can include the module either with require.js or in the normal html-way
 * Once included, its functionality (detecting markup and creating markup code) is available in a global 'cmsMarkup' variable.
 */
(function () {
    var cmsFunc = function ($) {
        const WIKI_CODE = 0;

        return {
            /**
             * Detects the used CMS and its markup language.
             *
             * @return {number} The detected markup's identifier. If unknown -1
             */
            detectMarkup: function () {
                // mediawiki
                var detected = $('meta[name=generator]').attr("content").indexOf("MediaWiki") >= 0; // meta-tag
                detected = detected && $('textarea#wpTextbox1').length === 1; // editor

                if (detected)
                    return WIKI_CODE;

                return -1;
            },
            /**
             * Creates the markup code for the given document badge.
             *
             * @param documentBadge
             * @param markup_identifier
             * @return {string} Markup code for the document badge. If markup's identifier is unknown 'undefined'.
             */
            createMarkup: function (documentBadge, markup_identifier) {
                switch (markup_identifier) {
                    case WIKI_CODE:
                        return ""; // TODO return markup in wikicode
                    default:
                        return undefined;
                }
            }
        };
    };

    if (typeof require !== 'undefined') {
        define(['jquery'], cmsFunc);
    } else {
        // requires jquery
        cmsMarkup = cmsFunc();
    }
})();