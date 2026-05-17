import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { LinearInterpolator } from '@deck.gl/core';
import type { ViewState, ZoomTarget } from '../types/filters';
import { INITIAL_VIEW_STATE } from '../constants/viewport';

const ZOOM_TRANSITION_PROPS = ['longitude', 'latitude', 'zoom'] as const;
const ZOOM_TRANSITION_DURATION = 800;

const SEOUL_VIEW = { longitude: 127.0053101, latitude: 37.4199248, zoom: 14.6 };
const JEJU_VIEW = { longitude: 126.5253101, latitude: 33.3999248, zoom: 14.46 };

export type UseMapViewportResult = {
  mapViewState: ViewState;
  setMapViewState: Dispatch<SetStateAction<ViewState>>;
  zoomButtonDisabled: boolean;
  setZoomButtonDisabled: Dispatch<SetStateAction<boolean>>;
  hasZoomedIn: ZoomTarget;
  setHasZoomedIn: Dispatch<SetStateAction<ZoomTarget>>;
  handleZoomIn: () => void;
  handleZoomInJeju: () => void;
  handleZoomOut: () => void;
};

export function useMapViewport(): UseMapViewportResult {
  const [mapViewState, setMapViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [zoomButtonDisabled, setZoomButtonDisabled] = useState<boolean>(false);
  const [hasZoomedIn, setHasZoomedIn] = useState<ZoomTarget>(false);

  const handleZoomIn = useCallback((): void => {
    setZoomButtonDisabled(false);
    const interpolator = new LinearInterpolator({ transitionProps: [...ZOOM_TRANSITION_PROPS] });
    setMapViewState((prev) => ({
      ...prev,
      ...SEOUL_VIEW,
      transitionDuration: ZOOM_TRANSITION_DURATION,
      transitionInterpolator: interpolator,
    }));
  }, []);

  const handleZoomInJeju = useCallback((): void => {
    setZoomButtonDisabled(true);
    const interpolator = new LinearInterpolator({ transitionProps: [...ZOOM_TRANSITION_PROPS] });
    setMapViewState((prev) => ({
      ...prev,
      ...JEJU_VIEW,
      transitionDuration: ZOOM_TRANSITION_DURATION,
      transitionInterpolator: interpolator,
    }));
  }, []);

  const handleZoomOut = useCallback((): void => {
    const interpolator = new LinearInterpolator({ transitionProps: [...ZOOM_TRANSITION_PROPS] });
    setMapViewState({
      ...INITIAL_VIEW_STATE,
      transitionDuration: ZOOM_TRANSITION_DURATION,
      transitionInterpolator: interpolator,
    });
  }, []);

  return {
    mapViewState,
    setMapViewState,
    zoomButtonDisabled,
    setZoomButtonDisabled,
    hasZoomedIn,
    setHasZoomedIn,
    handleZoomIn,
    handleZoomInJeju,
    handleZoomOut,
  };
}
