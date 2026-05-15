export type SortOrder = 'asc' | 'desc';

export type FilterState = {
  region: string;
  manufacturer: string;
  voltType: string;
  efficiencyValue: string;
  sortOrder: SortOrder;
  filterStep: number;
};

export const defaultFilterState: FilterState = {
  region: '',
  manufacturer: '',
  voltType: '',
  efficiencyValue: '',
  sortOrder: 'asc',
  filterStep: 0,
};

export type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
  maxZoom?: number;
  pitch?: number;
  bearing?: number;
  transitionDuration?: number;
  transitionInterpolator?: unknown;
};

export type ZoomTarget = 'seoul_gyeongin' | 'jeju' | false;
