cd js

if [ "$1" == "--amd" ] && [ "$#" == 1 ]; then
   echo "define([], function(){" > ../citationBuilder.js
   cat xmldom.js citeproc.js citeprocConsts.js CLSWrapper.js >> ../citationBuilder.js
   printf "return CitationProcessor;\n});" >> ../citationBuilder.js
else
   if [ $# == 0 ]; then
      cat xmldom.js citeproc.js citeprocConsts.js CLSWrapper.js > ../citationBuilder.js
   else
         echo "
Usage: compileLib [--amd] 
--amd:     Optional parameter. Determines whether the lib is amd compatible
         "
   fi
fi
