import { createContext, useContext, useReducer } from 'react';
import type { Dispatch, ReactNode } from 'react';
import type { FilterState } from '../types/filters';
import { defaultFilterState } from '../types/filters';
import { filtersReducer, type FilterAction } from './filtersReducer';

type FiltersContextValue = {
  state: FilterState;
  dispatch: Dispatch<FilterAction>;
};

const FiltersContext = createContext<FiltersContextValue | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(filtersReducer, defaultFilterState);
  return <FiltersContext.Provider value={{ state, dispatch }}>{children}</FiltersContext.Provider>;
}

export function useFilters(): FiltersContextValue {
  const ctx = useContext(FiltersContext);
  if (ctx === null) {
    throw new Error('useFilters must be used inside a <FiltersProvider>');
  }
  return ctx;
}
