import type { ViewState } from '../types/filters';

export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export const INITIAL_VIEW_STATE: ViewState = {
  longitude: 127.7,
  latitude: 36.1,
  zoom: 7,
  maxZoom: 16,
  pitch: 57,
  bearing: -15,
};
