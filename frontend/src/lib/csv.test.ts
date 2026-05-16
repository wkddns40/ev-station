import { describe, expect, it } from 'vitest';
import { convertToCSV, objectToCSVRow } from './csv';

describe('objectToCSVRow', () => {
  it('wraps each value in double quotes and joins with commas, ending with CRLF', () => {
    expect(objectToCSVRow({ a: 'x', b: 'y' })).toBe('"x","y"\r\n');
  });

  it('emits empty field for null or undefined without quotes', () => {
    expect(objectToCSVRow({ a: null, b: undefined, c: 'x' })).toBe(',,"x"\r\n');
  });

  it('stringifies numbers and booleans before quoting', () => {
    expect(objectToCSVRow({ n: 42, b: true })).toBe('"42","true"\r\n');
  });

  it('preserves embedded commas, quotes, and newlines inside the value (raw, no escape)', () => {
    expect(objectToCSVRow({ s: 'a,b' })).toBe('"a,b"\r\n');
    expect(objectToCSVRow({ s: 'he said "hi"' })).toBe('"he said "hi""\r\n');
    expect(objectToCSVRow({ s: 'a\nb' })).toBe('"a\nb"\r\n');
  });
});

describe('convertToCSV', () => {
  it('prepends a UTF-8 BOM so Excel reads Korean correctly', () => {
    expect(convertToCSV([{ a: '서울' }])[0]).toBe('﻿');
  });

  it('returns BOM-only string for empty input', () => {
    expect(convertToCSV([])).toBe('﻿');
  });

  it('emits header row from first row keys, then one row per item', () => {
    const out = convertToCSV([
      { a: 'x', b: 'y' },
      { a: 'p', b: 'q' },
    ]);
    expect(out).toBe('﻿"a","b"\r\n"x","y"\r\n"p","q"\r\n');
  });

  it('uses the first row to derive headers (subsequent rows trust same shape)', () => {
    const out = convertToCSV([
      { a: 'x', b: 'y' },
      { a: 'p', b: 'q', c: 'extra' } as Record<string, unknown>,
    ]);
    expect(out.startsWith('﻿"a","b"\r\n')).toBe(true);
  });
});
