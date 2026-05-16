import { describe, expect, it } from 'vitest';
import { filtersReducer } from './filtersReducer';
import { defaultFilterState } from '../types/filters';

describe('filtersReducer', () => {
  it('SET_REGION updates region without touching other fields', () => {
    const next = filtersReducer(defaultFilterState, { type: 'SET_REGION', value: '서울' });
    expect(next.region).toBe('서울');
    expect(next.manufacturer).toBe('');
    expect(next.voltType).toBe('');
    expect(next.efficiencyValue).toBe('');
    expect(next.sortOrder).toBe('asc');
    expect(next.filterStep).toBe(0);
  });

  it('SET_MANUFACTURER updates manufacturer only', () => {
    const next = filtersReducer(defaultFilterState, { type: 'SET_MANUFACTURER', value: 'BlueOne' });
    expect(next.manufacturer).toBe('BlueOne');
    expect(next.region).toBe('');
  });

  it('SET_VOLT_TYPE updates voltType only', () => {
    const next = filtersReducer(defaultFilterState, { type: 'SET_VOLT_TYPE', value: '급속' });
    expect(next.voltType).toBe('급속');
  });

  it('SET_EFFICIENCY_VALUE accepts numeric strings', () => {
    const next = filtersReducer(defaultFilterState, { type: 'SET_EFFICIENCY_VALUE', value: '90.5' });
    expect(next.efficiencyValue).toBe('90.5');
  });

  it('SET_EFFICIENCY_VALUE accepts empty string (clearing the filter)', () => {
    const after = filtersReducer(defaultFilterState, { type: 'SET_EFFICIENCY_VALUE', value: '88' });
    const cleared = filtersReducer(after, { type: 'SET_EFFICIENCY_VALUE', value: '' });
    expect(cleared.efficiencyValue).toBe('');
  });

  it('SET_FILTER_STEP advances filterStep', () => {
    const next = filtersReducer(defaultFilterState, { type: 'SET_FILTER_STEP', value: 3 });
    expect(next.filterStep).toBe(3);
  });

  it('TOGGLE_SORT_ORDER flips asc → desc → asc', () => {
    const first = filtersReducer(defaultFilterState, { type: 'TOGGLE_SORT_ORDER' });
    expect(first.sortOrder).toBe('desc');
    const second = filtersReducer(first, { type: 'TOGGLE_SORT_ORDER' });
    expect(second.sortOrder).toBe('asc');
  });

  it('RESET returns the canonical defaultFilterState reference', () => {
    const dirty = filtersReducer(defaultFilterState, { type: 'SET_REGION', value: '제주' });
    const reset = filtersReducer(dirty, { type: 'RESET' });
    expect(reset).toBe(defaultFilterState);
  });

  it('RESET applied to default state still equals default', () => {
    const reset = filtersReducer(defaultFilterState, { type: 'RESET' });
    expect(reset).toEqual(defaultFilterState);
  });

  it('returns a new state object reference for every SET_* action (referential change)', () => {
    const next = filtersReducer(defaultFilterState, { type: 'SET_REGION', value: '서울' });
    expect(next).not.toBe(defaultFilterState);
  });
});
