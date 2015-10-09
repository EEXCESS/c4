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
      })
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
A module to extract textual paragraphs from arbitrary webpage markup, find the paragraph currently in focus of the user and create search query from a paragraph.
* ```init(settings)```
* ```getParagraphs([root])```
* ```paragraphToQuery(text,callback,[id],[headline])```
* ```findFocusedParagraphSimple([paragraphs])```
* ```findFocusedParagraph([paragraphs])```
  
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
