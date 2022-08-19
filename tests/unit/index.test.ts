import { parse } from 'date-fns';

import { processSheet } from '~/index';
import { TestCase } from '../test-case';

describe('xslxbank', () => {
    test('parse santander credit card', () => {
        const fileContent = TestCase.fileContents('santander_TC_dic.xlsx');
        expect(processSheet(fileContent)).toEqual([
            { credit: 0, debit: 51.47, description: 'Concepto 1', date: parse('16-Dec-20', 'dd-MMM-yy', new Date()) },
            { credit: 555.47, debit: 0, description: 'Concepto 2', date: parse('15-Dec-20', 'dd-MMM-yy', new Date()) },
            { credit: 589.6, debit: 0, description: 'Concepto 3', date: parse('14-Dec-20', 'dd-MMM-yy', new Date()) },
            { credit: 0, debit: 589.6, description: 'Concepto 4', date: parse('14-Dec-20', 'dd-MMM-yy', new Date()) }
        ]);
    });

    test('parse santander debit card', () => {
        const fileContent = TestCase.fileContents('santander_personal_dic.xlsx');
        expect(processSheet(fileContent).length).toEqual(25);
    });

    test('parse santander old format', () => {
        const fileContent = TestCase.fileContents('santander_old.xlsx');
        expect(processSheet(fileContent).length).toEqual(2);
    });

    test('parse banamex perfiles', () => {
        const fileContent = TestCase.fileContents('BNMX_Perfiles_dic.CSV');
        expect(processSheet(fileContent).length).toEqual(21);
    });

    test('parse banamex debit', () => {
        const fileContent = TestCase.fileContents('BNMX_DIC-TDCR.CSV');
        expect(processSheet(fileContent).length).toEqual(13);
    });

    test('parse banamex debit tdcr', () => {
        const fileContent = TestCase.fileContents('BNMX_DIC2-TDCR.CSV');
        expect(processSheet(fileContent).length).toEqual(5);
    });

    test('parse banamex 2022', () => {
        const fileContent = TestCase.fileContents('2022banamex.xlsx');
        expect(processSheet(fileContent).length).toEqual(9);
    });

    test('parse banorte', () => {
        const fileContent = TestCase.fileContents('BanorteConsulta.csv');
        expect(processSheet(fileContent).length).toEqual(12);
    });

    test('parse banorte another', () => {
        const fileContent = TestCase.fileContents('Banorte_dic.csv');
        expect(processSheet(fileContent).length).toEqual(20);
    });

    test('parse bbva', () => {
        const fileContent = TestCase.fileContents('Bancomermovimientos.xlsx');
        expect(processSheet(fileContent).length).toEqual(10);
    });

    test('parse hsbc trans', () => {
        const fileContent = TestCase.fileContents('HSBCTransHist.csv');
        expect(processSheet(fileContent)).toEqual([
            {
                credit: 0,
                debit: 10365.55,
                description: 'CARGO BPI TRANSFERENCIA A - 4807       ',
                date: parse('17 SEP 2020', 'dd MMM yyyy', new Date())
            },
            {
                credit: 0,
                debit: 4634.45,
                description: 'PAGO DE TARJETA: 123123123123 EN BPI',
                date: parse('17 SEP 2020', 'dd MMM yyyy', new Date())
            },
            {
                credit: 15000,
                debit: 0,
                description: 'AHORRO',
                date: parse('17 SEP 2020', 'dd MMM yyyy', new Date())
            }
        ]);
    });

    test('parse hsbc debito', () => {
        const fileContent = TestCase.fileContents('hsbc_debito.csv');
        expect(processSheet(fileContent).length).toEqual(12);
    });
    test('parse hsbc ado one column', () => {
        const fileContent = TestCase.fileContents('hsbc_ado.csv');
        expect(processSheet(fileContent).length).toEqual(28);
    });

    test('error with template no valid', () => {
        const fileContent = TestCase.fileContents('santander_personal_dic_no_headers.xlsx');
        expect(processSheet(fileContent)).toEqual(
            'No se ha encontrado un template valido para este excel usa el multiple'
        );
    });

    test('error with parse banamex perfiles different encode', () => {
        const fileContent = TestCase.fileContents('BNMX_Perfiles_dic_bad_encode.csv');
        expect(processSheet(fileContent)).toEqual('No se encontro ningun cabecera que tenga el cargo o abono');
    });

    test('error with bad encoding', () => {
        const fileContent = TestCase.fileContents('BNMX_OLD.CSV');
        expect(processSheet(fileContent)).toEqual('No se encontro ningun cabecera que tenga el cargo o abono');
    });

    test('error with parse bnmx mult date', () => {
        const fileContent = TestCase.fileContents('BNMX_DIC2-TDCR_mult_date.CSV');
        expect(processSheet(fileContent)).toEqual(
            'No se encontro formato para la fecha ingresada o no todos las fechas tienen mismo formato'
        );
    });

    test('error with empty file', () => {
        const fileContent = TestCase.fileContents('emptyexcel.xlsx');
        expect(processSheet(fileContent)).toEqual('Archivo excel no valido');
    });

    test('error with only headers', () => {
        const fileContent = TestCase.fileContents('onlyHeaders.csv');
        expect(processSheet(fileContent).length).toEqual(0);
    });
    test('error with template multiple', () => {
        const fileContent = TestCase.fileContents('template_multiple.xlsx');
        expect(processSheet(fileContent).length).toEqual(1);
    });

    test('error with multiple date format on hsbc', () => {
        const fileContent = TestCase.fileContents('HSBCMultDate.csv');
        expect(processSheet(fileContent)).toEqual(
            'No se encontro formato para la fecha ingresada o no todos las fechas tienen mismo formato'
        );
    });
});
