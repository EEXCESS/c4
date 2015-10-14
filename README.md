C4 - Cultural and sCientific Content in Context

# Installation
The simplest way is to use [bower](http://bower.io/). C4 is available in the package repository, so `bower install c4` will install everything you need.  
After c4 is installed, you might need to configure the paths for requirejs. This can be comfortably automated with [grunt-bower-requirejs](https://github.com/yeoman/grunt-bower-requirejs). If you choose to configure the paths manually, your configuration might look similar to this (first part of the script, in which you want to use c4 modules):
```javascript
requirejs.config({
  baseUrl: 'bower_components/',
  paths: {
    jquery: 'jquery/dist/jquery',
    "jquery-ui":'jquery-ui/jquery-ui',
    graph:'graph/lib/graph',
    "tag-it":'tag-it/js/tag-it'
  }
});
```

Once the paths are configured, you need to include your script via requirejs as usual, for example like so:
```html
<script data-main="myScript" src="bower_components/requirejs/require.js"></script>
```
where `myScript` is the script you want to execute and in which you use c4 modules.

# Module Overview
* ```APIconnector``` A module that simplifies requests to the EEXCESS privacy proxy. It allows to send (privacy preserved) queries, obtain details for a set of [document badges](https://github.com/EEXCESS/eexcess/wiki/%5B21.09.2015%5D-Request-and-Response-format#response-format) and provides a cache of the last queries/result sets.  
* ```paragraphDetection``` A module that allows to extract textual paragraphs from HTML documents (opposed to navigational menus, advertisements, etc.), construct queries in the [EEXCESS query profile](https://github.com/EEXCESS/eexcess/wiki/%5B21.09.2015%5D-Request-and-Response-format#query-format) format and determine the currently focused paragraph.
* ```CitationBuilder``` A module to assemble ready-to-use citations from metadata provided as JSON. See the [CitationBuilder README.md](CitationBuilder/README.md) for details.
* ```searchBar``` A module to add a bar to the bottom of the page, which allows query interaction and displaying results.
* ```iframes``` A utility module for communication with iframes, which enables broadcasting messages.
* ```namedEntityRecognition``` A utility module for communication with the [DoSer](https://github.com/quhfus/DoSeR) named entity recognition service.
* ```logging``` A module that simplifies the handling of different types of logging events. 

# APIconnector
The APIconnector module provides means to communicate with the (EEXCESS) Federated Recommender via the Privacy Proxy.  
A working example using the APIconnector can be found in [examples/searchBar_Paragraphs](examples/searchBar_Paragraphs)

* ```init(settings)```: allows to initialize the APIconnector with custom parameters. You must call this method and specify the ```origin``` attribute (see below), before you can send queries. The minimum configuration is shown in the example below. The following parameters can be customized:
  * ```base_url``` The basic url of the server to call
  * ```timeout``` The timeout in ms, after which a request to the server is canceled. Default is 10000.
  * ```logTimeout``` The timeout in ms, after which a logging request to the server is canceled. Default is 5000.
  * ```loggingLevel``` Flag whether queries/results should be logged on the privacy proxy. Defaults to 0 (logging enabled). If you want to disable the logging on the server you need to set the flag to 1.  
  * ```cacheSize``` The size of the query/result cache. Determines how many queries and corresponding result sets should be cached. Default is 10.
  * ```suffix_recommend``` The endpoint for the recommender service. Default: "recommend".
  * ```suffix_details``` The endpoint to get details for result items. Default: "getDetails".
  * ```suffix_favicon``` The endpoint from which to retrieve the provider favicons. Default: "getPartnerFavIcon?partnerId=".
  * ```suffix_log``` The endpoint for logging requests. Default: "log/".
  * ```origin``` The identifier for the requesting client/user. This object must contain the attributes ```clientType```, ```clientVersion``` and ```userID```, see the example below.
  ```javascript
    require(['c4/APIconnector'], function(api) {
      api.init({
        origin:{
          clientType:"some client", // the name of the client application
          clientVersion:"42.23", // the version nr of the client application
          userID:"E993A29B-A063-426D-896E-131F85193EB7" // UUID of the current user
        }
      });
    });
  ```
    
* ```query(profile,callback)```: allows to query the Federated Recommender (through the Privacy Proxy). The expected parameters are a [EEXCESS profile](https://github.com/EEXCESS/eexcess/wiki/%5B21.09.2015%5D-Request-and-Response-format) and a callback function.
  ```javascript
  require(['c4/APIconnector'], function(api) {
    var profile = {
      contextKeywords:[{
        text:"someKeyword"
      }]
    };
    api.query(profile, function(response) {
      if(response.status === 'success') {
        // do something with the result contained in response.data
      } else {
        // an error occured, details may be in response.data
      }
    });
  });
  ```
  
* ```queryPeas```: allows to query the Federated Recommender (through the Privacy Proxy) in a privacy-preserving way. It returns the exact same result as ```query```. It uses the [PEAS indistinguishability protocol](https://github.com/EEXCESS/peas#indistinguishability-protocol). This example shows how to use it:
  ```javascript
  require(["APIconnector"], function(apiConnector){
    var nbFakeQueries = 2; // The greater the better from a privacy point of view, but the worse from a performance point of view (2 or 3 are acceptable values). 
    var query = JSON.parse('{"origin": {"userID": "E993A29B-A063-426D-896E-131F85193EB7", "clientType": "EEXCESS - Google Chrome Extension", "clientVersion": "2beta", "module": "testing"}, "numResults": 3, "contextKeywords": [{"text": "graz","weight": 0.1}, {"text": "vienna","weight": 0.3}]');
    apiConnector.queryPeas(query, nbFakeQueries, function(results){
      var resultsObj = results.data; 
    });
  });
  ```
  
* ```getDetails(detailsRequestObj,callback)```: allows to retrieve details for result items from the Federated Recommender (through the Privacy Proxy). The expected parameter is a [detailsRequestObj](https://github.com/EEXCESS/eexcess/wiki/%5B21.09.2015%5D-Request-and-Response-format#pp-details-query-format) object, that has an ```origin```, ```queryID``` and a list of [document badges](https://github.com/EEXCESS/eexcess/wiki/%5B21.09.2015%5D-Request-and-Response-format#response-format) of the items for which to retrieve details. A callback function can be used to return the results to.
  ```javascript
  require(['c4/APIconnector'], function(api) {    
    var detailsRequestObj = {
            origin : {"origin": {"userID": "E993A29B-A063-426D-896E-131F85193EB7", "clientType": "EEXCESS - Google Chrome Extension", "clientVersion": "2beta", "module": "testing"},
            documentBadge: [
                {
                    id: "/09003/4A65C4999F4077781A1F9CF2510EE512CD6571B9",
                    uri: "http://europeana.eu/resolve/record/09003/4A65C4999F4077781A1F9CF2510EE512CD6571B9",
                    provider: "Europeana"
                }
            ],
            queryID: "70342716"
        };
    api.getDetails(detailsRequestObj, function(response) {
      if(response.status === 'success') {
        // do something with the result contained in response.data
      } else {
        // an error occured, details may be in response.data
      }
    });
  });
  ```
  
* ```getCache()```: allows to retrieve the cached queries/result sets.
  ```javascript
  require(['c4/APIconnector'], function(api) {
    api.getCache().forEach(function(){
      console.log(this.profile); // the query
      console.log(this.result); // the result set
    });
  });
  ```
  
* ```getCurrent()```: allows to retrieve the last successfully executed query and corresponding result set. Returns ```null``` if no successful query has been executed up to that point.
  ```javascript
  require(['c4/APIconnector'], function(api) {
    var current = api.getCurrent();
    console.log(current.profile); // the query
    console.log(current.result); // the result set
  });
  ```
  
* ```logInteractionType```: Enum for logging interaction types. See ```sendLog``` for usage.
* ```sendLog(interactionType, logEntry)```: allows to send logging requests to the server. The parameter ```interactionType``` specifies the type of the interaction to log and the parameter ```logEntry``` the entry to be logged.

  ```javascript
  require(['c4/APIconnector'], function(api) {
    // the log entry normally will be created within a widget, here we define one explicitly.
    // The entry we create logs the citation of a result item as an image.
    var logEntry = {
      origin:{
        module:"example widget"
      },
      content:{
        documentBadge:{<documentBadge of the item>}
      },
      queryID:<identifier of the query that provided this result item>
    }
    api.sendLog(api.logInteractionType.itemCitedAsImage,logEntry);
  });
  ```

# paragraphDetection
A module to extract textual paragraphs from arbitrary webpage markup, find the paragraph currently in focus of the user and create a search query from a paragraph.  
A working example using the paragraphDetection can be found in [examples/searchBar_Paragraphs](examples/searchBar_Paragraphs)
* ```init(settings)```:allows to initialize the paragraph detection with custom parameters. You only need to provide the parameters you want to change. Parameters that can be changed are a ```prefix``` that is used for the identifiers of newly created HTML elements and the ```classname``` that will added to those elements (atm a wrapper div with the mentioned parameters is created around the detected paragraph). The example uses the default values, if you are fine with these, you do not need to call the ``init`` method.
  ```javascript
  require(['c4/paragraphDetection'], function(paragraphDetection) {
    paragraphDetection.init({
      prefix:"eexcess", // default value
      classname:"eexcess_detected_par" // default value
    });
  });
  ```
  
* ```getParagraphs([root])```: allows to detect text paragraphs in arbitrary HTML markup. The detection heuristic tries to extract 'real' paragraphs, opposed to navigation menus, advertisements, etc. The ``root`` parameter (optional) specifies the root HTML-element from where to start the extraction. If it is not given, the detection will use ``document`` as root.  
Returns an array of the detected paragraphs with the entries in the following format:
  ```javascript
  {
    id: "<prefix>_par_0", // identifier, the prefix can be customized via the init method
    elements:[], // the HTML-elements spanning the paragrah
    multi:false, // indicator, whether the paragraph consists of e.g. a singe <p> element or several <p> siblings
    content:"Lorem ipsum dolor", // the textual content of the paragraph
    headline:"Sit Amet" // textual content of the corresponding headline of the paragraph
  }
  ```
  Usage:
  ```javascript
  require(['c4/paragraphDetection'], function(paragraphDetection) {
    var paragraphs = paragraphDetection.getParagraphs();
    paragrahps.forEach(function(entry){
      console.log(entry); // do something with each paragraph
    });
  });
  ```
  
* ```paragraphToQuery(text,callback,[id],[headline])```: creates a query from the given text in the [EEXCESS profile](https://github.com/EEXCESS/eexcess/wiki/%5B21.09.2015%5D-Request-and-Response-format#query-format) format. Only the attribute `contextKeywords` will be set. The parameters to be set are:
    * text - The text of the paragraph for which to create a query
    * callback(response) - The callback function to execute after the query generation. The generated query profile is contained in response.query or if an error occurs, error details are provided in response.error
    * [id] - optional identifier of the paragraph
    * [headline] - optional headline corresponding to the paragraph
  ```javascript
  require(['c4/paragraphDetection'], function(paragraphDetection) {
    var text = 'Lorem ipsum dolor sit amet...';
    paragraphDetection.paragraphToQuery(text, function(response){
      if(typeof response.query !== 'undefined') {
        // query has sucessfully been constructed
        console.log(response.query);
      } else {
        // something went wrong
        console.log(response.error);
      }
    });
  });
  ```
  
* ```findFocusedParagraphSimple([paragraphs])```: tries to determine the paragraph, the user is currently looking at.  
In this simple version, the topmost left paragraph is accounted as being read, except for the user explicitly clicking on a paragraph. When a change of the focused paragraph occurs, a `paragraphFocused` event is dispatched with the focused paragraph attached. The set of paragraphs to observe can be specified via the optional `paragraphs` parameter. If this parameter is not set, the method will observe paragraphs already detected by the module (if any - e.g. from a previous `getParagraphs` call). The `paragraphFocused` event may be dispatched several times for the same paragraph.
  ```javascript
  require(['jquery','c4/paragraphDetection'], function($,paragraphDetection) {
    // detect paragraphs in the document
    paragraphDetection.getParagraphs();
    // listen for paragraphFoucsed events
    $(document).on('paragraphFocused', function(e){
      console.log(evt.originalEvent.detail); // the focused paragraph
    });
    // set up tracking of focused paragraph
    paragraphDetection.findFocusedParagraphSimple();
  });
  ```
  
* ```findFocusedParagraph([paragraphs])```: tries to determine the paragraph, the user is currently looking at.  
This method is in principle identical to `findFocusedParagraphSimple`, but accounts for more implicit user interaction. The probability of a focused paragraph is calculated by a weighted combination of its size, position and distance to the mouse position. When mouse movements occur, the distance to the mouse position has a higher weight, while scrolling events render the paragraph position more important.
  ```javascript
  require(['jquery','c4/paragraphDetection'], function($,paragraphDetection) {
    // detect paragraphs in the document
    paragraphDetection.getParagraphs();
    // listen for paragraphFoucsed events
    $(document).on('paragraphFocused', function(e){
      console.log(evt.originalEvent.detail); // the focused paragraph
    });
    // set up tracking of focused paragraph
    paragraphDetection.findFocusedParagraphSimple();
  });
  ```

# CitationBuilder
Please see the [README.md](CitationBuilder/README.md) of the CitationBuilder module for details.

# searchBar
A module that adds a search bar to the bottom of the page, which enables to show and modify the query and display the results.  
A working example using the searchBar can be found in [examples/searchBar_Paragraphs](examples/searchBar_Paragraphs)
* ```init(tabs[,config])```: initializes the search bar with a set of visualization widgets (parameter tabs) and custom configuration options (optional parameter config).  
The ```tabs``` parameter specifies the [visualization widgets](https://github.com/EEXCESS/visualization-widgets) to use for displaying the result in the following format:
  ```
  [{
    name:"widget name" // name of the widget, will be displayed in the tab navigation for selection of the widget
    url:"<path>" // path to the main page of the widget
    icon:"<path>" // path to an icon image for the widget (optional)
  },{
    name:"widget2",
    url:"<path2>"
  },{
    // ...
  }
  ]
  ```
  The ```config``` object allows to customize the following parameters (you only need to specify the ones you would like to change):
  * ```queryFn``` - a custom function to query a server for results. The function must look like
  
    ```javascript
      function(profile,function(response){
        console.log(response.status); // should inform about the status, either 'success' or 'error'
        console.log(response.data); // should contain the results on success and error details on error
      });
    ```
    where the ```profile``` parameter represents an [EEXCESS query profile](https://github.com/EEXCESS/eexcess/wiki/%5B21.09.2015%5D-Request-and-Response-format#query-format). By default, the ```query``` method of the ```APIconnector``` module is used. 
  * ```imgPATH``` - path where images are stored. Defaults to 'img/'
  * ```queryModificationDelay``` - the delay before a query is executed (in ms) after the user interacted with it (added/removed keywords, changed main topic, etc). Defaults to 500.
  * ```queryDelay``` - the delay (in ms) before a query is executed due to changes from the parent container. This delay is used after the query has been changed through the ```setQuery``` method of this module. Defaults to 2000.  
    In addition, the delay can also be provided as parameter to the ```setQuery``` function, in order to enable different delays for specific interactions.
  * ```storage``` - an object providing storage capabilities. By default, the search bar will use the browser's local storage to store values. The storage function must exhibit two functions:
    * ```set(item, callback)``` The ```item``` passed to this function is an object containing key value pairs to store. It looks like this:
      ```javascript
      {
        key1:"value1", // value can be a simple type like String
        key2:{
          // value can also be an JSON-serialiazable objects
        }
      }
      ```
      
      The ```callback``` parameter is a callback function without parameters to be executed after storing the item. 
    * ```get(key, callback)``` The ```key``` parameter is either a single String (to get a single value) or an Array of Strings (to get several values).  
      The ```callback``` function should be called with an object, containing the provided key(s) and their corresponding values like so:
      
      ```javascript
        var response = {
          key1: value1,
          key2: value2
        }
        callback(response);
      ```

* ```setQuery(contextKeywords [,delay])```: sets the query in the search bar.
  The ```contextKeywors``` must be in the format as the contextKeywords in the [EEXCESS query profile format](https://github.com/EEXCESS/eexcess/wiki/%5B21.09.2015%5D-Request-and-Response-format#query-format).  
  The query will automatically be executed after the delay given by the settings (default: 2000ms, can be customized via ```searchBar.init(<tabs>,{queryDelay:<custom value>})```. Alternatively, this setting can be overwritten by providing the optional ```delay``` parameter, which specifies the delay in ms.
  ```javascript
  require(['jquery','c4/searchBar'], function($,searchBar) {
    // searchBar needs to be initialized first, omitted here
    var contextKeywords = [{
      text:"Lorem"
    },{
      text:"ipsum"
    }];
    searchBar.setQuery(contextKeywords, 0); // query is set and will be immediately executed (delay: 0ms)
  });
  ```

# iframes
A utility module for communicating between iframes
* ```sendMsgAll(message)```: send a message to all iframes embedded in the current window. The expected parameter is the message to send. The example below shows how to inform all included [widgets](https://github.com/EEXCESS/visualization-widgets) that a new query has been issued.

  ```javascript
  require(['c4/iframes'], function(iframes) {
    var profile = {
      contextKeywords:[{
        text:'someKeyword'
      }];
    };
    iframes.sendMsgAll({
      event:'eexces.newQueryTriggered',
      data:profile
    });
  });
  ```
  
# namedEntityRecognition
A utility module to query the EEXCESS recognition and disambiguation service
* ```entitiesAndCategories(paragraphs,callback)```: allows to extract Wikipedia entities and associated categories from a given piece of text. In addition, the main topic of the text and time mentions are extracted. The expected parameters are a set of paragraphs and a callback function.

  ```javascript
  require(['c4/namedEntityRecognition'], function(ner) {
    var paragraph = {
      id:42,
      headline:"I am a headline",
      content:"Lorem ipsum dolor..."
    };
    ner.entitiesAndCategories({paragraphs:[paragraph]}, function(response){
      if(response.status === 'success') {
        // the results are contained in response.data.paragraphs
        response.data.paragraphs.forEach(function(){
          console.log(this.time); // contains time mentions and associated entities/categories
          console.log(this.topic); // contains the main topic entity
          console.log(this.statistic); // contains the extracted entities/categories
          this.statistic.forEach(function(){
            console.log(this.key.text); // label of the entity
            console.log(this.key.categories); // associated categories
            console.log(this.key.type); // type of the entity (person, location, organization, misc)
            console.log(this.value); // number of occurences of the entity in the paragraph
          });
        });
      } else {
        // an error occured, details may be in response.data
      }
    });
  });
  ```

# logging-API
A module that provides an API for generating logging events in the format specified by [Logging Format](https://github.com/EEXCESS/eexcess/wiki/EEXCESS---Logging). Logging-Events are passed over to the ```APIconnector``` which sends it to the logging endpoints of the Privacy Proxy. A working example on how the ```logging``` is to be used, can be found in [examples/loggingExample](examples/loggingExample). 

The logging-API provides methods to create logging events in the correct format and it broadcasts these events as messages via the browser's Messaging-API. Thus, the client application needs to listen to the following messages and forward them to the Privacy Proxy:

  ```javascript
  require(['c4/APIconnector'], function(api) {
    api.init({origin: {
      clientType: "EEXCESS Chrome extension",
      clientVersion: "2.0.1"
      userID: "93939A-8494BE-99ADF2"
      }});
    
    window.onmessage = function(msg) {
      if (msg.data.event) {
        switch (msg.data.event) {
          case 'eexcess.log.moduleOpened':
              api.sendLog(api.logInteractionType.moduleOpened, msg.data.data);
              break;
          case 'eexcess.log.moduleClosed':
              api.sendLog(api.logInteractionType.moduleClosed, msg.data.data);
              break;
          case 'eexcess.log.moduleStatisticsCollected':
              api.sendLog(api.logInteractionType.moduleStatisticsCollected, msg.data.data);
              break;
          case 'eexcess.log.itemOpened':
              api.sendLog(api.logInteractionType.itemOpened, msg.data.data);
              break;
          case 'eexcess.log.itemClosed':
              api.sendLog(api.logInteractionType.itemClosed, msg.data.data);
              break;
          case 'eexcess.log.itemCitedAsImage':
              api.sendLog(api.logInteractionType.itemCitedAsImage, msg.data.data);
              break;
          case 'eexcess.log.itemCitedAsText':
              api.sendLog(api.logInteractionType.itemCitedAsText, msg.data.data);
              break;
          case 'eexcess.log.itemCitedAsHyperlink':
              api.sendLog(api.logInteractionType.itemCitedAsHyperlink, msg.data.data);
              break;
          case 'eexcess.log.itemRated':
              api.sendLog(api.logInteractionType.itemRated, msg.data.data);
              break;
          default:
              break;
        }
      }
    }
  });
  ```
  
The methods of the logging-API are as follows:

* ```init(config)```: allows to initialize the logging-API with custom parameters. You must call this method and specify the ```origin``` attribute (see below), before you can call methods of the logging-API. The following parameters can be customized:
  * ```origin``` The identifier for the requesting component. This object must contain a ```module``` attribute, that specifies the name of the issuing component, see the example below.
  
  ```javascript
    require(['c4/logging'], function(logging) {
      logging.init({
        origin:{
          module: "Dashboard Visualization"
        }
      });
    });
  ```

The logging-API provides the following methods to create corresponding logging events: 
* ```moduleOpened(moduleName)```: Create the logging event ```moduleOpened```. The expected parameter is the name of the component that has been opened.
* ```moduleClosed(moduleName)```: Create the logging event ```moduleClosed```. The expected parameter is the name of the component that has been closed.
* ```moduleStatisticsCollected(statistics)```: Create the logging event ```moduleStatisticsCollected```. The expected parameter can be of any type. ```statistics``` is logged as-is.
* ```itemOpened(documentBadge, queryID)```: Create the logging event ```itemOpened```. The expected parameters are a ```documentBadge```, which refers to the resource that was opened in detailed view, and a ```queryID```, which refers to the query that returned the resource.
* ```itemClosed(documentBadge, queryID, duration)```: Create the logging event ```itemClosed```. The expected parameters are a ```documentBadge```, which refers to the resource that was closed in detailed view, a ```queryID```, which refers to the query that returned the resource, and a ```duration```. The latter specifies the time in milliseconds, during which the item was opened in detailed view.
* ```itemCitedAsImage(documentBadge, queryID)```: Create the logging event ```itemCitedAsImage```. The expected parameters are a ```documentBadge```, which refers to the resource that was cited as an image, and a ```queryID```, which refers to the query that returned the resource.
* ```itemCitedAsText(documentBadge, queryID)```: Create the logging event ```itemCitedAsText```. The expected parameters are a ```documentBadge```, which refers to the resource that was cited as text, and a ```queryID```, which refers to the query that returned the resource.
* ```itemCitedAsHyperlink(documentBadge, queryID)```: Create the logging event ```itemCitedAsHyperlink```. The expected parameters are a ```documentBadge```, which refers to the resource that was cited as a hyperlink, and a ```queryID```, which refers to the query that returned the resource.
* ```itemRated(documentBadge, queryID, minRating, maxRating, rating)```: Create the logging event ```itemRated```. The expected parameters are a ```documentBadge```, which refers to the resource that was rated and a ```queryID```, which referst to the query that returned the rated resource. ```minRating``` and ```maxRating``` allow to specifiy the range a rating can have. ```rating``` is the actual value that has been assigned to the resource.
  
The following examples demonstrate the usage of these methods:

  ```javascript
  require(['c4/logging'], function(logging) {
      logging.init({
        origin:{
          module: "Dashboard Visualization"
        }
      });
      
      var queryID = "483904939"
      var documentBadge = {
        id: "995eb36f-151d-356c-b00c-4ef419bc2124",
        uri: "http://www.mendeley.com/research/hellenism-homoeroticism-shelley-circle",
        provider: "Mendeley"
      };
      
      logging.moduleOpened("anotherVisualizationName");
      logging.moduleClosed("anotherVisualizationName", 5000);
      logging.moduleStatisticsCollected({usageStatistics: 42});
      
      logging.itemOpened(documentBadge, queryID); 
      logging.itemClosed(documentBadge, queryID, 1500);
      
      logging.itemCitedAsImage(documentBadge, queryID);
      logging.itemCitedAsText(documentBadge, queryID);
      logging.itemCitedAsHyperlink(documentBadge, queryID);
      
      logging.itemRated(documentBadge, queryID, 0, 4, 3);
    });
  ```
    
