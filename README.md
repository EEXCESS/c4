# c4
Cultural and sCientific Content in Context

## APIconnector

* ```init```
* ```query```
* ```queryPeas```: allows to query the Federated Recommender (through the Privacy Proxy) in a privacy-preserving way. It returns the exact same result as ```query```. It uses the [PEAS indistinguishability protocol](https://github.com/EEXCESS/peas). This example shows how to use it: 
```javascript
require(["APIconnector"], function(apiConnector){
	var nbFakeQueries = 2; // The greater the better from a privacy point of view, but the worse from a performance point of view (2 or 3 are acceptable values). 
	var query = JSON.parse('{"origin": {"userID": "E993A29B-A063-426D-896E-131F85193EB7", "clientType": "EEXCESS - Google Chrome Extension", "clientVersion": "2beta", "module": "testing"}, "numResults": 3, "contextKeywords": [{"text": "graz","weight": 0.1}, {"text": "vienna","weight": 0.3}]');
	apiConnector.queryPeas(query, nbFakeQueries, function(results){
		var resultsObj = results.data; 
	});
}
```
* ```getDetails```
* ```getCache```
* ```getCurrent```
