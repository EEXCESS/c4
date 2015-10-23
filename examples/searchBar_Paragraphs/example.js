// requirejs configuration. This may be handled by your bower/grunt/requirejs workflow automatically.
requirejs.config({
    baseUrl: '../lib/',
    paths: {
        jquery: 'jquery-1.11.3.min',
        c4: '../../'
    }
});

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
            url:"http://rawgit.com/EEXCESS/visualization-widgets/master/SearchResultListVis/index.html"
    },{
            name:"other widget",
            // here we use the widget from Github directly for demonstration purposes. You should avoid this and instead clone the visualization-widgets repository into your project or add it as submodule.
            url:"http://rawgit.com/EEXCESS/visualization-widgets/master/SearchResultListVis/index.html"
    },{
            name:"third widget",
            // here we use the widget from Github directly for demonstration purposes. You should avoid this and instead clone the visualization-widgets repository into your project or add it as submodule.
            url:"http://rawgit.com/EEXCESS/visualization-widgets/master/SearchResultListVis/index.html"
    }];
    // initialize the searchBar with the specified tabs and the path to the image folder
    searchBar.init(tabs, {imgPATH: '../../searchBar/img/'});

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