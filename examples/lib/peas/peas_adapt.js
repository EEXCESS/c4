/** 
 * @module peas_adapt
 */
define([], function () {

	//************
	//** Module **
	//************
	
	var peas_adapt = {
			
			/**
			 * TODO
			 * @method adaptQuery
			 * @param {JSONObject} query A query of format QF1.
			 * @return {JSONObject} A query of format QF1. 
			 */			
			adaptQuery(query){
				var adaptedQuery = query;
				return adaptedQuery;
			}
	};
	
	/*function cleanQuery(query){
		var cleanedQuery = query;
		delete cleanedQuery.firstName;
		delete cleanedQuery.lastName;
		delete cleanedQuery.address;
		delete cleanedQuery.gender;
		delete cleanedQuery.birthDate;
		delete cleanedQuery.languages;
		delete cleanedQuery.interests;
		return cleanedQuery;
	}
	
	function enrichQuery(query){
		var enrichedQuery = query;
		// Address
		if (profile.isCityDisclosed() || profile.isCountryDisclosed()){
			var address = new Object();
			if (profile.isCityDisclosed()){
				address.city = profile.getCity();
			}
			if (profile.isCountryDisclosed()){
				address.country = profile.getCountry();
			}
			enrichedQuery.address = address;
		}
		// Languages
		var languages = [];
		var storedLanguages = profile.getLanguages();
		for (var i = 0 ; i < storedLanguages.length ; i++){
			if (profile.isLanguageDisclosed(i)){
				var storedLanguage = storedLanguages[i];
				var language = new Object();
				language.iso2 = storedLanguage.languageCode;
				var skill = storedLanguage.languageSkill;
				var level = skill2level(skill);
				language.languageCompetenceLevel = level;
				languages[languages.length] = language;
			}
		}
		if (languages.length > 0){
			enrichedQuery.languages = languages;
		}
		// Interests
		var interests = [];
		var storedInterests = profile.getInterests();
		for (var i = 0 ; i < storedInterests.length ; i++){
			if (profile.isInterestDisclosed(i)){
				var storedInterest = storedInterests[i];
				for (var j = 0 ; j < storedInterest.length ; j++){
					var interest = new Object();
					interest.text = storedInterest[j];
					interests[interests.length] = interest;
				}
			}
		}
		if (interests.length > 0){
			enrichedQuery.interests = interests;
		}		
		return enrichedQuery;
	}
	
	function skill2level(skill){
		var idx = null;
		var i = 0;
		var length = cst.TAB_LANGUAGE_SKILLS.length; 
		var found = false;
		while ((i < length) && (!found)){
			found = (cst.TAB_LANGUAGE_SKILLS[i] == skill);
			if (found){
				idx = (length - i) / length;
				idx = Math.round(idx * 100) / 100;
			}
			i++;
		}
		return idx;
	}*/
	
	return peas_adapt;
});