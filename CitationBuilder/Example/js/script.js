$j = jQuery.noConflict();
$j(document).ready(function() {

   var getFile = function(path){
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
   },

   syntaxHighlight = function(json) {
      json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
         var cls = 'number';
         if (/^"/.test(match)) {
            if (/:$/.test(match)) {
               cls = 'key';
            } else {
               cls = 'string';
            }
         } else if (/true|false/.test(match)) {
            cls = 'boolean';
         } else if (/null/.test(match)) {
            cls = 'null';
         }
         return '<span class="' + cls + '">' + match + '</span>';
      });
   };

   var biblography = JSON.parse(getFile(window.location.href.replace(/index.html$/, "") + "bibliography.json"));

   var enAPA = CitationProcessor(biblography);
   $j("<p><b>APA with enUS localization (default settings):</b>").appendTo(document.body);
   for(var i=0; i<enAPA.length; i++){
      $j("<p>" + enAPA[i] + "</p>").appendTo(document.body);
   }
   $j("</p><br>").appendTo(document.body);

   var deASA = CitationProcessor(biblography,
      getFile(window.location.href.replace(/index.html$/, "") + "locales-de-DE.xml"),
      getFile(window.location.href.replace(/index.html$/, "") + "chicago-fullnote-bibliography.csl"));
   $j("<p><b>Chicago fullnote bibliography with deDE localization:</b>").appendTo(document.body);
   for(var i=0; i<deASA.length; i++){
      $j("<p>" + deASA[i] + "</p>").appendTo(document.body);
   }
   $j("</p><br>").appendTo(document.body);

   $j("<p><b>The XML representation of the bibliographic objects:</b></p><pre>" + syntaxHighlight(JSON.stringify(biblography, null, 4)) + "</pre><br>").appendTo(document.body);

});
