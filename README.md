# c4
Cultural and sCientific Content in Context

## APIConnector

* init
* query
* queryPeas: allows to send obfuscated queries the Federated Recommender through the Privacy Proxy. It uses the indistinguishability protocol of PEAS (the PEAS component is described here). This example shows how to use it: 
```javascript
document.getElementById("go").addEventListener("click", function(){ 
					var queryStr = document.getElementById("query").value;
					var nbFakeQueries = document.getElementById("nbFakeQueries").value;
					var query = JSON.parse(queryStr);
					if (nbFakeQueries <= 0){
						api.query(query, function(results){
							document.getElementById("results").innerHTML = JSON.stringify(results);
						});
					} else {
						api.queryPeas(query, nbFakeQueries, function(results){
							document.getElementById("results").innerHTML = JSON.stringify(results.data);
						});
					}
				});
```
* getDetails
* getCache
* getCurrent
