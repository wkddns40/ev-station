import React, { useState, useEffect, useMemo } from 'react';
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
import Tooltip from './ToolTip';
import ButtonGroup from './ButtonGroup';

MapboxGL.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || '';

const DATA_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/charger`;

const INITIAL_VIEW_STATE = {
  longitude: 127.7,
  latitude: 36.1,
  zoom: 7,
  maxZoom: 16,
  pitch: 57,
  bearing: -15
};

export default function Map() {
  const [paneIsOpen, setPaneIsOpen] = useState(false);
  const [clickedChargerId, setClickedChargerId] = useState(null);
  const [clickedChargerName, setClickedChargerName] = useState(null);
  const [clickedModelName, setClickedModelName] = useState(null);
  const [clickedMnfacrName, setClickedMnfacrName] = useState(null);
  const [leftPaneIsOpen, setLeftPaneIsOpen] = useState(false);
  const [rightPaneIsOpen, setRightPaneIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [manufacturer, setManufacturer] = useState("");
  const [manufacturers, setManufacturers] = useState([]);
  const [data, setData] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [mapViewState, setMapViewState] = useState(INITIAL_VIEW_STATE);
  const [zoomButtonDisabled, setZoomButtonDisabled] = useState(false);
  const [voltType, setVoltType] = useState('');
  const [voltTypes, setVoltTypes] = useState([]);
  const [efficiencyValue, setEfficiencyValue] = useState('');
  const [efficiencyValues, setEfficiencyValues] = useState([]);
  const [filterStep, setFilterStep] = useState(0);
  const [selectedFilters, setSelectedFilters] = useState({region:'', manufacturer:'', voltType:'', efficiencyValue:''});
  const [hasZoomedIn, setHasZoomedIn] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc');
  const [tooltipInfo, setTooltipInfo] = useState(null);
  const [mapStyle] = useState(process.env.REACT_APP_MAPBOX_STYLE_URL || '');
  const [theme] = useState('');
  const [color] = useState('');
  const [chargerNameSearchTerm, setChargerNameSearchTerm] = useState('');
  const [showAllData, setShowAllData] = useState(false);
  const [elevationFactor, setElevationFactor] = useState(0);

  const validData = useMemo(() => data.filter(d => (
    d.geometry.coordinates[0] !== "NULL" &&
    d.geometry.coordinates[1] !== "NULL" &&
    parseFloat(d.geometry.coordinates[0]) !== 0 &&
    parseFloat(d.geometry.coordinates[1]) !== 0
  )), [data]);

  let lastDataPoint;
  if (validData.length > 0) {
    lastDataPoint = validData.reduce((prev, curr) => 
      prev.properties.systemtime > curr.properties.systemtime ? prev : curr
    );
  } else {
    lastDataPoint = null;
  }
  
  const paths = validData.reduce((acc, curr) => {
    if (acc.length === 0 || acc[acc.length - 1][0] !== curr.geometry.coordinates[0] || acc[acc.length - 1][1] !== curr.geometry.coordinates[1]) {
      acc.push(curr.geometry.coordinates);
    }
    return acc;
  }, []);

  const layers = [
    showAllData ?
    new ColumnLayer({
      id: 'column-layer',
      data: validData,
      pickable: true,
      extruded: true,
      radius: 200,
      diskResolution: 12,
      elevationScale: 2,
      getPosition: d => d.geometry.coordinates,
      getFillColor: d => {
        return d.properties.speed < 0 ? [0, 0, 255] : [255, 0, 0];
      },
      getElevation: d => Math.abs(d.properties.speed) * elevationFactor,
      onClick: () => setShowAllData(!showAllData),
      onHover: ({object, x, y}) => {
        if (object) {
            setTooltipInfo({
                text: ("curr_speed - avg_speed: " + object.properties.speed + "km/h"),
                x: x,
                y: y
            });
        } else {
            setTooltipInfo(null);
        }
      }
    }) : null,

    new IconLayer({
      id: 'icon-layer',
      data: [lastDataPoint],
      pickable: true,
      iconAtlas: `${process.env.PUBLIC_URL}/car.png`,
      iconMapping: {
        marker: {x: 10, y: 150, width: 512, height: 512, mask: false}
      },
      getIcon: d => 'marker',
      getSize: d => 55,
      getPosition: d => [d.geometry.coordinates[0] - 0.019, d.geometry.coordinates[1]],
      onClick: () => setShowAllData(!showAllData), 
    }),

    showAllData ?
    new PathLayer({
      id: 'path-layer',
      data: [{path: paths}],
      getPath: d => d.path,
      getColor: [8, 128, 121, 255],
      widthMinPixels: 15,
      rounded: true,
      pickable: true,
    }) : null
  ];

  useEffect(() => {
    let intervalId;

    if (showAllData) {
      intervalId = setInterval(() => {
        setElevationFactor(prevFactor => {
          if (prevFactor < 14) {
            return prevFactor + 0.5;
          } else {
            clearInterval(intervalId);
            return prevFactor;
          }
        });
      }, 23);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      setElevationFactor(0);
    }
  }, [showAllData]);

  const objectToCSVRow = (dataObject) => {
    let dataArray = [];
    for (let o in dataObject) {
      let innerValue = dataObject[o] === null ? '' : '"' + dataObject[o].toString() + '"';
      dataArray.push(innerValue);
    }
    return dataArray.join(',') + '\r\n';
  }

  const propertiesData = data.map(d => d.properties);
  const selectedPropertiesData = propertiesData.filter(item => {
    const regionMatch = selectedFilters.region 
    ? (selectedFilters.region.includes('/') 
        ? selectedFilters.region.split('/').some(r => item.address.includes(r)) 
        : item.address.includes(selectedFilters.region)
      ) 
    : true;
    const manufacturerMatch = selectedFilters.manufacturer ? item.mnfacr_name === selectedFilters.manufacturer : true;
    const voltTypeMatch = selectedFilters.voltType ? item.volt_type === selectedFilters.voltType : true;
    const efficiencyValueMatch = selectedFilters.efficiencyValue !== '' ? Number(item.charging_efficiency) === Number(selectedFilters.efficiencyValue) : true;
    return regionMatch && manufacturerMatch && voltTypeMatch && efficiencyValueMatch
  }); 
  
  const convertToCSV = (selectedPropertiesData) => {
    let csvContent = '\uFEFF';
    csvContent += objectToCSVRow(Object.keys(selectedPropertiesData[0]));
  
    for (let i = 0; i < selectedPropertiesData.length; i++) {
      csvContent += objectToCSVRow(selectedPropertiesData[i]);
    }
    return csvContent;
  }
  
  const downloadCSV = (csvContent, fileName) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
  
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: false
    });
    link.dispatchEvent(clickEvent);
  
    URL.revokeObjectURL(url);
  }

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const sortResults = (results) => {
    return results.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.properties.charging_efficiency - b.properties.charging_efficiency;
      } else {
        return b.properties.charging_efficiency - a.properties.charging_efficiency;
      }
    });
  };

  const handleZoomIn = () => {
    setZoomButtonDisabled(false);
    const interpolator = new LinearInterpolator({
      transitionProps: ['longitude', 'latitude', 'zoom'],
    });
    setMapViewState((mapViewState) => ({
      ...mapViewState,
      longitude: 127.0053101,
      latitude: 37.4199248,
      zoom: 10.3,
      transitionDuration: 800,  
      transitionInterpolator: interpolator,
    }));
  };

  const handleZoomInJeju = () => {
    setZoomButtonDisabled(true);
    const interpolator = new LinearInterpolator({
      transitionProps: ['longitude', 'latitude', 'zoom'],
    });
    setMapViewState((viewState) => ({
      ...viewState,
      longitude: 126.5253101,
      latitude: 33.3999248,
      zoom: 10.2,
      transitionDuration: 800,  
      transitionInterpolator: interpolator,
    }));
  };

  const handleZoomOut = () => {
    const interpolator = new LinearInterpolator({
      transitionProps: ['longitude', 'latitude', 'zoom'],
    });
  
    setMapViewState({
      ...INITIAL_VIEW_STATE,
      transitionDuration:800,
      transitionInterpolator: interpolator,
    });
  };

  const handleClosePane = () => {
    setPaneIsOpen(false);
    setRightPaneIsOpen(false);
  };

  const handleHomeClick = () => {
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
    setSelectedFilters({region: '', manufacturer: '', voltType: '', efficiencyValue: ''});
    setFilterStep(0);
  };


  const handleAddressClick = (charger_id) => {
    if (selectedAddress === charger_id) {
      setSelectedAddress(null);
      setPaneIsOpen(false);
    } else {
      setSelectedAddress(charger_id);
      setPaneIsOpen(true);
      const clickedPoint = validData.find((d) => d.properties.charger_id === charger_id);
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
    if (manufacturer !== "" && !Object.values(selectedFilters).includes(manufacturer)) {
      setSelectedFilters(prevFilters => ({ ...prevFilters, manufacturer: manufacturer }));
    }
  }, [manufacturer, selectedFilters]);

  useEffect(() => {
    if (voltType !== "" && !Object.values(selectedFilters).includes(voltType)) {
      setSelectedFilters(prevFilters => ({ ...prevFilters, voltType: voltType }));
    }
  }, [voltType, selectedFilters]);

  useEffect(() => {
    if (efficiencyValue !== "" && !Object.values(selectedFilters).includes(efficiencyValue)) {
      setSelectedFilters(prevFilters => ({ ...prevFilters, efficiencyValue: efficiencyValue }));
    }
  }, [efficiencyValue, selectedFilters])

  useEffect(() => {
  const handleKeyDown = (event) => {
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
    .then(response => response.json())
    .then(json => {
      const features = json.features;
      setData(features);
      setManufacturers(Array.from(new Set(features.map(f => f.properties.mnfacr_name))).filter(Boolean));
      setVoltTypes(Array.from(new Set(features.map(f => f.properties.volt_type))).filter(Boolean));
      setEfficiencyValues(Array.from(new Set(features.map(f => parseFloat(f.properties.charging_efficiency)))).filter(v => !Number.isNaN(v)));
    })
    .catch(error => console.log(error));
}, []);

useEffect(() => {
  const selectedData = validData.find(d => d.properties.charger_id === selectedAddress);
  if (selectedData) {
    setClickedChargerId(selectedData.properties.charger_id);
    setClickedChargerName(selectedData.properties.charger_name);
    setClickedMnfacrName(selectedData.properties.mnfacr_name);
    setClickedModelName(selectedData.properties.model_name);
  }
}, [selectedAddress, validData]);

const filteredResults = useMemo(() => {
  const regionMatch = (feature) => {
    if (searchTerm === "") return true;
    const address = feature.properties.address;
    if (!address) return false;
    return searchTerm.includes('/')
      ? searchTerm.split('/').some(r => address.includes(r))
      : address.includes(searchTerm);
  };
  const manufacturerMatch = (feature) =>
    manufacturer === '' || feature.properties.mnfacr_name === manufacturer;
  const voltTypeMatch = (feature) =>
    voltType === '' || feature.properties.volt_type === voltType;
  const efficiencyMatch = (feature) =>
    efficiencyValue === '' || Math.abs(feature.properties.charging_efficiency - Number(efficiencyValue)) <= 0.0001;
  return data.filter(f => regionMatch(f) && manufacturerMatch(f) && voltTypeMatch(f) && efficiencyMatch(f));
}, [data, searchTerm, manufacturer, voltType, efficiencyValue]);

const efficiencyArray = filteredResults.map(result => parseFloat(result.properties.charging_efficiency));
const avgEfficiency = efficiencyArray.reduce((acc, val) => acc + val, 0) / efficiencyArray.length;
const minEfficiency = Math.min(...efficiencyArray);
const maxEfficiency = Math.max(...efficiencyArray);


  return (
    <div>
      <DeckGL
        layers={layers}
        viewState={mapViewState}
        onViewStateChange={({ viewState }) => setMapViewState(viewState)}
        controller={{ doubleClickZoom: false, scrollZoom: true, dragRotate: true, dragPan: true }}
        getCursor={({ isHovering }) => 'default'}
      >
  <InteractiveMap reuseMap mapStyle={mapStyle}  preventStyleDiffing={true} mapboxApiAccessToken={MapboxGL.accessToken} >
  {tooltipInfo && <Tooltip tooltipInfo={tooltipInfo} theme={theme} />}
        <RightPane isOpen={rightPaneIsOpen} handleClosePane={handleClosePane} />
        <LeftPane isOpen={paneIsOpen} handleClosePane={handleClosePane} showChart={true} 
        clickedChargerName={clickedChargerName} clickedChargerId={clickedChargerId} 
        clickedMnfacrName={clickedMnfacrName} clickedModelName={clickedModelName} />
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
          setEfficiencyValues={setEfficiencyValues}
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
          propertiesData={propertiesData}
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
    searchTerm={searchTerm}
    setLeftPaneIsOpen={setLeftPaneIsOpen}
    chargerNameSearchTerm={chargerNameSearchTerm}
    setChargerNameSearchTerm={setChargerNameSearchTerm}    
    />
      <div className="title-container">
        <h1 className="title-main" style={{color: color}}>EV Station Dashboard</h1>
      </div>
    </DeckGL>
     </div>
  );
}
