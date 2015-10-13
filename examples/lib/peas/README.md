PEAS stands for Private, Efficient and Accurate (web) Search. 

It is composed of three protocols: 
- an unlinkability protocol (peas_unlink): aims at hiding users identity, 
- an indistinguishability protocol (peas_indist): aims at hiding users intents by obfuscating their queries,
- an adaptation protocol (peas_adapt): aims at sharing users information without revealing private information. 

The request and response formats handled in these protocols are described [here](https://github.com/EEXCESS/eexcess/wiki/Request-and-Response-format-for-call-to-federated-recommender-and-privacy-proxy#request-and-response-formats-to-interact-with-the-privacy-proxy). 

# Installation

```bash
git clone https://github.com/EEXCESS/peas.git folderOfYourChoice
cd folderOfYourChoice/
git checkout master
bower install
```

# Indistinguishability Protocol

The component offers two techniques to do query obfuscation and result set filtering. 

## Obfuscation

The method is defined as follows: 
```javascript
/**
 * Generates an obfuscated query composed of (k+1) queries: 
 * 1 real query (the one given as input) and k fake queries. 
 * @method obfuscateQuery
 * @param {JSONObject} query A query of format QF1.
 * @param {Integer} k The desired number of fake queries. 
 * @return {JSONObject} A query of format QF2. 
 */
obfuscateQuery(query, k){ ... }
```

This example shows how to use it: 
```javascript
require(["peas_indist"], function(peas_indist){
	// Query of format QF1:
	var originalQuery = JSON.parse('{"numResults":3,"contextKeywords":[{"text":"graz","weight":0.1},{"text":"vienna", "weight":0.1}]}'); // A query in the format QF1
	var nbFakeQueries = 3; 
	// Query of format QF2:
	var obfuscatedQuery = peas_indist.obfuscateQuery(originalQuery, nbFakeQueries);  // Returns a query composed of (nbFakeQueries+1) sub-queries
	// The obfuscated query can be sent to the privacy proxy to be processed
	// The orginal query can also be send to the privacy proxy
});
```

## Filtering

The method is defined as follows: 
```javascript
/**
 * Filters a result set and returns the results corresponding to the original query given as input. 
 * @method filterResults
 * @param {JSONObject} results A result set of format RF2. 
 * @param {JSONObject} query A query of format QF1. 
 * @return {JSONObject} A result set of format RF1. 
 */
filterResults(results, query){ ... }
```

This example shows how to use it: 
```javascript
require(["peas_indist"], function(peas_indist){
	// Query of format QF1:
	var originalQuery = JSON.parse('{"numResults":1,"contextKeywords":[{"text":"graz","weight":0.1},{"text":"vienna", "weight":0.1}]}'); 
	// Query of format QF2: 
	var obfuscatedQuery = JSON.parse('{"numResults":1,"contextKeywords":[[{"text":"graz","weight":0.1},{"text":"vienna","weight":0.1}],[{"text":"music","weight":0.1},{"text":"bass","weight":0.1}],[{"text":"money","weight":0.1},{"text":"euro","weight":0.1}]]}'); 
	// Results of format RF2:
	var results = JSON.parse('{"result":[[{"documentBadge":{"provider":"Europeana","id":"/2022365/Bristol_20Museums_2C_20Galleries_20_26_20Archives_emu_ecatalogue_britisharchaeology_167417","uri":"http://europeana.eu/resolve/record/2022365/Bristol_20Museums_2C_20Galleries_20_26_20Archives_emu_ecatalogue_britisharchaeology_167417"},"title": "Rebec (musical instrument bridge)."}],[{"documentBadge":{"provider":"Europeana","id":"/92070/BibliographicResource_1000126223366","uri":"http://europeana.eu/resolve/record/92070/BibliographicResource_1000126223366"},"title": "Kirche der Barmh. Schwestern zur unbefleckten Empfngniss, Graz"}],[{"documentBadge":{"provider":"Europeana","id":"/2022374/Manchester_20Museum_mm_emu_ecatalogue_humanities_98449","uri": "http://europeana.eu/resolve/record/2022374/Manchester_20Museum_mm_emu_ecatalogue_humanities_98449"},"title":"1 euro"}]],"totalResults":3,"provider":"federated"}');
	// Results of format RF1
	var filteredResults = peas_indist.filterResults(results, originalQuery);
});
```

## Initialization

Two methods are defined. The first one is defined as follows: 
```javascript
/**
 * 
 * @method initUrl
 * @param {String} url ...
 */
initUrl(url){ ... }
```

The second one is defined as follows: 
```javascript
/**
 * 
 * @method initUrl
 * @param {String} url ...
 */
initServices(service1, service2){ ... }
```

This example shows how to use it: 
```javascript
require(["peas_indist"], function(peas_indist){
	
});
```

# Adaptation Protocol

## Query adaptation

The method is defined as follows: 
```javascript
/**
 * Adds public information and remove private information. 
 * @method adaptQuery
 * @param {JSONObject} query A query of format QF1. 
 * @return {JSONObject} A query of format QF1. 
 */
adaptQuery(query){ ... }
```

This example shows how to use it: 
```javascript
require(["peas_adapt"], function(peas_adapt){
	// Query of format QF1:
	var originalQuery = JSON.parse('{"numResults":3,"contextKeywords":[{"text":"graz","weight":0.1},{"text":"vienna","weight":0.3}],"firstName":"John","lastName":"Doe","gender":"male","birthDate":123456789,"address":{"country":"USA","city":"NYC","zipCode":10001,"line1":"aaa","line2":"bbb"},"languages":[{"iso2":"fr","languageCompetenceLevel":0.25},{"iso2":"en","languageCompetenceLevel":0.75}],"interests":[{"text":"history"},{"text":"art"},{"text":"sport"}]}');
   	// Query of format QF1:
   	var adaptedQuery = peas_adapt.adaptQuery(originalQuery);
});
```

# JSON formats

## Co-occurrence graph

The protocol considers a co-occurrence graph of terms. In such a graph, vertices are terms and edges are frequencies. The JSON format used to represent co-occurrence graphs is as follow: 
```javascript
[{
	"term": "aaa", 
	"frequencies": [
		{"term": "bbb", "frequency": 2}, 
		{"term": "ccc", "frequency": 5}
	]
},{
	"term": "bbb", 
	"frequencies": [
		{"term": "ccc", "frequency": 8}
	]
}]
```
This example represents the case where ```aaa``` and ```bbb``` appeared together in 2 queries, ```aaa``` and ```ccc``` in 5 queries, and ```bbb``` and ```ccc``` in 8 queries. As the co-occurrence relationship is symetric, the graph is somehow compacted (i.e., it is not necessary to specify that ```bbb``` and ```aaa``` appeared together in 2 queries). The lexicographical order is used to determine if a pair ```(x, y)``` should be stored. 

## Cliques

A clique is a subgraph of a co-occurrence graph. Therefore, the JSON format to represent a clique is similar to the one used for a co-occurrence graph. A set of cliques is simply represented as an array of graph: 
```javascript
[
	[{
		"term": "aaa", 
		"frequencies": [ ... ]
	},{
		"term": "bbb", 
		"frequencies": [ ... ]
	}]
]
```
