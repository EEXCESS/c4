/**
 * TODO
 * mc = Maximal Clique
 * mcs = Maximal Cliques
 * cog = Co-Occurrence Graph 
 * @module peas_indist
 * @requires util, jquery, graph
 */
define(["jquery", "peas/util", "graph"], function ($, util, graph) {
	
	//***************
	//** Constants **
	//***************
	
	var frequencyWidth = 2; // XXX How to set it? 
	
	var urlServices = "https://eexcess-dev.joanneum.at/eexcess-privacy-proxy-issuer-1.0-SNAPSHOT/issuer/";
	var serviceCogName =  "getCoOccurrenceGraph";
	var serviceCog = urlServices + serviceCogName;
	var serviceMcsName = "getMaximalCliques";
	var serviceMcs = urlServices + serviceMcsName;
	
	var storagePrefix = "peas."
	var storageMcsId = storagePrefix + "mcs";
	var storageMcsLastUpdateId = storagePrefix + "mcs.lastUpdate";
	
	var storageCogId = storagePrefix + "cog";
	var storageCogLastUpdateId = storagePrefix + "cog.lastUpdate";
	
	//***************
	//** Variables **
	//***************

	var cog = new Graph();
	initializeCog();
	var mcs = [];
	initializeMcs();

	//************
	//** Module **
	//************
	
	var peas_indist = {
			
			/**
			 * Allows to change the default URL of the server hosting the PEAS external services. 
			 * The default value is: https://eexcess-dev.joanneum.at/eexcess-privacy-proxy-issuer-1.0-SNAPSHOT/issuer/
			 * @method initUrl
			 * @param {String} url URL of the server. 
			 */
			init:function(url){
				serviceCog = url + serviceCogName;
				serviceMcs = url + serviceMcsName;
				initializeCog();
				initializeMcs();
			},
			
			/**
			 * Generates an obfuscated query composed of (k+1) queries: 
			 * 1 real query (the one given as input) and k fake queries. 
			 * @method obfuscateQuery
			 * @param {JSONObject} query A query of format QF1.
			 * @param {Integer} k The desired number of fake queries. 
			 * @return {JSONObject} A query of format QF2. 
			 */
			obfuscateQuery:function(query, k){
				var obfuscatedQuery = JSON.parse(JSON.stringify(query));
				var arrayCK = []; // CK = Context Keywords
				var profile = []; // XXX Should be initialized with the user profile 
				var originalCK = query.contextKeywords;
				var nbTerms = originalCK.length;
				var minFreq = getMinFrequency(originalCK);
				var freqWindow = getFrequencyWindow(minFreq);

				var usedTerms = util.merge(ckToArray(originalCK), profile); // List of the terms used in the original query, the user profile, and the already-generated queries 

				var idxFakeQuery = 0; 
				var nbRemainingAttempts = 10 * k; // We limit the number of attempts
				while ((idxFakeQuery < k) && (nbRemainingAttempts > 0)){ // XXX Risk of infinite loop
					var fakeCK = generateFakeQuery(originalCK, freqWindow.lowerBound, freqWindow.upperBound);
					if (fakeCK.length == 0){
						// It happens when the co-occurrence graph, the cliques and therefore the vocabulary are empty.
						nbRemainingAttempts = 0;
					} else {
						if (!util.intersect(usedTerms, ckToArray(fakeCK))){
							arrayCK[idxFakeQuery] = fakeCK;
							idxFakeQuery++;
							usedTerms = util.merge(usedTerms, ckToArray(fakeCK));
						}
					}
					nbRemainingAttempts--;
				}
				// The original query is added at the end
				arrayCK[arrayCK.length] = query.contextKeywords;
				if (arrayCK.length > 1){
					// If at least one fake query has been generated, then the original query is swap with a randomly chosen element. 
					// It is done to ensure that the original query is not always at the end. 
					var randomIndex = Math.floor(Math.random() * arrayCK.length);
					if (randomIndex != k){
						// If the element picked is not the original query, the two elements are switched
						var swap = arrayCK[randomIndex];
						arrayCK[randomIndex] = arrayCK[k];
						arrayCK[k] = swap;
					}
				}
				obfuscatedQuery.contextKeywords = arrayCK;
				return obfuscatedQuery;
			}, 

			/**
			 * Filters a result set and returns the results corresponding to the original query given as input. 
			 * @method filterResults
			 * @param {JSONObject} results A result set of format RF2. 
			 * @param {JSONObject} query A query of format QF1. 
			 * @return {JSONObject} A result set of format RF1. 
			 */
			filterResults:function(results, query){
				var arrayResult = results.results;
				var maxScore = -1;
				var maxResult = [];
				for (var i = 0 ; i < arrayResult.length ; i++){
					var currentResult = arrayResult[i];
					var currentScore = getScore(currentResult, query.contextKeywords);
					if (currentScore > maxScore){
						maxScore = currentScore;
						maxResult = currentResult;
					}
				}
				var filteredResults = maxResult; // Update of the result
				filteredResults.totalResults = maxResult.result.length; // Update the total number of results
				filteredResults.queryID = results.queryID;
				return filteredResults;
			}
	};
	
	/**
	 * @method generateFakeQuery
	 */
	function generateFakeQuery(originalCK, lowerBound, upperBound){
		var fakeQuery = new Array();
		var nbTerms = originalCK.length;
		var nbStrategies = 3;
		var strategy = Math.floor(Math.random() * nbStrategies) + 1; // Determines which strategy is going to be used: 1, 2 or 3  

		// We do a sequential inspection of the strategy to use, as it may evolve.
		// For instance, if strategy 1 fails, then strategy 2 will be employed. 

		// Strategy 1: pick terms from a randomly picked maximal clique of size nbTerms
		if (strategy == 1) {
			var cliques = getMaximalCliquesOfSize(nbTerms);
			if (cliques.length > 0){
				var oneFound = false;
				var randomCliqueIdx = Math.floor(Math.random() * cliques.length);
				var randomClique = cliques[randomCliqueIdx];
				for (var i = 0 ; i < originalCK.length ; i++){
					var fakeTerm = new Object();
					fakeTerm.text = randomClique._vertices[i];
					fakeTerm.isMainTopic = originalCK[i].isMainTopic;
					fakeTerm.type = "Misc";
					//fakeTerm.uri = originalCK[i].uri;
					fakeQuery[i] = fakeTerm;
				}
			} else {
				strategy = 2;
			}
		}

		// Strategy 2: pick terms from a randomly picked maximal clique of size greater than nbTerms
		if (strategy == 2){
			var cliques = getMaximalCliquesBiggerThan(nbTerms);
			if (cliques.length > 0){
				var randomCliqueIdx = Math.floor(Math.random() * cliques.length);
				var randomClique = cliques[randomCliqueIdx];
				for (var i = 0 ; i < originalCK.length ; i++){
					var fakeTerm = new Object();
					fakeTerm.text = randomClique._vertices[i];
					fakeTerm.isMainTopic = originalCK[i].isMainTopic;
					fakeTerm.type = "Misc";
					//fakeTerm.uri = originalCK[i].uri;
					fakeQuery[i] = fakeTerm;
				}
			} else {
				strategy = 3;
			}
		}

		// Strategy 3: randomly pick nbTerms in the group profile
		if (strategy == 3){ 
			var vocabulary = getVocabulary();
			if (vocabulary.length >= nbTerms){
				var i = 0;
				while (i < nbTerms){
					var fakeTerm = new Object();
					var randomIdx =  Math.floor(Math.random() * vocabulary.length);
					if (!util.contains(ckToArray(fakeQuery), vocabulary[randomIdx])){ // To prevent a word to be added twice
						fakeTerm.text = vocabulary[randomIdx];
						fakeTerm.isMainTopic = originalCK[i].isMainTopic;
						fakeTerm.type = "Misc";
						//fakeTerm.uri = originalCK[i].uri;
						fakeQuery[i] = fakeTerm;
						i++;
					}
				}
			}
		} 
		return fakeQuery;
	}

	/**
	 * @method getScore
	 */
	function getScore(result, keywords){
		// 'result' is an array of entry (each entry is a recommendation)
		// 'keywords' is an array of keywords (term + weight)
		var score = 0;
		var resultsEntries = result.result;
		var nbKeywords = keywords.length;
		var nbEntries = resultsEntries.length;
		for (var i = 0 ; i < nbEntries ; i++){
			var entry = resultsEntries[i];
			var scoreEntry = 0;
			for (var j = 0 ; j < nbKeywords ; j++){
				var keyword = keywords[j].text;
				var scoreKeyword = 0;
				if (keyword != undefined){
					if (entry.title != undefined){
						scoreKeyword += util.nbInstances(entry.title, keyword);
					}
					if (entry.description != undefined){
						scoreKeyword += util.nbInstances(entry.description, keyword);
					}
				}
				scoreEntry += scoreKeyword;
			}
			score += scoreEntry;
		}
		return score;
	}

	/**
	 * @method initializeCog
	 */
	function initializeCog(){
		var cogStoredLocally = (localStorage.getItem(storageCogId) != null);
		var freshCogNeeded = true;
		var lastUpdate = localStorage.getItem(storageCogLastUpdateId);
		if (lastUpdate != null){
			freshCogNeeded = (util.before(new Date(lastUpdate), util.yesterday()));
		}
		if (!cogStoredLocally || freshCogNeeded){
		//if (true){
			getAndSaveRemoteCog();
		} else {
			var cogJson = JSON.parse(localStorage.getItem(storageCogId));
			cog = jsonToGraph(cogJson);
		}
	}
	
	/**
	 * @method initializeMcs
	 */
	function initializeMcs(){
		var mcsStoredLocally = (localStorage.getItem(storageMcsId) != null);
		var freshMcsNeeded = true;
		var lastUpdate = localStorage.getItem(storageMcsLastUpdateId);
		if (lastUpdate != null){
			freshMcsNeeded = (util.before(new Date(lastUpdate), util.yesterday()));
		}
		if (!mcsStoredLocally || freshMcsNeeded){
		//if (true){
			mcs = getAndSaveRemoteMcs();
		} else {
			var mcsJson = JSON.parse(localStorage.getItem(storageMcsId));
			for (var i = 0 ; i < mcsJson.length ; i++){
				mcs[i] = jsonToGraph(mcsJson[i]);
			}
		}
	}

	/**
	 * @method initializeMcs
	 */
	function getAndSaveRemoteCog(){
		$.ajax({url: serviceCog}).success(function(dataCog) {
			cog = jsonToGraph(dataCog);
			localStorage.setItem(storageCogId, JSON.stringify(dataCog));
			localStorage.setItem(storageCogLastUpdateId, new Date());
		});
	}
	
	/**
	 * @method getAndSaveRemoteMcs
	 */
	function getAndSaveRemoteMcs(){
		$.ajax({url: serviceMcs}).success(function(dataMcs) {
			mcs = new Array();
			var arr = new Array();
			for (var i = 0 ; i < dataMcs.length ; i++){
				var dataMc = dataMcs[i];
				mcs[i] = jsonToGraph(dataMc);
				arr[i] = dataMc;
			}
			localStorage.setItem(storageMcsId, JSON.stringify(arr));
			localStorage.setItem(storageMcsLastUpdateId, new Date());
		});
	}
	
	/**
	 * TODO
	 * @method getMaximalCliquesOfSize
	 * @param {Integer} size
	 * @return {Array}
	 */
	function getMaximalCliquesOfSize(size){
		var clqs = new Array();
		for (var i = 0 ; i < mcs.length ; i++){
			var clique = mcs[i];
			if (clique.order() == size){
				clqs[clqs.length] = clique;
			}
		}
		return clqs;
	}

	/**
	 * TODO
	 * @method getMaximalCliquesBiggerThan
	 * @param {Integer} size
	 * @return {Array}
	 */
	function getMaximalCliquesBiggerThan(size){
		var clqs = new Array();
		for (var i = 0 ; i < mcs.length ; i++){
			var clique = mcs[i];
			if (clique.order() > size){
				clqs[clqs.length] = clique;
			}
		}
		return clqs;
	} 

	/**
	 * TODO
	 * @method getVocabulary
	 */
	function getVocabulary(){
		var vocab = new Array();
		for (var i = 0 ; i < cog.order() ; i++){
			var term = cog._vertices[i];
			vocab[i] = term;
		}
		return vocab;
	}

	/**
	 * TODO
	 * @method getMinFrequency
	 * @param {JSONObject} query
	 * @return {Integer} 
	 */
	function getMinFrequency(originalCK){
		var minFreq = Number.MAX_VALUE; 
		var arrayWords = new Array();
		for (var i = 0 ; i < originalCK.length ; i++){
			arrayWords[i] = originalCK[i].text;
		}
		for (var i = 0 ; i < arrayWords.length ; i++){
			for (var j = (i+1) ; j < arrayWords.length ; j++){
				var freq = cog.get(arrayWords[i], arrayWords[j]);
				if (freq != undefined){
					if (freq < minFreq){
						minFreq = freq;
					}
				} else {
					minFreq = 0;
				}
			}
		}
		return minFreq;
	}

	/**
	 * @method getFrequencyWindow
	 */
	function getFrequencyWindow(minFreqQuery){
		var window = new Object();
		var a = minFreqQuery - (frequencyWidth / 2);
		var b = minFreqQuery;
		window.lowerBound = Math.floor((Math.random() * (b + 1 - a)) + a);
		window.upperBound = window.lowerBound + frequencyWidth;
		return window; 
	}
	
	/**
	 * @method ckToArray
	 */
	function ckToArray(ck){
		var array = new Array();
		for (var i = 0 ; i < ck.length ; i++){
			array[i] = ck[i].text;
		}
		return array;
	}

	/**
	 * @method intersectCK
	 */
	function intersectCK(ck1, ck2){
		var array1 = ckToArray(ck1);
		var array2 = ckToArray(ck2);
		return util.intersect(array1, array2);
	}
	
	/**
	 * @method jsonToGraph
	 */
	function jsonToGraph(json){
		var g = new Graph();
		for (var i = 0 ; i < json.length ; i++){
			var vertex1 = json[i].term;
			var frequencies = json[i].frequencies;
			for (var j = 0 ; j < frequencies.length ; j++){
				var vertex2 = frequencies[j].term;
				var frequency = frequencies[j].frequency;
				g.set(vertex1, vertex2, frequency);
			}
		}
		return g;
	}
	
	/**
	 * @method graphToJson
	 */
	function graphToJson(g){
		var json = "[";
		var comma = ", ";
		for (var i = 0 ; i < g.size() ; i++){
			jsonAux = "{";
			var vertex1 = g._vertices[i];
			jsonAux += '"term": "' + vertex1 + '"' + comma + '"frequencies": [';
			var cnt = 0;
			var added = false;
			for (vertex2 in g.adj(vertex1)){
				if (vertex1 < vertex2){
					var freq = g.get(vertex1, vertex2);
					jsonAux += '{"term":"' + vertex2 + '"' + comma + '"frequency": ' + freq + '}' + comma;
					added = true;
				}
				cnt++;
			}
			if (jsonAux.indexOf(comma, jsonAux.length - comma.length) !== -1){
				jsonAux = jsonAux.substring(0, jsonAux.length - comma.length);
			}
			jsonAux += ']';
			jsonAux += "}";
			if (added){
				json += jsonAux + comma;
			}
		}
		if (json.indexOf(comma, json.length - comma.length) !== -1){
			json = json.substring(0, json.length - comma.length);
		}
		json += "]";
		return JSON.parse(json);
	}

	return peas_indist;
});