import { describe, expect, it } from 'vitest';
import { buildPaths, getLatestDataPoint, getValidData } from './geo';
import type { ChargerFeature } from '../types/charger';

function feature(lng: unknown, lat: unknown, systemtime = '2026-05-01T00:00:00'): ChargerFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng as number, lat as number] },
    properties: {
      charger_id: 'C0001',
      charger_name: 'test',
      mnfacr_name: 'BlueOne',
      model_name: 'BO-50',
      volt_type: '급속',
      address: '서울특별시 강남구',
      charging_efficiency: 90,
      systemtime,
      speed: 10,
    },
  };
}

describe('getValidData', () => {
  it('keeps features with numeric non-zero coordinates', () => {
    const features = [feature(127.0, 37.5), feature(126.5, 33.4)];
    expect(getValidData(features)).toHaveLength(2);
  });

  it('drops features whose lng or lat is the string "NULL"', () => {
    const features = [feature('NULL', 37.5), feature(127.0, 'NULL'), feature(127.0, 37.5)];
    expect(getValidData(features)).toHaveLength(1);
  });

  it('drops features with lng or lat equal to 0', () => {
    const features = [feature(0, 37.5), feature(127.0, 0), feature(0, 0), feature(127.0, 37.5)];
    expect(getValidData(features)).toHaveLength(1);
  });

  it('returns empty array when no features are valid', () => {
    expect(getValidData([feature(0, 0), feature('NULL', 'NULL')])).toEqual([]);
  });
});

describe('getLatestDataPoint', () => {
  it('returns null for empty input', () => {
    expect(getLatestDataPoint([])).toBeNull();
  });

  it('returns the feature with the lexicographically-latest systemtime', () => {
    const older = feature(127.0, 37.5, '2026-05-01T00:00:00');
    const newer = feature(127.0, 37.5, '2026-05-02T00:00:00');
    expect(getLatestDataPoint([older, newer])).toBe(newer);
    expect(getLatestDataPoint([newer, older])).toBe(newer);
  });

  it('returns the only feature when length is 1', () => {
    const only = feature(127.0, 37.5);
    expect(getLatestDataPoint([only])).toBe(only);
  });
});

describe('buildPaths', () => {
  it('returns empty array for empty input', () => {
    expect(buildPaths([])).toEqual([]);
  });

  it('appends each unique [lng,lat] tuple in order', () => {
    const features = [feature(127.0, 37.5), feature(127.1, 37.6), feature(127.2, 37.7)];
    expect(buildPaths(features)).toEqual([
      [127.0, 37.5],
      [127.1, 37.6],
      [127.2, 37.7],
    ]);
  });

  it('deduplicates consecutive identical coordinates', () => {
    const features = [feature(127.0, 37.5), feature(127.0, 37.5), feature(127.1, 37.6)];
    expect(buildPaths(features)).toEqual([
      [127.0, 37.5],
      [127.1, 37.6],
    ]);
  });

  it('does NOT deduplicate non-consecutive duplicates (path semantics)', () => {
    const features = [feature(127.0, 37.5), feature(127.1, 37.6), feature(127.0, 37.5)];
    expect(buildPaths(features)).toEqual([
      [127.0, 37.5],
      [127.1, 37.6],
      [127.0, 37.5],
    ]);
  });
});
