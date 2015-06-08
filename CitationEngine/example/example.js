$j = jQuery.noConflict();

var Example = function() {
   getFile = function(path){
         var request = $j.ajax({
            type: "GET",
            url: path,
            async: false,
         });
         if(request.status == 200){
            return request.responseText;
         }else{
            return null;
         }
      }


   var main = function() {

      var knuthsBook = {
         "Item-2": {
            "id": "Item-2",
            "type": "book",
            "title": "Digital Typography",
            "author": [
               {
                  "family": "Knuth",
                  "given": "Donald E."
               }
            ],
            "issued": {
               "date-parts": [
                  [
                     "1998",
                     6,
                     1
                  ]
               ]
            }
         }
      };
      var citationText = CITATION_PROCESSOR(knuthsBook,
         getFile(window.location.href.replace(/index.html$/, "locales-de-DE.xml")),
         getFile(window.location.href.replace(/index.html$/, "american-sociological-association.csl")));
      var aal = "";
   };

   main();
}

Example();
