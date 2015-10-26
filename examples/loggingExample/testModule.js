require(['../config'], function(config) {
    /**
     * Use methods from the client-logging API to send client-side 'window.postMessages' in the correct format.
     */
    require(['jquery', 'c4/logging'], function($, logging) {

        /* Initialize logging with the origin object. Only 'origin.module' is mandatory, 'origin.clientType', 'origin.clientVersion' and 'origin.userID' will be appended by c4/APIconnector. */
        var loggingConfig = {
            origin: {
                module: "testModuleName"
            }
        };
        logging.init(loggingConfig);

        /* Some dummy data to log */
        var dummyQueryID = "849384894839";
        var dummyDocumentBadge = {
            id: "995eb36f-151d-356c-b00c-4ef419bc2124",
            uri: "http://www.mendeley.com/research/hellenism-homoeroticism-shelley-circle",
            provider: "Mendeley"
        };
        var dummyQuery = {
            origin: loggingConfig.origin,
            contextKeywords: [
                {
                    "text": "women",
                    "type": "misc",
                    "uri": "http://dbpedia.com/resource/woman",
                    "isMainTopic": false
                }]
        };
        var dummyDetailsQuery = {
            origin: loggingConfig.origin,
            documentBadge: [
                {
                    id: "/09003/4A65C4999F4077781A1F9CF2510EE512CD6571B9",
                    uri: "http://europeana.eu/resolve/record/09003/4A65C4999F4077781A1F9CF2510EE512CD6571B9",
                    provider: "Europeana"
                }
            ],
            queryID: "70342716"
        };

        $('#query').submit(function(evt) {
            //evt.preventDefault();
            window.top.postMessage({event: "eexcess.queryTriggered", data: dummyQuery}, '*');
            return false;
        });
        $('#detailsQuery').submit(function(evt) {
            window.top.postMessage({event: "eexcess.detailsRequest", data: dummyDetailsQuery}, '*');
            return false;
        });
        $('#moOp').click(function(evt) {
            logging.moduleOpened("anotherModuleName");
            return false;
        });
        $('#moCl').submit(function(evt) {
            logging.moduleClosed("anotherModuleName", 475839);
            return false;
        });
        $('#moSt').submit(function(evt) {
            logging.moduleStatisticsCollected({mystats: "lalelu"});
            return false;
        });
        $('#itOp').submit(function(evt) {
            logging.itemOpened(dummyDocumentBadge, dummyQueryID);
            return false;
        });
        $('#itCl').submit(function(evt) {
            logging.itemClosed(dummyDocumentBadge, dummyQueryID, 8437);
            return false;
        });
        $('#itCiAsIm').submit(function(evt) {
            logging.itemCitedAsImage(dummyDocumentBadge, dummyQueryID);
            return false;
        });
        $('#itCiAsTe').submit(function(evt) {
            logging.itemCitedAsText(dummyDocumentBadge, dummyQueryID);
            return false;
        });
        $('#itCiAsHy').submit(function(evt) {
            logging.itemCitedAsHyperlink(dummyDocumentBadge, dummyQueryID);
            return false;
        });
        $('#itRa').submit(function(evt) {
            logging.itemRated(dummyDocumentBadge, dummyQueryID, 0, 4, 3);
            return false;
        });
    });
});

