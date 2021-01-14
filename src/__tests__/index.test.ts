import { readFileSync } from 'fs';
import { processSheet } from '../index';
import { parse } from 'date-fns';

describe('parse excel by Header', () => {
  test('parse Santander Credit Card File', () => {
    const fileContent = readFileSync(`${__dirname}/banksFiles/santander_TC_dic.xlsx`);
    expect(processSheet(fileContent)).toEqual([
      { credit: 0, debit: 51.47, description: 'Concepto 1', date: parse('16-Dec-20', 'dd-MMM-yy', new Date()) },
      { credit: 555.47, debit: 0, description: 'Concepto 2', date: parse('15-Dec-20', 'dd-MMM-yy', new Date()) },
      { credit: 589.6, debit: 0, description: 'Concepto 3', date: parse('14-Dec-20', 'dd-MMM-yy', new Date()) },
      { credit: 0, debit: 589.6, description: 'Concepto 4', date: parse('14-Dec-20', 'dd-MMM-yy', new Date()) },
    ]);
  });
  test('parse Santander Debit Card File', () => {
    const fileContent = readFileSync(`${__dirname}/banksFiles/santander_personal_dic.xlsx`);
    expect(processSheet(fileContent).length).toEqual(25);
  });
  test('parse Santander old format', () => {
    const fileContent = readFileSync(`${__dirname}/banksFiles/santander_old.xlsx`);
    expect(processSheet(fileContent).length).toEqual(2);
  });
  test('parse Banamex perfiles', () => {
    const fileContent = readFileSync(`${__dirname}/banksFiles/BNMX_Perfiles_dic.CSV`);
    expect(processSheet(fileContent).length).toEqual(21);
  });
  test('parse BNMX debit', () => {
    const fileContent = readFileSync(`${__dirname}/banksFiles/BNMX_DIC-TDCR.CSV`);
    expect(processSheet(fileContent).length).toEqual(13);
  });
  test('parse Banamex debit 2', () => {
    const fileContent = readFileSync(`${__dirname}/banksFiles/BNMX_DIC2-TDCR.CSV`);
    expect(processSheet(fileContent).length).toEqual(5);
  });
  test('parse Banorte', () => {
    const fileContent = readFileSync(`${__dirname}/banksFiles/BanorteConsulta.csv`);
    expect(processSheet(fileContent).length).toEqual(12);
  });
  test('parse Banorte 2', () => {
    const fileContent = readFileSync(`${__dirname}/banksFiles/Banorte_dic.csv`);
    expect(processSheet(fileContent).length).toEqual(20);
  });
  test('parse BBVA', () => {
    const fileContent = readFileSync(`${__dirname}/banksFiles/Bancomermovimientos.xlsx`);
    expect(processSheet(fileContent).length).toEqual(10);
  });
});

describe('test files with errors', () => {
  test(' templete no valid', () => {
    const fileContent = readFileSync(`${__dirname}/banksFiles/santander_personal_dic_no_headers.xlsx`);
    expect(processSheet(fileContent)).toEqual('No se ha encontrado un template valido para este excel usa el multiple');
  });
  test('parse_banamex Perfiles different encode', () => {
    const fileContent = readFileSync(`${__dirname}/banksFiles/BNMX_Perfiles_dic_bad_encode.csv`);
    expect(processSheet(fileContent)).toEqual('No se encontro ningun cabecera que tenga el cargo o abono');
  });
  test('bad encoding', () => {
    const fileContent = readFileSync(`${__dirname}/banksFiles/BNMX_OLD.CSV`);
    expect(processSheet(fileContent)).toEqual('No se encontro ningun cabecera que tenga el cargo o abono');
  });
  test('parse bnmx mult date', () => {
    const fileContent = readFileSync(`${__dirname}/banksFiles/BNMX_DIC2-TDCR_mult_date.CSV`);
    expect(processSheet(fileContent)).toEqual(
      'No se encontro formato para la fecha ingresada o no todos las fechas tienen mismo formato'
    );
  });
  test('empty file', () => {
    const fileContent = readFileSync(`${__dirname}/banksFiles/emptyexcel.xlsx`);
    expect(processSheet(fileContent)).toEqual('Archivo excel no valido');
  });
  test('only headers', () => {
    const fileContent = readFileSync(`${__dirname}/banksFiles/onlyHeaders.csv`);
    expect(processSheet(fileContent).length).toEqual(0);
  });
});

describe('excelParserByTemplate', () => {
  const fileContent = readFileSync(`${__dirname}/banksFiles/HSBCTransHist.csv`);
  it('parse HSBC', () =>
    expect(processSheet(fileContent)).toEqual([
      {
        credit: 0,
        debit: 10365.55,
        description: 'CARGO BPI TRANSFERENCIA A - 4807       ',
        date: parse('17 SEP 2020', 'dd MMM yyyy', new Date()),
      },
      {
        credit: 0,
        debit: 4634.45,
        description: 'PAGO DE TARJETA: 123123123123 EN BPI',
        date: parse('17 SEP 2020', 'dd MMM yyyy', new Date()),
      },
      {
        credit: 15000,
        debit: 0,
        description: 'AHORRO',
        date: parse('17 SEP 2020', 'dd MMM yyyy', new Date()),
      },
    ]));
  test('multiple Date Format HSBC', () => {
    const fileContent = readFileSync(`${__dirname}/banksFiles/HSBCMultDate.csv`);
    expect(processSheet(fileContent)).toEqual(
      'No se encontro formato para la fecha ingresada o no todos las fechas tienen mismo formato'
    );
  });
});
