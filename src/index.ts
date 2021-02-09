import { read, utils, WorkSheet } from 'xlsx';
import { parse } from 'date-fns';
import { es } from 'date-fns/locale'

interface Entry {
  matched: boolean;
  column: number | null;
}

interface Header {
  matched: boolean;
  isValid: boolean;
  date: Entry;
  desc: Entry;
  debit: Entry;
  credit: Entry;
  import: Entry;
}

interface Movements {
  date: string | Date;
  description: string;
  debit: string | number;
  credit: string | number;
}

function processSheet(
  data: string | ArrayBuffer | Buffer,
  type?: 'base64' | 'binary' | 'buffer' | 'file' | 'array' | 'string'
): string | Array<Movements> {
  // Read the Excel File data.
  const workbook = read(data, {
    type: type ? type : 'buffer', // NODE SCRIPT
    raw: true,
    cellText: true,
  });

  // Fetch the name of First Sheet.
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const limiter = sheet['!ref'];
  if (limiter && limiter !== 'A1:A1') {
    try {
      const range = utils.decode_range(limiter);
      const dateHeaderRegex = /FECHA/i;
      const descHeaderRegex = /^(DESCRIPCI[oOóÓ]N)|CONCEPTO(S{0,1})$/i;
      const debitHeaderRegex = /^(RETIRO(S{0,1})|D[eEéÉ]BITO|CARGO(S{0,1}))$/i;
      const creditHeaderRegex = /^(ABONO(S{0,1})|CR[eEéÉ]DITO|DEPOSITO(S{0,1}))$/i;
      const impHeaderRegex = /^IMPORTE$/i;
      const headers: Header = {
        matched: false,
        isValid: false,
        date: {
          matched: false,
          column: null,
        },
        desc: {
          matched: false,
          column: null,
        },
        debit: {
          matched: false,
          column: null,
        },
        credit: {
          matched: false,
          column: null,
        },
        import: {
          matched: false,
          column: null,
        },
      };
      const movements: Array<Movements> = [];
      const error = {
        status: false,
        msg: '',
      };
      // iterate for find headers based on date and max 10 rows.
      let count = 0;
      const limit = 10;
      for (let row = range.s.r; row <= range.e.r; row += 1) {
        if (!headers.matched && count >= limit) {
          break;
        }
        count += 1;
        if (!headers.matched) {
          // find for headers
          for (let column = range.s.c; column <= range.e.c; column += 1) {
            const cell = sheet[utils.encode_cell({ c: column, r: row })];
            if (cell) {
              // if the cell has value then we look for regex match
              if (cell.v) {
                if (dateHeaderRegex.test(cell.v)) {
                  // is date header
                  headers.date.matched = true;
                  headers.date.column = column;
                  headers.matched = true;
                } else if (descHeaderRegex.test(normalice(cell.v.toString()))) {
                  // is description header
                  headers.desc.matched = true;
                  headers.desc.column = column;
                } else if (debitHeaderRegex.test(normalice(cell.v.toString()))) {
                  // is debit header
                  headers.debit.matched = true;
                  headers.debit.column = column;
                } else if (creditHeaderRegex.test(normalice(cell.v.toString()))) {
                  // is credit header
                  headers.credit.matched = true;
                  headers.credit.column = column;
                } else if (impHeaderRegex.test(cell.v)) {
                  // is import header
                  headers.import.matched = true;
                  headers.import.column = column;
                }
              }
            }
          }
        } else {
          // validate if credit and debit or import exists
          if (!headers.isValid) {
            if (headers.import.matched || (headers.credit.matched && headers.debit.matched)) {
              headers.isValid = true;
            } else {
              error.status = true;
              error.msg = 'No se encontro ningun cabecera que tenga el cargo o abono';
              break;
            }
          }
          fillData(sheet, headers, movements, row);
        }
      }
      if (!headers.matched) {
        //  custom templates
        // Template HSBC two columns
        console.log(range);
        if (range.e.c === 3) {
          const headerHSBC: Header = {
            matched: true,
            isValid: true,
            date: {
              matched: true,
              column: 0,
            },
            desc: {
              matched: true,
              column: 2,
            },
            debit: {
              matched: false,
              column: null,
            },
            credit: {
              matched: false,
              column: null,
            },
            import: {
              matched: true,
              column: 3,
            },
          };
          const HSBCMovements: Array<Movements> = [];
          for (let row = range.s.r; row <= range.e.r; row += 1) {
            fillData(sheet, headerHSBC, HSBCMovements, row);
          }
          if (HSBCMovements.length > 0) {
            if (!analizeDate(HSBCMovements)) {
              return 'No se encontro formato para la fecha ingresada o no todos las fechas tienen mismo formato';
            }
            return HSBCMovements;
          }
        }
        if (range.e.c === 2) {
          //Template HSBC One column
          const headerHSBCOneColumn: Header = {
            matched: true,
            isValid: true,
            date: {
              matched: true,
              column: 0,
            },
            desc: {
              matched: true,
              column: 1,
            },
            debit: {
              matched: false,
              column: null,
            },
            credit: {
              matched: false,
              column: null,
            },
            import: {
              matched: true,
              column: 2,
            },
          };
          const HSBCMovementsOneColumn: Array<Movements> = [];
          for (let row = range.s.r; row <= range.e.r; row += 1) {
            fillData(sheet, headerHSBCOneColumn, HSBCMovementsOneColumn, row);
          }
          if (HSBCMovementsOneColumn.length > 0) {
            if (!analizeDate(HSBCMovementsOneColumn)) {
              return 'No se encontro formato para la fecha ingresada o no todos las fechas tienen mismo formato';
            }
            return HSBCMovementsOneColumn;
          }
        }
        return 'No se ha encontrado un template valido para este excel usa el multiple';
      }
      if (error.status) {
        return error.msg;
      }
      if (movements.length > 0) {
        if (!analizeDate(movements)) {
          return 'No se encontro formato para la fecha ingresada o no todos las fechas tienen mismo formato';
        }
      }
      return movements;
    } catch (e) {
      return e.toString();
    }
  }
  return 'Archivo excel no valido';
}

function fillData(sheet: WorkSheet, headers: Header, movements: Array<Movements>, row: number): void {
  const validDate = /^(\d{1,4}|[a-z]{3,4})([-|/| ])(\d{1,4}|[a-z]{3,4})([-|/| ])(\d{1,4})$/i;
  // as we have headers now we fill data
  const dateValue = sheet[utils.encode_cell({ c: headers.date.column, r: row })];
  if (dateValue) {
    const validDateValue = dateValue.v && validDate.test(dateValue.v.toString().trim());
    const isValidDate = validDateValue || (dateValue.w && validDate.test(dateValue.w.toString().trim()));
    if (isValidDate) {
      const dateInput = validDateValue ? dateValue.v.toString().trim() : dateValue.w.toString().trim();
      let debitInput: string | number = '';
      let creditInput: string | number = '';
      const cellDescription = headers.desc.matched
        ? sheet[utils.encode_cell({ c: headers.desc.column, r: row })]
        : null;
      const descriptionInput: string = cellDescription ? cellDescription.v : 'SIN CONCEPTO';
      if (headers.import.matched) {
        const cellImport = sheet[utils.encode_cell({ c: headers.import.column, r: row })];
        if (!cellImport) {
          return;
        }
        let value = cellImport.v || cellImport.w;
        value = value.toString().replace(/,/g, '');
        if (Number.isNaN(Number(value))) {
          return;
        }
        const rawNumber = value ? parseFloat(value) : 0;
        if (rawNumber < 0) {
          debitInput = Math.abs(rawNumber);
          creditInput = 0;
        } else {
          debitInput = 0;
          creditInput = Math.abs(rawNumber);
        }
      } else {
        const cellDebit = sheet[utils.encode_cell({ c: headers.debit.column, r: row })];
        const cellCredit = sheet[utils.encode_cell({ c: headers.credit.column, r: row })];
        let debitTempValue = cellDebit ? cellDebit.v || cellDebit.w : 0;
        debitTempValue = debitTempValue.toString().replace(/,/g, '');
        let creditTempValue = cellCredit ? cellCredit.v || cellCredit.w : 0;
        creditTempValue = creditTempValue.toString().replace(/,/g, '');
        debitInput = Math.abs(debitTempValue ? parseFloat(debitTempValue) : 0);
        creditInput = Math.abs(creditTempValue ? parseFloat(creditTempValue) : 0);
      }
      movements.push({
        date: dateInput,
        credit: creditInput,
        debit: debitInput,
        description: descriptionInput,
      });
    }
  }
}

/**
 * Function analizeDate
 * currently only support one time format
 * @param movements
 */
function analizeDate(movements: Array<Movements>): boolean {
  if (movements.length > 0) {
    const formatsData = [
      'MM/dd/yyyy',
      'MM-dd-yyyy',
      'MM dd yyyy',
      'MM/dd/yy',
      'MM-dd-yy',
      'MM dd yy',
      'dd MM yy',
      'dd-MM-yy',
      'dd/MM/yy',
      'dd/MM/yyyy',
      'dd-MM-yyyy',
      'dd MM yyyy',
      // FORMAT MMM
      'MMM/dd/yyyy',
      'MMM-dd-yyyy',
      'MMM dd yyyy',
      'MMM/dd/yy',
      'MMM-dd-yy',
      'MMM dd yy',
      'dd MMM yy',
      'dd-MMM-yy',
      'dd/MMM/yy',
      'dd/MMM/yyyy',
      'dd-MMM-yyyy',
      'dd MMM yyyy',
      // yyyy yy dd
      'yy MM dd',
      'yy-MM-dd',
      'yy/MM/dd',
      'yyyy/MM/dd',
      'yyyy-MM-dd',
      'yyyy MM dd',
      'yy MMM dd',
      'yy-MMM-dd',
      'yy/MMM/dd',
      'yyyy/MMM/dd',
      'yyyy-MMM-dd',
      'yyyy MMM dd',
    ];
    const dateIA = {
      matches: 0,
      any: false,
      formats: [''],
      ready: false,
      finalFormat: '',
    };
    dateIA.formats = [];
    const firstDate = movements[0].date;
    // Tratamos de matchear su formato de acuerdo a los conocidos
    formatsData.forEach((format) => {
      if (typeof firstDate === 'string') {
        const tempDate = parse(firstDate, format, new Date());
        if (!isNaN(tempDate.getTime())) {
          if (tempDate.getFullYear() > 2000 && tempDate.getFullYear() < 2100) {
            dateIA.matches += 1;
            dateIA.formats.push(format);
            dateIA.any = true;
          }
        }
      }
    });
    if (dateIA.matches === 0) return false;
    if (dateIA.matches === 1) {
      dateIA.finalFormat = dateIA.formats[0];
    } else if (dateIA.matches === 2) {
      const onlyDates = movements.map((movement) => {
        const splitDate = movement.date.toString().split(/(-|\/| )/);
        return splitDate;
      });
      const reduceFunction = (acc: [], value: string) => ({
        ...acc,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        [value]: (acc[<any>value] || 0) + 1, // eslint-disable-line @typescript-eslint/no-explicit-any
      });
      if (/^(DD(-|\/| )(M{2,3})(-|\/| )yy)$/i.test(dateIA.formats[0])) {
        // case year equals to day
        const firstValues = onlyDates.map((dateSplit) => dateSplit[0]);
        const lastValues = onlyDates.map((dateSplit) => dateSplit[dateSplit.length - 1]);
        const countsFirst = Object.keys(firstValues.reduce(reduceFunction, [])).length;
        const countsLast = Object.keys(lastValues.reduce(reduceFunction, [])).length;
        if (countsFirst > countsLast) {
          dateIA.finalFormat = dateIA.formats[0];
        } else if (countsFirst < countsLast) {
          dateIA.finalFormat = dateIA.formats[1];
        } else {
          dateIA.finalFormat = dateIA.formats[0];
        }
      } else {
        // case month equals to day
        const firstValues = onlyDates.map((dateSplit) => dateSplit[0]);
        const lastValues = onlyDates.map((dateSplit) => dateSplit[2]);
        const countsFirst = Object.keys(firstValues.reduce(reduceFunction, [])).length;
        const countsLast = Object.keys(lastValues.reduce(reduceFunction, [])).length;
        if (countsFirst > countsLast) {
          dateIA.finalFormat = dateIA.formats[1];
        } else if (countsFirst < countsLast) {
          dateIA.finalFormat = dateIA.formats[0];
        } else {
          return false;
        }
      }
    } else {
      // more or two coincidence
      return false;
    }
    try {
      movements.forEach((movement) => {
        if (typeof movement.date === 'string') {
          let tempDate = parse(movement.date, dateIA.finalFormat, new Date());
          if (isNaN(tempDate.getTime())) {
            tempDate = parse(movement.date, dateIA.finalFormat, new Date(), {
              locale: es,
            });
          }
          if (!isNaN(tempDate.getTime())) {
            movement.date = tempDate;
          } else {
            throw new Error();
          }
        }
      });
    } catch (e) {
      return false;
    }
    return true;
  }
  return false;
}

function normalice(s: string): string {
  const s1 = 'ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç';
  const s2 = 'AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc';
  for (let i = 0; i < s1.length; i++) s = s.replace(new RegExp(s1.charAt(i), 'g'), s2.charAt(i));
  return s;
}

export { processSheet, fillData, analizeDate, normalice };
