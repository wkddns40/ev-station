import { useState, useEffect, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import { ColumnLayer, IconLayer, PathLayer } from '@deck.gl/layers';
import 'react-sliding-pane/dist/react-sliding-pane.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import './evstation.css';
import searchTerms from './searchTerms';
import RightPane from './RightPane';
import LeftPane from './LeftPane';
import SearchFilterPane from './SearchFilterPane';
import Tooltip, { type TooltipInfo } from './ToolTip';
import ButtonGroup from './ButtonGroup';
import type { ChargerFeature } from './types/charger';
import type { ViewState } from './types/filters';
import { MAP_STYLE_URL } from './constants/viewport';
import { useFilters } from './state/FiltersContext';
import { useChargerData } from './hooks/useChargerData';
import { useMapViewport } from './hooks/useMapViewport';
import { useFilteredChargers } from './hooks/useFilteredChargers';
import { convertToCSV, downloadCSV } from './lib/csv';
import { buildPaths, getLatestDataPoint, getValidData } from './lib/geo';

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
  const lastDataPoint: ChargerFeature | null = getLatestDataPoint(validData);
  const paths = useMemo<[number, number][]>(() => buildPaths(validData), [validData]);

  const { filteredResults, selectedPropertiesData, avgEfficiency, minEfficiency, maxEfficiency } =
    useFilteredChargers(data, filters);

  const layers = [
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
          onClick: () => setShowAllData(!showAllData),
          // FIXME: type-me — deck.gl onHover info typing is complex; treat as any for now
          onHover: ({ object, x, y }: { object: ChargerFeature | null; x: number; y: number }) => {
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
        })
      : null,

    lastDataPoint
      ? new IconLayer({
          id: 'icon-layer',
          data: [lastDataPoint],
          pickable: true,
          iconAtlas: '/car.png',
          iconMapping: {
            marker: { x: 10, y: 150, width: 512, height: 512, mask: false },
          },
          getIcon: () => 'marker',
          getSize: () => 55,
          getPosition: (d: ChargerFeature) => [d.geometry.coordinates[0] - 0.019, d.geometry.coordinates[1]],
          onClick: () => setShowAllData(!showAllData),
        })
      : null,

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
      : null,
  ];

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

  const sortResults = (results: ChargerFeature[]): ChargerFeature[] =>
    [...results].sort((a, b) => (filters.sortOrder === 'asc'
      ? a.properties.charging_efficiency - b.properties.charging_efficiency
      : b.properties.charging_efficiency - a.properties.charging_efficiency));

  const handleClosePane = (): void => {
    setPaneIsOpen(false);
    setRightPaneIsOpen(false);
  };

  const handleHomeClick = (): void => {
    setPaneIsOpen(false);
    setSelectedAddress(null);
    setShowSearch(false);
    setLeftPaneIsOpen(false);
    viewport.handleZoomOut();
    viewport.setZoomButtonDisabled(false);
    viewport.setHasZoomedIn(false);
    setChargerNameSearchTerm('');
    dispatch({ type: 'RESET' });
  };

  const handleAddressClick = (chargerId: string): void => {
    if (selectedAddress === chargerId) {
      setSelectedAddress(null);
      setPaneIsOpen(false);
    } else {
      setSelectedAddress(chargerId);
      setPaneIsOpen(true);
      const clickedPoint = validData.find((d) => d.properties.charger_id === chargerId);
      if (clickedPoint) {
        viewport.setMapViewState({
          latitude: clickedPoint.geometry.coordinates[1],
          longitude: clickedPoint.geometry.coordinates[0],
          zoom: 10.3,
          pitch: 60,
        });
      }
    }
  };

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

  useEffect(() => {
    const selectedData = validData.find((d) => d.properties.charger_id === selectedAddress);
    if (selectedData) {
      setClickedChargerId(selectedData.properties.charger_id);
      setClickedChargerName(selectedData.properties.charger_name);
      setClickedMnfacrName(selectedData.properties.mnfacr_name);
      setClickedModelName(selectedData.properties.model_name);
    }
  }, [selectedAddress, validData]);

  return (
    <div>
      <DeckGL
        layers={layers}
        viewState={viewport.mapViewState}
        onViewStateChange={({ viewState }: { viewState: ViewState }) => viewport.setMapViewState(viewState)}
        controller={{ doubleClickZoom: false, scrollZoom: true, dragRotate: true, dragPan: true }}
        getCursor={() => 'default'}
      >
        <Map reuseMaps mapStyle={MAP_STYLE_URL}>
          {tooltipInfo && <Tooltip tooltipInfo={tooltipInfo} theme={theme} />}
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
        </Map>
        <ButtonGroup
          handleZoomIn={viewport.handleZoomIn}
          zoomButtonDisabled={viewport.zoomButtonDisabled}
          handleZoomInJeju={viewport.handleZoomInJeju}
          handleHomeClick={handleHomeClick}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          setLeftPaneIsOpen={setLeftPaneIsOpen}
          chargerNameSearchTerm={chargerNameSearchTerm}
          setChargerNameSearchTerm={setChargerNameSearchTerm}
        />
        <div className="title-container">
          <h1 className="title-main" style={{ color }}>EV Station Dashboard</h1>
        </div>
      </DeckGL>
    </div>
  );
}
