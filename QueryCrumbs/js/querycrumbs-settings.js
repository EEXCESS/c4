/**
 *
 * @module c4/queryCrumbs-settings
 */
define(['ColorBrewer'], function (colorbrewer) {

    var QueryCrumbsConfiguration = {
        /*
         The qualitative color palette used to color the background of the query rectangles.
         - Colors should be easily distinguishable.
         - Colors should allow to construct a lighter and a darker version and be still distinguishable from all other colors.
         - Using colorbrewer library (http://colorbrewer2.org/). Color Set1 is suitable for colorblind people.
         */
        colorSettings: {
            baseColors: colorbrewer["Set3"]["12"],
                // params for color-coded similarity
                newDocOpacity: 0.1,
                oldDocOpacity: 0.6,
                // if similarity of a node exceeds this threshold it gets the same color
                colorThreshold: 0.1
        },
        /*
         Uses the base colors defined in QueryCrumbsConfiguration.base_colors. Several basic distinct colors can be defined here. When appending a new node to the QueryCrumbs, we assign
         one of these colors to the node. If the similarity of the new node compared to the previous node is below a
         certain threshold 'colorThreshold', we assign the color which comes next in this list to the new node. Otherwise
         the new node gets the same color as the previous nod.
         */
        BaseColorManager: {
            getInitialColor: function () {
                return QueryCrumbsConfiguration.colorSettings.baseColors[0];
            },
            getNextColor: function (preNodeColor) {
                var cIdx = (QueryCrumbsConfiguration.colorSettings.baseColors.indexOf(preNodeColor) + 1) % QueryCrumbsConfiguration.colorSettings.baseColors.length;
                return QueryCrumbsConfiguration.colorSettings.baseColors[cIdx];
            }
        },
        // Query Crumbs dimensions
        dimensions: {
            // the number of visuals (= the number of queries to show)
            HISTORY_LENGTH: 11,
                // the maximum number of segments to show in each visual (each area corresponds to one document)
                SEGMENTS: null,
                /* Dimensions for the SQUARE visual type
                 This will be initialized below (docRectHorizontal * docRectVertical == SEGMENTS)
                 */
                // the number of columns - valid for the type SQUARE only
                docRectHorizontal: 4,
                // the number of rows - valid for the type SQUARE only
                docRectVertical: 4,
                rectHeight: 20,
                rectWidth: 20,
                rectBorderWidth: 2,
                rectInfoVertPadding: 5,
                rectInfoFontSize: 10,

                // Distance between two visual nodes
                edgeWidth: 10,
                // Position of the left-most visual node (x == y)
                circle_cxy: 25,
                // radius of the visual node (if it's a circle)
                circle_r: 13
        },
        // The skill level of an user. (BEGINNER, EXPERT, INTERMEDIATE)
        skillLevel: "",
            // Changes the form of the nodes. (SQUARE, CIRCLE)
            nodeForm: ""
    };

    QueryCrumbsConfiguration.skillLevel = "INTERMEDIATE";
    QueryCrumbsConfiguration.nodeForm = "CIRCLE";
    if (QueryCrumbsConfiguration.nodeForm != "CIRCLE") {
        QueryCrumbsConfiguration.dimensions.SEGMENTS = QueryCrumbsConfiguration.dimensions.docRectHorizontal * QueryCrumbsConfiguration.dimensions.docRectVertical;
    }

    return QueryCrumbsConfiguration;
});