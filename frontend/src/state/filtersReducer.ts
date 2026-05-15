import type { FilterState } from '../types/filters';
import { defaultFilterState } from '../types/filters';

export type FilterAction =
  | { type: 'SET_REGION'; value: string }
  | { type: 'SET_MANUFACTURER'; value: string }
  | { type: 'SET_VOLT_TYPE'; value: string }
  | { type: 'SET_EFFICIENCY_VALUE'; value: string }
  | { type: 'SET_FILTER_STEP'; value: number }
  | { type: 'TOGGLE_SORT_ORDER' }
  | { type: 'RESET' };

export function filtersReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_REGION':
      return { ...state, region: action.value };
    case 'SET_MANUFACTURER':
      return { ...state, manufacturer: action.value };
    case 'SET_VOLT_TYPE':
      return { ...state, voltType: action.value };
    case 'SET_EFFICIENCY_VALUE':
      return { ...state, efficiencyValue: action.value };
    case 'SET_FILTER_STEP':
      return { ...state, filterStep: action.value };
    case 'TOGGLE_SORT_ORDER':
      return { ...state, sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' };
    case 'RESET':
      return defaultFilterState;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
