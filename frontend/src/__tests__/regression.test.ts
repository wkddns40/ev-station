/**
 * Phase 1 regression contracts. Each locks the contract for a bug the
 * Phase 1 cleanup fixed, so it cannot silently regress.
 */
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFilteredChargers } from '../hooks/useFilteredChargers';
import { filtersReducer } from '../state/filtersReducer';
import { defaultFilterState } from '../types/filters';
import { convertToCSV } from '../lib/csv';
import type { ChargerFeature } from '../types/charger';
import type { FilterState } from '../types/filters';

function feature(
  id: string,
  mfr: string,
  volt: string,
  addr: string,
  eff: number,
): ChargerFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [127.0, 37.5] },
    properties: {
      charger_id: id,
      charger_name: id,
      mnfacr_name: mfr,
      model_name: 'M',
      volt_type: volt,
      address: addr,
      charging_efficiency: eff,
      systemtime: '2026-05-01T00:00:00',
      speed: 10,
    },
  };
}

describe('Phase 1 regressions', () => {
  it('B3: applies region + manufacturer + voltType + efficiency filters as AND', () => {
    const data = [
      feature('match', 'BlueOne', '급속', '서울특별시 강남구', 90),
      feature('wrong-mfr', 'EVlink', '급속', '서울특별시 강남구', 90),
      feature('wrong-volt', 'BlueOne', '완속', '서울특별시 강남구', 90),
      feature('wrong-region', 'BlueOne', '급속', '제주특별자치도 제주시', 90),
      feature('wrong-eff', 'BlueOne', '급속', '서울특별시 강남구', 85),
    ];
    const filters: FilterState = {
      ...defaultFilterState,
      region: '서울',
      manufacturer: 'BlueOne',
      voltType: '급속',
      efficiencyValue: '90',
    };
    const { result } = renderHook(() => useFilteredChargers(data, filters));
    expect(result.current.filteredResults.map((f) => f.properties.charger_id)).toEqual(['match']);
  });

  it('B4: efficiency filter value of 0 is applied (not treated as empty)', () => {
    const data = [feature('zero', 'BlueOne', '급속', '서울특별시', 0), feature('nonzero', 'BlueOne', '급속', '서울특별시', 90)];
    const filters: FilterState = { ...defaultFilterState, efficiencyValue: '0' };
    const { result } = renderHook(() => useFilteredChargers(data, filters));
    expect(result.current.filteredResults.map((f) => f.properties.charger_id)).toEqual(['zero']);
  });

  it('B5: convertToCSV emits one row per selectedPropertiesData entry', () => {
    const rows = [
      { charger_id: 'A', charger_name: 'A' },
      { charger_id: 'B', charger_name: 'B' },
      { charger_id: 'C', charger_name: 'C' },
    ];
    const csv = convertToCSV(rows);
    const lines = csv.split('\r\n').filter((l) => l.length > 0);
    expect(lines).toHaveLength(rows.length + 1);
  });

  it('B6: RESET returns selectedFilters as object with empty string fields (not array)', () => {
    const dirty: FilterState = {
      ...defaultFilterState,
      region: '서울',
      manufacturer: 'BlueOne',
      voltType: '급속',
      efficiencyValue: '90',
    };
    const reset = filtersReducer(dirty, { type: 'RESET' });
    expect(Array.isArray(reset)).toBe(false);
    expect(reset).toEqual({
      region: '',
      manufacturer: '',
      voltType: '',
      efficiencyValue: '',
      sortOrder: 'asc',
      filterStep: 0,
    });
  });
});
