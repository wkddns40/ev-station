import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import { ColumnLayer, IconLayer, PathLayer } from '@deck.gl/layers';
import 'react-sliding-pane/dist/react-sliding-pane.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import './evstation.css';
import searchTerms from './searchTerms';
import Tooltip, { type TooltipInfo } from './ToolTip';
import ButtonGroup from './ButtonGroup';

const RightPane = lazy(() => import('./RightPane'));
const LeftPane = lazy(() => import('./LeftPane'));
const SearchFilterPane = lazy(() => import('./SearchFilterPane'));
import type { ChargerFeature } from './types/charger';
import type { ViewState } from './types/filters';
import { MAP_STYLE_URL } from './constants/viewport';
import { useFilters } from './state/FiltersContext';
import { useChargerData } from './hooks/useChargerData';
import { useMapViewport } from './hooks/useMapViewport';
import { useFilteredChargers } from './hooks/useFilteredChargers';
import { convertToCSV, downloadCSV } from './lib/csv';
import { VITE_DEMO_MODE } from './lib/env';
import { buildPaths, getLatestDataPoint, getValidData } from './lib/geo';

const DEMO_CAR_INTERVAL_MS = 2000;

export default function Evstation() {
  const { state: filters, dispatch } = useFilters();
  const { data, manufacturers, voltTypes, efficiencyValues } = useChargerData();
  const viewport = useMapViewport();
  const [paneIsOpen, setPaneIsOpen] = useState<boolean>(false);
  const [clickedChargerId, setClickedChargerId] = useState<string | null>(null);
  const [clickedChargerName, setClickedChargerName] = useState<string | null>(null);
  const [clickedModelName, setClickedModelName] = useState<string | null>(null);
  const [clickedMnfacrName, setClickedMnfacrName] = useState<string | null>(null);
  const [leftPaneIsOpen, setLeftPaneIsOpen] = useState<boolean>(false);
  const [rightPaneIsOpen, setRightPaneIsOpen] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [tooltipInfo, setTooltipInfo] = useState<TooltipInfo | null>(null);
  const [theme] = useState<string>('');
  const [color] = useState<string>('');
  const [chargerNameSearchTerm, setChargerNameSearchTerm] = useState<string>('');
  const [showAllData, setShowAllData] = useState<boolean>(false);
  const [elevationFactor, setElevationFactor] = useState<number>(0);

  const validData = useMemo<ChargerFeature[]>(() => getValidData(data), [data]);
  const sortedByTime = useMemo<ChargerFeature[]>(
    () => (VITE_DEMO_MODE
      ? [...validData].sort((a, b) => a.properties.systemtime.localeCompare(b.properties.systemtime))
      : []),
    [validData],
  );
  const [demoCarIdx, setDemoCarIdx] = useState<number>(0);
  useEffect(() => {
    if (!VITE_DEMO_MODE || sortedByTime.length === 0) return;
    const id = setInterval(() => {
      setDemoCarIdx((i) => (i + 1) % sortedByTime.length);
    }, DEMO_CAR_INTERVAL_MS);
    return () => clearInterval(id);
  }, [sortedByTime]);
  const lastDataPoint = useMemo<ChargerFeature | null>(() => {
    if (VITE_DEMO_MODE) return sortedByTime[demoCarIdx % Math.max(sortedByTime.length, 1)] ?? null;
    return getLatestDataPoint(validData);
  }, [validData, sortedByTime, demoCarIdx]);
  const paths = useMemo<[number, number][]>(() => buildPaths(validData), [validData]);

  const { filteredResults, selectedPropertiesData, avgEfficiency, minEfficiency, maxEfficiency } =
    useFilteredChargers(data, filters, chargerNameSearchTerm);

  // Auto fly-to when filter/search narrows to a single match.
  // Use stable setMapViewState ref (viewport object identity changes every render).
  const setMapViewStateStable = viewport.setMapViewState;
  useEffect(() => {
    if (filteredResults.length !== 1) return;
    const c = filteredResults[0];
    if (!c) return;
    setMapViewStateStable({
      latitude: c.geometry.coordinates[1],
      longitude: c.geometry.coordinates[0],
      zoom: 14.6,
      pitch: 0,
    });
  }, [filteredResults, setMapViewStateStable]);

  const toggleShowAllData = useCallback(() => setShowAllData((prev) => !prev), []);

  const handleColumnHover = useCallback(
    // FIXME: type-me — deck.gl onHover info typing is complex; treat as any for now
    ({ object, x, y }: { object: ChargerFeature | null; x: number; y: number }) => {
      if (object) {
        setTooltipInfo({
          text: 'curr_speed - avg_speed: ' + object.properties.speed + 'km/h',
          x,
          y,
        });
      } else {
        setTooltipInfo(null);
      }
    },
    [],
  );

  const handleAddressClick = useCallback((chargerId: string): void => {
    if (selectedAddress === chargerId) {
      setSelectedAddress(null);
      setPaneIsOpen(false);
      return;
    }
    setSelectedAddress(chargerId);
    setPaneIsOpen(true);
    const clickedPoint = validData.find((d) => d.properties.charger_id === chargerId);
    if (clickedPoint) {
      viewport.setMapViewState({
        latitude: clickedPoint.geometry.coordinates[1],
        longitude: clickedPoint.geometry.coordinates[0],
        zoom: 14.6,
        pitch: 0,
      });
    }
  }, [selectedAddress, validData, viewport]);

  const columnLayer = useMemo(() => (
    showAllData
      ? new ColumnLayer({
          id: 'column-layer',
          data: validData,
          pickable: true,
          extruded: true,
          radius: 200,
          diskResolution: 12,
          elevationScale: 2,
          getPosition: (d: ChargerFeature) => d.geometry.coordinates,
          getFillColor: (d: ChargerFeature) => (d.properties.speed < 0 ? [0, 0, 255] : [255, 0, 0]),
          getElevation: (d: ChargerFeature) => Math.abs(d.properties.speed) * elevationFactor,
          onClick: toggleShowAllData,
          onHover: handleColumnHover,
        })
      : null
  ), [showAllData, validData, elevationFactor, toggleShowAllData, handleColumnHover]);

  const iconLayer = useMemo(() => (
    lastDataPoint
      ? new IconLayer({
          id: 'icon-layer',
          data: [lastDataPoint],
          pickable: false,
          iconAtlas: '/car.png',
          iconMapping: {
            marker: { x: 10, y: 150, width: 512, height: 512, mask: false },
          },
          getIcon: () => 'marker',
          getSize: () => 55,
          getPosition: (d: ChargerFeature) => [d.geometry.coordinates[0] - 0.019, d.geometry.coordinates[1]],
        })
      : null
  ), [lastDataPoint]);

  const pathLayer = useMemo(() => (
    showAllData
      ? new PathLayer({
          id: 'path-layer',
          data: [{ path: paths }],
          getPath: (d: { path: [number, number][] }) => d.path,
          getColor: [8, 128, 121, 255],
          widthMinPixels: 15,
          rounded: true,
          pickable: true,
        })
      : null
  ), [showAllData, paths]);

  const allChargersLayer = useMemo(() => {
    if (filteredResults.length === 0) return null;
    return new IconLayer({
      id: 'all-chargers-layer',
      data: filteredResults,
      pickable: true,
      iconAtlas: '/charger-icon.png',
      iconMapping: {
        marker: { x: 0, y: 0, width: 200, height: 280, anchorX: 100, anchorY: 262, mask: false },
      },
      getIcon: () => 'marker',
      sizeUnits: 'pixels',
      getSize: () => 32,
      getPosition: (d: ChargerFeature) => d.geometry.coordinates,
      onClick: ({ object }: { object: ChargerFeature | null }) => {
        if (object) handleAddressClick(object.properties.charger_id);
      },
    });
  }, [filteredResults, handleAddressClick]);

  const selectedLayer = useMemo(() => {
    if (!selectedAddress) return null;
    const selectedFeature = validData.find((d) => d.properties.charger_id === selectedAddress);
    if (!selectedFeature) return null;
    return new IconLayer({
      id: 'selected-marker-layer',
      data: [selectedFeature],
      pickable: false,
      iconAtlas: '/charger-icon.png',
      iconMapping: {
        marker: { x: 0, y: 0, width: 200, height: 280, anchorX: 100, anchorY: 262, mask: false },
      },
      getIcon: () => 'marker',
      sizeUnits: 'pixels',
      getSize: () => 56,
      getPosition: (d: ChargerFeature) => d.geometry.coordinates,
    });
  }, [selectedAddress, validData]);

  const layers = useMemo(
    () => [allChargersLayer, columnLayer, iconLayer, pathLayer, selectedLayer],
    [allChargersLayer, columnLayer, iconLayer, pathLayer, selectedLayer],
  );

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    if (showAllData) {
      intervalId = setInterval(() => {
        setElevationFactor((prevFactor) => {
          if (prevFactor < 14) {
            return prevFactor + 0.5;
          }
          if (intervalId) clearInterval(intervalId);
          return prevFactor;
        });
      }, 23);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      setElevationFactor(0);
    };
  }, [showAllData]);

  const sortResults = useCallback((results: ChargerFeature[]): ChargerFeature[] =>
    [...results].sort((a, b) => (filters.sortOrder === 'asc'
      ? a.properties.charging_efficiency - b.properties.charging_efficiency
      : b.properties.charging_efficiency - a.properties.charging_efficiency)), [filters.sortOrder]);

  const handleClosePane = useCallback((): void => {
    setPaneIsOpen(false);
    setRightPaneIsOpen(false);
  }, []);

  const handleSearchSubmit = useCallback((): void => {
    if (filteredResults.length <= 1) return;
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const f of filteredResults) {
      const [lng, lat] = f.geometry.coordinates;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;
    const lngSpan = Math.max(maxLng - minLng, 0.001);
    const latSpan = Math.max(maxLat - minLat, 0.001);
    const cosLat = Math.cos((centerLat * Math.PI) / 180);
    const zLng = Math.log2((1024 * 360 * cosLat) / (256 * lngSpan));
    const zLat = Math.log2((720 * 180) / (256 * latSpan));
    const zoom = Math.max(Math.min(zLng, zLat, 16) - 0.5, 4);
    viewport.setMapViewState({
      latitude: centerLat,
      longitude: centerLng,
      zoom,
      pitch: 0,
    });
  }, [filteredResults, viewport]);

  const handleHomeClick = useCallback((): void => {
    setPaneIsOpen(false);
    setSelectedAddress(null);
    setShowSearch(false);
    setLeftPaneIsOpen(false);
    viewport.handleZoomOut();
    viewport.setZoomButtonDisabled(false);
    viewport.setHasZoomedIn(false);
    setChargerNameSearchTerm('');
    dispatch({ type: 'RESET' });
  }, [viewport, dispatch]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        if (selectedAddress) {
          setSelectedAddress(null);
          setPaneIsOpen(false);
          setLeftPaneIsOpen(false);
        } else if (!leftPaneIsOpen) {
          viewport.handleZoomOut();
        }
      }
    };

    if (selectedAddress || !leftPaneIsOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedAddress, leftPaneIsOpen, viewport]);

  /* eslint-disable react-hooks/set-state-in-effect */
  // Intentional: only update clicked* on a real selection so closing the pane
  // (selectedAddress -> null) keeps previous charger info visible in LeftPane.
  useEffect(() => {
    const selectedData = validData.find((d) => d.properties.charger_id === selectedAddress);
    if (selectedData) {
      setClickedChargerId(selectedData.properties.charger_id);
      setClickedChargerName(selectedData.properties.charger_name);
      setClickedMnfacrName(selectedData.properties.mnfacr_name);
      setClickedModelName(selectedData.properties.model_name);
    }
  }, [selectedAddress, validData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div>
      <DeckGL
        layers={layers}
        viewState={viewport.mapViewState}
        onViewStateChange={({ viewState }: { viewState: ViewState }) => viewport.setMapViewState(viewState)}
        controller={{ doubleClickZoom: false, scrollZoom: true, dragRotate: false, dragPan: true }}
        getCursor={() => 'default'}
      >
        <Map reuseMaps mapStyle={MAP_STYLE_URL}>
          {tooltipInfo && <Tooltip tooltipInfo={tooltipInfo} theme={theme} />}
          <Suspense fallback={null}>
            <RightPane isOpen={rightPaneIsOpen} handleClosePane={handleClosePane} />
            <LeftPane
              isOpen={paneIsOpen}
              handleClosePane={handleClosePane}
              showChart={true}
              clickedChargerName={clickedChargerName}
              clickedChargerId={clickedChargerId}
              clickedMnfacrName={clickedMnfacrName}
              clickedModelName={clickedModelName}
            />
            <SearchFilterPane
              leftPaneIsOpen={leftPaneIsOpen}
              setLeftPaneIsOpen={setLeftPaneIsOpen}
              handleZoomOut={viewport.handleZoomOut}
              setHasZoomedIn={viewport.setHasZoomedIn}
              handleZoomIn={viewport.handleZoomIn}
              searchTerms={searchTerms}
              handleZoomInJeju={viewport.handleZoomInJeju}
              manufacturers={manufacturers}
              voltTypes={voltTypes}
              efficiencyValues={efficiencyValues}
              setRightPaneIsOpen={setRightPaneIsOpen}
              filteredResults={filteredResults}
              sortResults={sortResults}
              handleAddressClick={handleAddressClick}
              selectedAddress={selectedAddress}
              hasZoomedIn={viewport.hasZoomedIn}
              convertToCSV={convertToCSV}
              downloadCSV={downloadCSV}
              selectedPropertiesData={selectedPropertiesData}
              avgEfficiency={avgEfficiency}
              minEfficiency={minEfficiency}
              maxEfficiency={maxEfficiency}
            />
          </Suspense>
        </Map>
        <ButtonGroup
          handleHomeClick={handleHomeClick}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          setLeftPaneIsOpen={setLeftPaneIsOpen}
          chargerNameSearchTerm={chargerNameSearchTerm}
          setChargerNameSearchTerm={setChargerNameSearchTerm}
          onSearchSubmit={handleSearchSubmit}
        />
        <div className="title-container">
          <h1 className="title-main" style={{ color }}>EV Station Dashboard</h1>
        </div>
      </DeckGL>
    </div>
  );
}
