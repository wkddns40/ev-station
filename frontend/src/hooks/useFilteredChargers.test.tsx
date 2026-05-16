import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFilteredChargers } from './useFilteredChargers';
import { defaultFilterState } from '../types/filters';
import type { ChargerFeature } from '../types/charger';
import type { FilterState } from '../types/filters';

function feature(
  charger_id: string,
  mnfacr_name: string,
  volt_type: string,
  address: string,
  charging_efficiency: number,
): ChargerFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [127.0, 37.5] },
    properties: {
      charger_id,
      charger_name: charger_id,
      mnfacr_name,
      model_name: 'M',
      volt_type,
      address,
      charging_efficiency,
      systemtime: '2026-05-01T00:00:00',
      speed: 10,
    },
  };
}

const DATA: ChargerFeature[] = [
  feature('C1', 'BlueOne', '급속', '서울특별시 강남구', 90),
  feature('C2', 'ChargePoint', '완속', '경기도 수원시', 85),
  feature('C3', 'BlueOne', '급속', '제주특별자치도 제주시', 92),
  feature('C4', 'EVlink', '완속', '서울특별시 마포구', 88),
];

describe('useFilteredChargers', () => {
  it('returns all data when filters are default (empty strings)', () => {
    const { result } = renderHook(() => useFilteredChargers(DATA, defaultFilterState));
    expect(result.current.filteredResults).toHaveLength(4);
  });

  it('filters by region substring match on address', () => {
    const filters: FilterState = { ...defaultFilterState, region: '서울' };
    const { result } = renderHook(() => useFilteredChargers(DATA, filters));
    expect(result.current.filteredResults.map((f) => f.properties.charger_id)).toEqual(['C1', 'C4']);
  });

  it('filters by region using slash-OR pattern (e.g., "경기/인천")', () => {
    const filters: FilterState = { ...defaultFilterState, region: '경기/인천' };
    const { result } = renderHook(() => useFilteredChargers(DATA, filters));
    expect(result.current.filteredResults.map((f) => f.properties.charger_id)).toEqual(['C2']);
  });

  it('filters by exact manufacturer', () => {
    const filters: FilterState = { ...defaultFilterState, manufacturer: 'BlueOne' };
    const { result } = renderHook(() => useFilteredChargers(DATA, filters));
    expect(result.current.filteredResults.map((f) => f.properties.charger_id)).toEqual(['C1', 'C3']);
  });

  it('filters by exact volt_type', () => {
    const filters: FilterState = { ...defaultFilterState, voltType: '완속' };
    const { result } = renderHook(() => useFilteredChargers(DATA, filters));
    expect(result.current.filteredResults.map((f) => f.properties.charger_id)).toEqual(['C2', 'C4']);
  });

  it('filters by efficiency with float tolerance (≤ 0.0001)', () => {
    const filters: FilterState = { ...defaultFilterState, efficiencyValue: '90' };
    const { result } = renderHook(() => useFilteredChargers(DATA, filters));
    expect(result.current.filteredResults.map((f) => f.properties.charger_id)).toEqual(['C1']);
  });

  it('AND-combines multiple filter fields', () => {
    const filters: FilterState = {
      ...defaultFilterState,
      region: '서울',
      manufacturer: 'BlueOne',
    };
    const { result } = renderHook(() => useFilteredChargers(DATA, filters));
    expect(result.current.filteredResults.map((f) => f.properties.charger_id)).toEqual(['C1']);
  });

  it('preserves filteredResults reference when sortOrder toggles (memo keyed on filter fields)', () => {
    const { result, rerender } = renderHook(
      ({ filters }: { filters: FilterState }) => useFilteredChargers(DATA, filters),
      { initialProps: { filters: defaultFilterState } },
    );
    const first = result.current.filteredResults;
    rerender({ filters: { ...defaultFilterState, sortOrder: 'desc' } });
    expect(result.current.filteredResults).toBe(first);
  });

  it('produces new filteredResults reference when region changes', () => {
    const { result, rerender } = renderHook(
      ({ filters }: { filters: FilterState }) => useFilteredChargers(DATA, filters),
      { initialProps: { filters: defaultFilterState } },
    );
    const first = result.current.filteredResults;
    rerender({ filters: { ...defaultFilterState, region: '서울' } });
    expect(result.current.filteredResults).not.toBe(first);
  });

  it('computes avg/min/max efficiency from filtered set', () => {
    const filters: FilterState = { ...defaultFilterState, manufacturer: 'BlueOne' };
    const { result } = renderHook(() => useFilteredChargers(DATA, filters));
    expect(result.current.minEfficiency).toBe(90);
    expect(result.current.maxEfficiency).toBe(92);
    expect(result.current.avgEfficiency).toBe(91);
  });

  it('returns NaN avg + Infinity bounds for empty filter result', () => {
    const filters: FilterState = { ...defaultFilterState, region: '강원' };
    const { result } = renderHook(() => useFilteredChargers(DATA, filters));
    expect(result.current.filteredResults).toEqual([]);
    expect(Number.isNaN(result.current.avgEfficiency)).toBe(true);
    expect(result.current.minEfficiency).toBe(Infinity);
    expect(result.current.maxEfficiency).toBe(-Infinity);
  });
});
