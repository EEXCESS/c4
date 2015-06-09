/*
 * The Citation Processor is a wrapper for the citeproc-js library.
 * It simplifies the use of citeproc-js and is implemented in
 * pseudo-class style.
 * @param citations: An object containing the information to be cited.
 * @param locals: Content of of locales-xml file. example:
 *                https://bitbucket.org/fbennett/citeproc-js/src/01429717257da70cb8cef6dccbde51fdf6fa763d/demo/locales-en-US.xml?at=default
 *                Additonal information
 *                http://docs.citationstyles.org/en/latest/primer.html#locale-files
 *                locales files repository
 *                https://github.com/citation-style-language/locales
 * @param style: the path to a style csl-file. >7.000 file can be found here: https://zotero.org/styles
 */
var CitationProcessor = function(citations, locals, style){
   //optional parameters
   if(typeof locals === 'undefined') { locals = citeprocConsts.localsUsEn }
   if(typeof style === 'undefined') { style = citeprocConsts.style }

   var citations = citations,
   // Initialize a system object, which contains two methods needed by the engine.
   citeprocSys = {
      context: this,
      // The lang parameter is not used, but still requiered, since CLS.Eninge
      // will call this functions including this parameter.
      retrieveLocale: function (lang){
         return locals;
      },
      retrieveItem: function(id){
         return citations[id];
      }
   };


   var removeSurroundingHtmlTags = function(str){
      return str.replace(/^\<[^\>]*\>/, "").replace(/\<\/[^\>]*\>$/, "");
   }

   /*
    * This renders the citation-object and returs it. Thus, it is, beside the init-
    * function, the only publicly-accessable function. It returns an HTML-containing
    * string.
    */
   var renderCitations = function(citations) {
      var citeprocEngine = new CSL.Engine(citeprocSys, style);
      if(citeprocEngine != null){
         var itemIDs = [];
         for (var key in citations) {
            itemIDs.push(key);
         }
         citeprocEngine.updateItems(itemIDs);
         var bibResult = citeprocEngine.makeBibliography();
         for(i=0; i<bibResult[1].length; i++){
            bibResult[1][i] = removeSurroundingHtmlTags(bibResult[1][i].trim());
         }
         return bibResult[1];
      } else {
         throw new Error("Couldn't get CSL Processor. Style or locale parameters might be falsely");
      }
   };

   return renderCitations(citations);
};
