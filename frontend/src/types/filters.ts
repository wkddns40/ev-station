export type FilterState = {
  region: string;
  manufacturer: string;
  voltType: string;
  efficiencyValue: string;
};

export const emptyFilterState: FilterState = {
  region: '',
  manufacturer: '',
  voltType: '',
  efficiencyValue: '',
};

export type SortOrder = 'asc' | 'desc';

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
