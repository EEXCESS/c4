require(['../config'], function(config) {
    require(['jquery', 'c4/APIconnector', 'c4/paragraphDetection', 'c4/searchBar/searchBar'], function($, api, paragraphDetection, searchBar) {
        // set origin in the APIconnector
        api.init({origin: {
                clientType: "c4 example",
                clientVersion: "0.0.1",
                userID: "testUser"
            }});

    // add searchResultListVis widget to display results
    var tabs = [{
            name:"search results",
            // here we use the widget from Github directly for demonstration purposes. You should avoid this and instead clone the visualization-widgets repository into your project or add it as submodule.
            url:"http://rawgit.com/EEXCESS/visualization-widgets/feature/SearchResVis/SearchResultListVis/index.html",
            icon:"http://rawgit.com/EEXCESS/visualization-widgets/master/SearchResultListVis/icon.png"
    },
    {
            name:"dashboard",
            // here we use the widget from Github directly for demonstration purposes. You should avoid this and instead clone the visualization-widgets repository into your project or add it as submodule.
            url:"https://eexcess.github.io/visualization-widgets/Dashboard/index.html?a",
            icon:"http://rawgit.com/EEXCESS/visualization-widgets/master/Dashboard/icon.png"
    },
//    {
//            name:"power search",
//            // here we use the widget from Github directly for demonstration purposes. You should avoid this and instead clone the visualization-widgets repository into your project or add it as submodule.
//            url:"http://rawgit.com/EEXCESS/visualization-widgets/master/PowerSearch/index.html",
//            icon:"http://rawgit.com/EEXCESS/visualization-widgets/master/PowerSearch/icon.png"
//    },
    {
            name:"facet scape",
            // here we use the widget from Github directly for demonstration purposes. You should avoid this and instead clone the visualization-widgets repository into your project or add it as submodule.
            url:"http://rawgit.com/EEXCESS/visualization-widgets/master/FacetScape/index.html",
            icon:"http://rawgit.com/EEXCESS/visualization-widgets/master/FacetScape/icon.png"
    }];
    // initialize the searchBar with the specified tabs and the path to the image folder
    searchBar.init(tabs, {imgPATH: '../../searchBar/img/',queryCrumbs:{active:true}});
        // detect paragraphs
        var paragraphs = paragraphDetection.getParagraphs();
        // draw silver border around detected paragraphs
        $('.eexcess_detected_par').css('border', '1px dotted silver');

        // listen for paragraph focused events
        $(document).on('paragraphFocused', function(e) {
            // reset background color on all detected paragraphs
            $.each(paragraphs, function() {
                $(this.elements[0]).parent().css('background-color', 'white');
            });
            // color background on focused paragraph
            $(e.originalEvent.detail.elements[0]).parent().css('background-color', 'cyan');
            // generate query from focused paragraph and set it in the search bar
            paragraphDetection.paragraphToQuery(e.originalEvent.detail.content, function(paragraphStatistics) {
                // set query in search bar
                searchBar.setQuery(paragraphStatistics.query.contextKeywords);
            });
        });
        // start detection of focused paragraphs
        paragraphDetection.findFocusedParagraphSimple();
    });
});

