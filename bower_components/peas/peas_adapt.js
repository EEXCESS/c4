/** 
 * @module peas_adapt
 */
define([], function () {

	// XXX Browsing history? Location? 
	
	//************
	//** Module **
	//************
	
	var peas_adapt = {
			
			enrichQuery(query){
				return query;
			},
			
			/**
			 * Allows to adapt a query according to a set of policies. 
			 * @method adaptQuery
			 * @param {JSONObject} query A query of format QF1.
			 * @param {JSONObject} policies A set of policies (attribute and level).
			 * @return {JSONObject} A query of format QF1. 
			 */			
			applyPolicies:function(query, policies){
				var adaptedQuery = query;
				var interests = [];
				var languages = [];
				for (var i = 0 ; i < policies.length ; i++){
					var entry = policies[i];
					var attribute = entry.attribute;
					var level = entry.level;
					if ((attribute == "ageRangePolicy") && (level == 0)){
						delete adaptedQuery.ageRange;
					} else if ((attribute == "genderPolicy") && (level == 0)){
						delete adaptedQuery.gender;
					} else if (attribute == "locationPolicy"){
						if (level == 0){
							delete adaptedQuery.address;
						} else if (level == 1){
							delete adaptedQuery.address.city;
						} 
					} else if (attribute.search("interestPolicy") != -1){
						if (level != 0){
							var idx = attribute.replace(/interestPolicy/i, "");
							var interest = adaptedQuery.interests[idx];
							if (interest != null){
								interests[interests.length] = adaptedQuery.interests[idx];
							}
						}
					} else if (attribute.search("languagePolicy") != -1){
						if (level != 0){
							var idx = attribute.replace(/languagePolicy/i, "");
							var language = adaptedQuery.languages[idx];
							if (language != null){
								languages[languages.length] = adaptedQuery.languages[idx];
							}
						}
					} 
				}
				delete adaptedQuery.interests;
				if (interests.length != 0){
					adaptedQuery.interests = interests;
				}
				delete adaptedQuery.languages;
				if (languages.length != 0){
					adaptedQuery.languages = languages;
				}
				return adaptedQuery;
			}
	};
	
	return peas_adapt;
});