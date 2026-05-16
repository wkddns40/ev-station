import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FiltersProvider, useFilters } from './FiltersContext';

function wrapper({ children }: { children: ReactNode }) {
  return <FiltersProvider>{children}</FiltersProvider>;
}

describe('FiltersContext', () => {
  it('provides default state when wrapped with FiltersProvider', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });
    expect(result.current.state.region).toBe('');
    expect(result.current.state.manufacturer).toBe('');
    expect(result.current.state.voltType).toBe('');
    expect(result.current.state.efficiencyValue).toBe('');
    expect(result.current.state.sortOrder).toBe('asc');
    expect(result.current.state.filterStep).toBe(0);
  });

  it('updates state via dispatch SET_REGION', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });
    act(() => {
      result.current.dispatch({ type: 'SET_REGION', value: '서울' });
    });
    expect(result.current.state.region).toBe('서울');
  });

  it('throws a clear error when used outside FiltersProvider', () => {
    const consoleError = console.error;
    console.error = () => {};
    try {
      expect(() => renderHook(() => useFilters())).toThrow(/useFilters must be used inside a <FiltersProvider>/);
    } finally {
      console.error = consoleError;
    }
  });
});
