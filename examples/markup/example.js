require(['../config'], function (config) {
    // load dependencies
    require(['c4/cmsMarkup'], function (cms) {
        // detect markup
        var detected_Markup = cms.detectMarkup();
        $('#detected-markup').text(detected_Markup === cms.markup.WIKI_CODE);

        var insertReference = function(reference) {
            var textarea = $('#wpTextbox1')[0];
            textarea.value += "\n" + reference;
            textarea.scrollTop = textarea.scrollHeight;
        };

        // insert text reference
        $('#insert-text-ref').click(function() {
            var documentInformation = {
                documentBadge: {
                    uri: "http://www.example.org"
                },
                mediaType: "text",
                title: "Example Paper"
            };
            insertReference(cms.createMarkup(documentInformation, detected_Markup));
        });

        // insert image reference
        $('#insert-image-ref').click(function() {
            var documentInformation = {
                mediaType: "image",
                title: "File:Example Image.jpg"
            };
            insertReference(cms.createMarkup(documentInformation, detected_Markup));
        });
    });
});