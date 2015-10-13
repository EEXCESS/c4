This example shows the usage of the [APIconnector](../APIconnector.js), [searchBar](../searchBar/searchBar.js) and [paragraphDetection](../paragraphDetection.js) module.  
Check out the [live demo](http://rawgit.com/EEXCESS/c4/master/examples/searchBar_Paragraphs/index.html).  
The example detects paragraphs in the page and detects when a paragraph is focused. In addition it adds a search bar to the bottom of the page. When a paragraph is focused, the keywords from this paragraph are extracted and displayed in the search bar as query. This query is executed and the results can be displayed in the searchResultListVis widget included from [visualization widgets](https://github.com/EEXCESS/visualization-widgets). The search bar allows the user to interact with the query, e.g. add keywords, (de-)activate keywords, edit the main topic, etc.

The relevant files are [index.html](index.html) and [example.js](example.js).
# index.html
The relevant parts in this file is the inclusion of the `example.js` script via requirejs and the inclusion of the relevant css-files.
* inclusion of `example.js`
  ```html
  <script data-main="example" src="../lib/require.js"></script>
  ```
  
* inclusion of css-files
  ```html
  <link rel="stylesheet" href="../../searchBar/searchBar.css" />
  <link rel="stylesheet" href="../lib/css/jquery-ui.css" />
  <link rel="stylesheet" href="../lib/css/jquery.tagit.css" />
  ```
  
# example.js
In principle, this file is where all work is done, it is heavily commented, so have a look at the source code to get the details.

 