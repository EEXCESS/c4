require(['../config'], function (config) {
    // load dependencies
    require(['c4/cmsMarkup'], function (cms) {
        // detect markup
        var detected_Markup = cms.detectMarkup();
        $('#detected-markup').text(detected_Markup === cms.markup.WIKI_CODE);
    });
});