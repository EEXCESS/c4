require(['../config'], function (config) {
    // load dependencies
    require(['c4/cmsMarkup'], function (cms) {
        // detect markup
        var detected_Markup = cms.detectMarkup();
        $('#detected-markup').text(detected_Markup === cms.markup.WIKI_CODE);

        // insert text reference
        $('#insert-text-ref').click(function() {
            var documentInformation = {
                documentBadge: {
                    uri: "http://www.example.org"
                },
                mediaType: "text",
                title: "Example Paper"
            };
            $('#wpTextbox1').text(cms.createMarkup(documentInformation, detected_Markup));
        });
    });
});