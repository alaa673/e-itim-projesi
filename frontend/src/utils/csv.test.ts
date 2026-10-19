import { describe, expect, it } from 'vitest';
import { parseCsv, toCsv } from './csv';

describe('csv', () => {
  it('round-trips quotes, delimiters and Turkish characters', () => {
    const rows = [['Ad', 'Not'], ['Çağrı Öz', 'a;b "c"'], ['İlkay', '']];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
  it('detects comma separated files', () => {
    expect(parseCsv('ad,soyad\nDeniz,Kaya\n')).toEqual([['ad', 'soyad'], ['Deniz', 'Kaya']]);
  });
  it('neutralises spreadsheet formulas', () => {
    expect(toCsv([['=SUM(A1)']])).toBe("'=SUM(A1)");
  });
});
