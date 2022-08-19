# Spreadsheet Bank

A small library for parsing bank movements in spreadsheet or csv files to an array object. Actually only for mexican banks.

## How to install

### ES6 module

```bash
npm install --save @ocelotlstudio\xlsxbank
```

## Usage

Then you're ready to process first spreadsheet:

Simple Usage

```javascript
import { processSheet } from '@ocelotlstudio\xlsxbank';

/* 
 * fileBuffer of type buffer or arraybuffer or string
 */
const result = processSheet(fileBuffer);
if (typeof result === 'string'){
  //Error msg
}else{
  //Array<Movements>
  /*
   * [
   *  { 
   *    date: Date,
   *    description: string,
   *    credit: number,
   *    debit: number 
   *  }
   * ]
   */
}
```

With type option for xlsx read file

```javascript
import { processSheet } from '@ocelotlstudio\xlsxbank';

/* 
 * @fileBuffer: string | ArrayBuffer | Buffer
 * @type: 'base64' | 'binary' | 'buffer' | 'file' | 'array' | 'string'
 */
const result = processSheet(fileBuffer, type);
if (typeof result === 'string'){
  //Error msg
}else{
  //Array<Movements>
  /*
   * [
   *  { 
   *    date: Date,
   *    description: string,
   *    credit: number,
   *    debit: number 
   *  }
   * ]
   */
}
```

## Features

* Support spreadsheet or csv files.
* Look for differents date formats and process to objects of type Date.

## License

MIT
