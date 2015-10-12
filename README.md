C4 - Cultural and sCientific Content in Context

# Installation

# APIconnector
The APIconnector module provides means to communicate with the (EEXCESS) Federated Recommender via the Privacy Proxy

* ```init(settings)```: allows to initialize the APIconnector with custom parameters. You only need to specify the parameters you would like to customize. The example below shows the initialization with the default values. If you are ok with these, you do not need to call the ```init``` method. The following parameters can be customized:
  * ```base_url``` The basic url of the server to call
  * ```timeout``` The timeout in ms, after which a request to the server is cancelled
  * ```cacheSize``` The size of the query/result cache. Determines how many queries and corresponding result sets should be cached.
  * ```suffix_recommend``` The endpoint for the recommender service
  * ```suffix_details``` The endpoint to get details for result items
  * ```suffix_favicon``` The endpoint from which to retrieve the provider favicons
  ```javascript
    require(['c4/APIconnector'], function(api) {
      api.init({
        base_url: "https://eexcess-dev.joanneum.at/eexcess-privacy-proxy-issuer-1.0-SNAPSHOT/issuer/",
        timeout: 10000,
        cacheSize: 10,
        suffix_recommend: 'recommend',
        suffix_details: 'getDetails',
        suffix_favicon: 'getPartnerFavIcon?partnerId='
      });
    }
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
    }
  ```
  
* ```queryPeas```: allows to query the Federated Recommender (through the Privacy Proxy) in a privacy-preserving way. It returns the exact same result as ```query```. It uses the [PEAS indistinguishability protocol](https://github.com/EEXCESS/peas#indistinguishability-protocol). This example shows how to use it:
  ```javascript
    require(["APIconnector"], function(apiConnector){
	    var nbFakeQueries = 2; // The greater the better from a privacy point of view, but the worse from a performance point of view (2 or 3 are acceptable values). 
	    var query = JSON.parse('{"origin": {"userID": "E993A29B-A063-426D-896E-131F85193EB7", "clientType": "EEXCESS - Google Chrome Extension", "clientVersion": "2beta", "module": "testing"}, "numResults": 3, "contextKeywords": [{"text": "graz","weight": 0.1}, {"text": "vienna","weight": 0.3}]');
	    apiConnector.queryPeas(query, nbFakeQueries, function(results){
		    var resultsObj = results.data; 
	    });
    }
  ```
  
* ```getDetails(documentBadges,callback)```: allows to retrieve details for result items from the Federated Recommender (through the Privacy Proxy). The expected parameters are a set of [document badges](https://github.com/EEXCESS/eexcess/wiki/%5B21.09.2015%5D-Request-and-Response-format#details-query-format) of the items for which to retrieve details  and a callback function.
  ```javascript
    require(['c4/APIconnector'], function(api) {
      var documentBadges = [{
            "id":"sl23394330",
            "uri":"http://service.wissens-server.com/wissensserver/view.html?a=t&r=CURRENT&i=sl23394330&s=BEP&v=eexcess&w=EEXCESS",
            "provider":"Wissenmedia"
      }];
      api.getDetails(documentBadges, function(response) {
        if(response.status === 'success') {
          // do something with the result contained in response.data
        } else {
          // an error occured, details may be in response.data
        }
      });
    }
  ```
  
* ```getCache()```: allows to retrieve the cached queries/result sets.
  ```javascript
    require(['c4/APIconnector'], function(api) {
      api.getCache().forEach(function(){
        console.log(this.profile); // the query
        console.log(this.result); // the result set
      });
    }
  ```
  
* ```getCurrent()```: allows to retrieve the last successfully executed query and corresponding result set. Returns ```null``` if no successful query has been executed up to that point.
  ```javascript
    require(['c4/APIconnector'], function(api) {
      var current = api.getCurrent();
      console.log(current.profile); // the query
      console.log(current.result); // the result set
    }
  ```
  
# paragraphDetection
A module to extract textual paragraphs from arbitrary webpage markup, find the paragraph currently in focus of the user and create a search query from a paragraph.
* ```init(settings)```:allows to initialize the paragraph detection with custom parameters. You only need to provide the parameters you want to change. Parameters that can be changed are a prefix that is used for the identifiers of newly created HTML elements and the classname that will added to those elements (atm a wrapper div with the mentioned parameters is created around the detected paragraph). The example uses the default values, if you are fine with these, you do not need to call the ``init`` method.
  ```javascript
    require(['c4/paragraphDetection'], function(paragraphDetection) {
      paragraphDetection.init({
        prefix:"eexcess", // default value
        classname:"eexcess_detected_par" // default value
      });
    }
  ```
  
* ```getParagraphs([root])```: allows to detect text paragraphs in arbitrary HTML markup. The detection heuristic tries to extract 'real' paragraphs, opposed to navigation menus, advertisements, etc. The ``root`` parameter (optional) specifies the root HTML-element from where to start the extraction. If it is not given, the detection will use ``document`` as root.  
Returns an array of the detected paragraphs with the entries in the following format:
  ```javascript
    {
      id: "<prefix>_par_0", // identifier, the prefix can be customized via the init method
      elements:[], // the HTML-elements spanning the paragrah
      multi:false, // indicator, whether the paragraph consists of e.g. a singe <p> element or several <p> siblings
      content:"Lorem ipsum dolor", // the textual content of the paragraph
      headlin:"Sit Amet" // textual content of the corresponding headline of the paragraph
    }
  ```
  Usage:
  ```javascript
    require(['c4/paragraphDetection'], function(paragraphDetection) {
      var paragraphs = paragraphDetection.getParagraphs();
      paragrahps.forEach(function(entry){
        console.log(entry); // do something with each paragraph
      });
    }
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
    }
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
    }
  ```
  
* ```findFocusedParagraph([paragraphs])```: tries to determine the paragraph, the user is currently looking at.  
This method is in principle identical to `findFocusedParagraph`, but accounts for more implicit user interaction. The probability of a focused paragraph is calculated by a weighted combination of its size, position and distance to the mouse position. When mouse movements occur, the distance to the mouse position has a higher weight, while scrolling events render the paragraph position more important.
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
    }
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
    }
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
    }
  ```
