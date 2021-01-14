# Spreadsheet Bank

A small library for parsing bank movements in spreadsheet or csv files to an array object. Actually only for mexican banks.

## How to install

### ES6 module

```bash
npm install --save @ocelotlstudio\xlsxbank
```

## Usage

Then you're ready to process first spreadsheet:
```javascript
import { processSheet } from '@ocelotlstudio\xlsxbank';

/** 
 * fileBuffer of type buffer or arraybuffer
*/
const result = processSheet(fileBuffer);
if (typeof result === 'string'){
  //Error msg
}else{
  //Array<Movements>
}
```

## Features

* Support spreadsheet or csv files.
* Look for differents date formats and process to objects of type Date.

## License

MIT
