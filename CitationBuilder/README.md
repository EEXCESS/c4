# Purpose
This citation builder module assembles ready-to-use citations from metadata provided as Javascript object.
It's build around the more capable but also more difficult to handle [citeproc-js](https://bitbucket.org/fbennett/citeproc-js/wiki/Home) framework.

# Getting started
The library file can be found here: `CitationBuilder/citationBuilder.js`.
The API of this module is simple. There is only one function available:

`CitationProcessor(citationMetadata, [localizationObject], [styleDefinition]);`

The `citationMetadata` parameter is mandatory. It's a javascript object providing the metadata required
for the citation. Here you can see a basic example:
``` json
"Item-1": {
  "id": "Item-1",
  "type": "book",
  "title": "Digital Typography",
  "publisher": "Center for the Study of Language and Information",
  "number-of-pages": "685",
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
```
Explore the `bibliography.json` file located in the `Example` folder in order to discover further meta data fields.

The `localizationObject` parameter is optional. A string is expected here (not an URL). It allows language-specific citations. Left blank, english localization will be used. To find out more about Localization consult examine [this](http://docs.citationstyles.org/en/latest/primer.html#locale-files) description. If you want to obtain localization files, [this](https://github.com/citation-style-language/locales) repository may help you.

The `styleDefinition` parameter is optional. A string is expected here (not an URL). It determines the citation style that will be utilized. The default style is the 5th edition of [APA](https://www.zotero.org/styles/apa). The [Zotero CSL Repository](https://www.zotero.org/styles) provides additional styles.


## Example application
Along with the library file an example application is shipped. It shows how to use the module and is a decent starting point for a project. Attention should be paid to the fact that it only works as intended when it's ran through a web server. This is, because some files are requested via AJAX, but they don't work locally (i.e. at `file://` locations). This means, you have to install a web sever and deploy the application the servers directory.

## For Developers
Since the module described here is build around citeproc-js it exhibits external dependencies. For the sake of usability all files are compiled into a single js file. The `CitationBuilder/js/` subdirectory contains all these files. `CLSWrapper.js` contains the actual wrapper (that's were the work has been done). The other files are just external references. `compileLib.sh` concatenates the files in the correct order and produces `citationBuilder.js` which represents the module itself (that is the only file that needs to be deployed). 
