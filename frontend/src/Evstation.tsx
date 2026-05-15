import { useState, useEffect, useMemo } from 'react';
import MapboxGL from 'mapbox-gl';
import DeckGL from '@deck.gl/react';
import { InteractiveMap } from 'react-map-gl';
import { ColumnLayer, IconLayer, PathLayer } from '@deck.gl/layers';
import 'react-sliding-pane/dist/react-sliding-pane.css';
import { LinearInterpolator } from '@deck.gl/core';
import './evstation.css';
import searchTerms from './searchTerms';
import RightPane from './RightPane';
import LeftPane from './LeftPane';
import SearchFilterPane from './SearchFilterPane';
import Tooltip, { type TooltipInfo } from './ToolTip';
import ButtonGroup from './ButtonGroup';
import type { ChargerFeature, ChargerProperties } from './types/charger';
import type { FilterState, SortOrder, ViewState, ZoomTarget } from './types/filters';
import { emptyFilterState } from './types/filters';

MapboxGL.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const DATA_URL = `${import.meta.env.VITE_API_BASE_URL || ''}/charger`;

const INITIAL_VIEW_STATE: ViewState = {
  longitude: 127.7,
  latitude: 36.1,
  zoom: 7,
  maxZoom: 16,
  pitch: 57,
  bearing: -15,
};

export default function Evstation() {
  const [paneIsOpen, setPaneIsOpen] = useState<boolean>(false);
  const [clickedChargerId, setClickedChargerId] = useState<string | null>(null);
  const [clickedChargerName, setClickedChargerName] = useState<string | null>(null);
  const [clickedModelName, setClickedModelName] = useState<string | null>(null);
  const [clickedMnfacrName, setClickedMnfacrName] = useState<string | null>(null);
  const [leftPaneIsOpen, setLeftPaneIsOpen] = useState<boolean>(false);
  const [rightPaneIsOpen, setRightPaneIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [manufacturer, setManufacturer] = useState<string>('');
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [data, setData] = useState<ChargerFeature[]>([]);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [mapViewState, setMapViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [zoomButtonDisabled, setZoomButtonDisabled] = useState<boolean>(false);
  const [voltType, setVoltType] = useState<string>('');
  const [voltTypes, setVoltTypes] = useState<string[]>([]);
  const [efficiencyValue, setEfficiencyValue] = useState<string>('');
  const [efficiencyValues, setEfficiencyValues] = useState<number[]>([]);
  const [filterStep, setFilterStep] = useState<number>(0);
  const [selectedFilters, setSelectedFilters] = useState<FilterState>(emptyFilterState);
  const [hasZoomedIn, setHasZoomedIn] = useState<ZoomTarget>(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [tooltipInfo, setTooltipInfo] = useState<TooltipInfo | null>(null);
  const [mapStyle] = useState<string>(import.meta.env.VITE_MAPBOX_STYLE_URL || '');
  const [theme] = useState<string>('');
  const [color] = useState<string>('');
  const [chargerNameSearchTerm, setChargerNameSearchTerm] = useState<string>('');
  const [showAllData, setShowAllData] = useState<boolean>(false);
  const [elevationFactor, setElevationFactor] = useState<number>(0);

  const validData = useMemo<ChargerFeature[]>(() => data.filter((d) => {
    const [lng, lat] = d.geometry.coordinates;
    return (
      (lng as unknown) !== 'NULL' &&
      (lat as unknown) !== 'NULL' &&
      Number(lng) !== 0 &&
      Number(lat) !== 0
    );
  }), [data]);

  const lastDataPoint: ChargerFeature | null = validData.length > 0
    ? validData.reduce((prev, curr) => (prev.properties.systemtime > curr.properties.systemtime ? prev : curr))
    : null;

  const paths = useMemo<[number, number][]>(() => validData.reduce<[number, number][]>((acc, curr) => {
    const last = acc[acc.length - 1];
    const [lng, lat] = curr.geometry.coordinates;
    if (!last || last[0] !== lng || last[1] !== lat) {
      acc.push([lng, lat]);
    }
    return acc;
  }, []), [validData]);

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

  const objectToCSVRow = (dataObject: Record<string, unknown>): string => {
    const dataArray: string[] = [];
    for (const o in dataObject) {
      const raw = dataObject[o];
      const innerValue = raw === null || raw === undefined ? '' : '"' + String(raw) + '"';
      dataArray.push(innerValue);
    }
    return dataArray.join(',') + '\r\n';
  };

  const propertiesData = data.map((d) => d.properties);
  const selectedPropertiesData = propertiesData.filter((item) => {
    const regionMatch = selectedFilters.region
      ? selectedFilters.region.includes('/')
        ? selectedFilters.region.split('/').some((r) => item.address.includes(r))
        : item.address.includes(selectedFilters.region)
      : true;
    const manufacturerMatch = selectedFilters.manufacturer ? item.mnfacr_name === selectedFilters.manufacturer : true;
    const voltTypeMatch = selectedFilters.voltType ? item.volt_type === selectedFilters.voltType : true;
    const efficiencyValueMatch = selectedFilters.efficiencyValue !== ''
      ? Number(item.charging_efficiency) === Number(selectedFilters.efficiencyValue)
      : true;
    return regionMatch && manufacturerMatch && voltTypeMatch && efficiencyValueMatch;
  });

  const convertToCSV = (rows: ChargerProperties[]): string => {
    let csvContent = '﻿';
    const first = rows[0];
    if (!first) return csvContent;
    csvContent += objectToCSVRow(Object.fromEntries(Object.keys(first).map((k) => [k, k])));
    for (const row of rows) {
      csvContent += objectToCSVRow(row as unknown as Record<string, unknown>);
    }
    return csvContent;
  };

  const downloadCSV = (csvContent: string, fileName: string): void => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    const clickEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: false });
    link.dispatchEvent(clickEvent);

    URL.revokeObjectURL(url);
  };

  const toggleSortOrder = (): void => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const sortResults = (results: ChargerFeature[]): ChargerFeature[] =>
    [...results].sort((a, b) => (sortOrder === 'asc'
      ? a.properties.charging_efficiency - b.properties.charging_efficiency
      : b.properties.charging_efficiency - a.properties.charging_efficiency));

  const handleZoomIn = (): void => {
    setZoomButtonDisabled(false);
    const interpolator = new LinearInterpolator({ transitionProps: ['longitude', 'latitude', 'zoom'] });
    setMapViewState((prev) => ({
      ...prev,
      longitude: 127.0053101,
      latitude: 37.4199248,
      zoom: 10.3,
      transitionDuration: 800,
      transitionInterpolator: interpolator,
    }));
  };

  const handleZoomInJeju = (): void => {
    setZoomButtonDisabled(true);
    const interpolator = new LinearInterpolator({ transitionProps: ['longitude', 'latitude', 'zoom'] });
    setMapViewState((prev) => ({
      ...prev,
      longitude: 126.5253101,
      latitude: 33.3999248,
      zoom: 10.2,
      transitionDuration: 800,
      transitionInterpolator: interpolator,
    }));
  };

  const handleZoomOut = (): void => {
    const interpolator = new LinearInterpolator({ transitionProps: ['longitude', 'latitude', 'zoom'] });
    setMapViewState({
      ...INITIAL_VIEW_STATE,
      transitionDuration: 800,
      transitionInterpolator: interpolator,
    });
  };

  const handleClosePane = (): void => {
    setPaneIsOpen(false);
    setRightPaneIsOpen(false);
  };

  const handleHomeClick = (): void => {
    setPaneIsOpen(false);
    setSelectedAddress(null);
    setSearchTerm('');
    setShowSearch(false);
    setLeftPaneIsOpen(false);
    handleZoomOut();
    setZoomButtonDisabled(false);
    setChargerNameSearchTerm('');
    setHasZoomedIn(false);
    setManufacturer('');
    setVoltType('');
    setSelectedFilters(emptyFilterState);
    setFilterStep(0);
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
        setMapViewState({
          latitude: clickedPoint.geometry.coordinates[1],
          longitude: clickedPoint.geometry.coordinates[0],
          zoom: 10.3,
          pitch: 60,
        });
      }
    }
  };

  useEffect(() => {
    if (manufacturer !== '' && !Object.values(selectedFilters).includes(manufacturer)) {
      setSelectedFilters((prevFilters) => ({ ...prevFilters, manufacturer }));
    }
  }, [manufacturer, selectedFilters]);

  useEffect(() => {
    if (voltType !== '' && !Object.values(selectedFilters).includes(voltType)) {
      setSelectedFilters((prevFilters) => ({ ...prevFilters, voltType }));
    }
  }, [voltType, selectedFilters]);

  useEffect(() => {
    if (efficiencyValue !== '' && !Object.values(selectedFilters).includes(efficiencyValue)) {
      setSelectedFilters((prevFilters) => ({ ...prevFilters, efficiencyValue }));
    }
  }, [efficiencyValue, selectedFilters]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        if (selectedAddress) {
          setSelectedAddress(null);
          setPaneIsOpen(false);
          setLeftPaneIsOpen(false);
        } else if (!leftPaneIsOpen) {
          handleZoomOut();
        }
      }
    };

    if (selectedAddress || !leftPaneIsOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedAddress, leftPaneIsOpen]);

  useEffect(() => {
    fetch(DATA_URL)
      .then((response) => response.json() as Promise<{ features: ChargerFeature[] }>)
      .then((json) => {
        const features = json.features;
        setData(features);
        setManufacturers(Array.from(new Set(features.map((f) => f.properties.mnfacr_name))).filter((v): v is string => Boolean(v)));
        setVoltTypes(Array.from(new Set(features.map((f) => f.properties.volt_type))).filter((v): v is string => Boolean(v)));
        setEfficiencyValues(
          Array.from(new Set(features.map((f) => Number(f.properties.charging_efficiency)))).filter((v) => !Number.isNaN(v)),
        );
      })
      .catch((error: unknown) => console.log(error));
  }, []);

  useEffect(() => {
    const selectedData = validData.find((d) => d.properties.charger_id === selectedAddress);
    if (selectedData) {
      setClickedChargerId(selectedData.properties.charger_id);
      setClickedChargerName(selectedData.properties.charger_name);
      setClickedMnfacrName(selectedData.properties.mnfacr_name);
      setClickedModelName(selectedData.properties.model_name);
    }
  }, [selectedAddress, validData]);

  const filteredResults = useMemo<ChargerFeature[]>(() => {
    const regionMatch = (feature: ChargerFeature): boolean => {
      if (searchTerm === '') return true;
      const address = feature.properties.address;
      if (!address) return false;
      return searchTerm.includes('/')
        ? searchTerm.split('/').some((r) => address.includes(r))
        : address.includes(searchTerm);
    };
    const manufacturerMatch = (feature: ChargerFeature): boolean =>
      manufacturer === '' || feature.properties.mnfacr_name === manufacturer;
    const voltTypeMatch = (feature: ChargerFeature): boolean =>
      voltType === '' || feature.properties.volt_type === voltType;
    const efficiencyMatch = (feature: ChargerFeature): boolean =>
      efficiencyValue === '' || Math.abs(feature.properties.charging_efficiency - Number(efficiencyValue)) <= 0.0001;
    return data.filter((f) => regionMatch(f) && manufacturerMatch(f) && voltTypeMatch(f) && efficiencyMatch(f));
  }, [data, searchTerm, manufacturer, voltType, efficiencyValue]);

  const efficiencyArray = filteredResults.map((result) => Number(result.properties.charging_efficiency));
  const avgEfficiency = efficiencyArray.reduce((acc, val) => acc + val, 0) / efficiencyArray.length;
  const minEfficiency = Math.min(...efficiencyArray);
  const maxEfficiency = Math.max(...efficiencyArray);

  return (
    <div>
      <DeckGL
        layers={layers}
        viewState={mapViewState}
        onViewStateChange={({ viewState }: { viewState: ViewState }) => setMapViewState(viewState)}
        controller={{ doubleClickZoom: false, scrollZoom: true, dragRotate: true, dragPan: true }}
        getCursor={() => 'default'}
      >
        <InteractiveMap reuseMaps mapStyle={mapStyle} preventStyleDiffing={true} mapboxApiAccessToken={MapboxGL.accessToken}>
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
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            setSelectedFilters={setSelectedFilters}
            handleZoomOut={handleZoomOut}
            setHasZoomedIn={setHasZoomedIn}
            handleZoomIn={handleZoomIn}
            setFilterStep={setFilterStep}
            searchTerms={searchTerms}
            handleZoomInJeju={handleZoomInJeju}
            filterStep={filterStep}
            manufacturer={manufacturer}
            setManufacturer={setManufacturer}
            manufacturers={manufacturers}
            voltType={voltType}
            setVoltType={setVoltType}
            voltTypes={voltTypes}
            efficiencyValue={efficiencyValue}
            efficiencyValues={efficiencyValues}
            setEfficiencyValue={setEfficiencyValue}
            selectedFilters={selectedFilters}
            setRightPaneIsOpen={setRightPaneIsOpen}
            filteredResults={filteredResults}
            toggleSortOrder={toggleSortOrder}
            sortResults={sortResults}
            handleAddressClick={handleAddressClick}
            selectedAddress={selectedAddress}
            hasZoomedIn={hasZoomedIn}
            convertToCSV={convertToCSV}
            downloadCSV={downloadCSV}
            selectedPropertiesData={selectedPropertiesData}
            avgEfficiency={avgEfficiency}
            minEfficiency={minEfficiency}
            maxEfficiency={maxEfficiency}
          />
        </InteractiveMap>
        <ButtonGroup
          handleZoomIn={handleZoomIn}
          zoomButtonDisabled={zoomButtonDisabled}
          handleZoomInJeju={handleZoomInJeju}
          handleHomeClick={handleHomeClick}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          setSearchTerm={setSearchTerm}
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
