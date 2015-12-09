require(['../config'], function(config) {
    require(['jquery', 'c4/APIconnector', 'c4/paragraphDetection', 'c4/searchBar/searchBar', 'c4/iframes'], function($, api, paragraphDetection, searchBar, iframes) {
        var origin = {
            clientType: "c4 example",
            clientVersion: "0.0.1",
            userID: "testUser"
        };
        window.onmessage = function(msg) {
            if (msg.data.event && msg.data.event === 'eexcess.currentResults') {
                iframes.sendMsgAll({
                    event: 'eexcess.newResults',
                    data: api.getCurrent()
                });
            }
        };
        // set origin in the APIconnector
        api.init({
            origin: origin
        });

        // add searchResultListVis widget to display results
        var tabs = [{
                name: "search results",
                // here we use the widget from Github directly for demonstration purposes. You should avoid this and instead clone the visualization-widgets repository into your project or add it as submodule.
                url: "http://rawgit.com/EEXCESS/visualization-widgets/feature/SearchResVis/SearchResultListVis/index.html",
                icon: "http://rawgit.com/EEXCESS/visualization-widgets/master/SearchResultListVis/icon.png"
            },
            {
                name: "facet scape",
                // here we use the widget from Github directly for demonstration purposes. You should avoid this and instead clone the visualization-widgets repository into your project or add it as submodule.
                url: "http://rawgit.com/EEXCESS/visualization-widgets/master/FacetScape/index.html",
                icon: "http://rawgit.com/EEXCESS/visualization-widgets/master/FacetScape/icon.png",
                deferLoading: true
            }];
        // initialize the searchBar with the specified tabs and the path to the image folder
        searchBar.init(tabs, {imgPATH: '../../searchBar/img/', queryCrumbs: {active: true}, origin: origin});
        // detect paragraphs
        var paragraphs = paragraphDetection.getParagraphs(document, {addSubparagraphs: true});
        // draw silver border around detected paragraphs
        $('.eexcess_detected_par').css('border', '1px dotted silver');

        // listen for paragraph focused events
        var focusedParagraph;
        $(document).on('paragraphFocused', function(e) {
            if (focusedParagraph !== e.originalEvent.detail.paragraph) {
                var eventDetail = e.originalEvent.detail;
                focusedParagraph = eventDetail.paragraph;
                // reset background color on all detected paragraphs
                $.each(paragraphs, function() {
                    $(this.elements[0]).parent().css('background-color', 'white');
                });
                // color background on focused paragraph
                $(eventDetail.paragraph.elements[0]).parent().css('background-color', 'cyan');
                // generate query from focused paragraph and set it in the search bar
                var immediately = eventDetail.trigger && eventDetail.trigger === 'click';
                paragraphDetection.paragraphsToQueries(focusedParagraph.subparagraphs, function(res) {
                    searchBar.setQueries(res.queries, immediately);
                }, focusedParagraph.headline);
            }
        });
        // start detection of focused paragraphs
        paragraphDetection.findFocusedParagraphSimple();
    });
});

