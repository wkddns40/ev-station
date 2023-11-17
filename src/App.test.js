import React, { useState, useEffect } from 'react';
import MapboxGL from 'mapbox-gl';
import DeckGL from '@deck.gl/react';
import { InteractiveMap } from 'react-map-gl';
import { ColumnLayer } from '@deck.gl/layers';
import { GridLayer } from '@deck.gl/aggregation-layers';
// import { ScatterplotLayer } from '@deck.gl/layers';
import 'react-sliding-pane/dist/react-sliding-pane.css';
import { LinearInterpolator } from '@deck.gl/core';
import './App.css';
import searchTerms from './searchTerms';
import RightPane from './RightPane';
import LeftPane from './LeftPane';
import SearchFilterPane from './SearchFilterPane';
import Tooltip from './ToolTip';
import ButtonGroup from './ButtonGroup';
// import { useReducer } from 'react';


MapboxGL.accessToken = '';

const DATA_URL = '';

const INITIAL_VIEW_STATE = {
  longitude: 127.7,
  latitude: 36.1,
  zoom: 7,
  maxZoom: 16,
  pitch: 57,
  bearing: -15
};

export default function ScatterplotMap() {
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
  const [filteredResults, setFilteredResults] = useState([]);
  const [data, setData] = useState([]);
  // eslint-disable-next-line
  const [radiusData, setRadiusData] = useState(Array.from({ length: data.length }, () => Math.random() * 5 + 2));
  const [isClicked, setIsClicked] = useState(false);
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
  const [mapStyle, setMapStyle] = useState('mapbox://styles/djangbogo/cli8sh8dd010d01po64z6hkyl');
  // eslint-disable-next-line
  const [theme, setTheme] = useState("light");
  const [color, setColor] = useState('#212163');
  // eslint-disable-next-line
  const [chargerNameSearchTerm, setChargerNameSearchTerm] = useState('');
  const [chargingEfficiency, setChargingEfficiency] = useState(0);

  const validData = data.filter(d => {
    return d.geometry.coordinates[0] !== "NULL" &&
    d.geometry.coordinates[1] !== "NULL" &&
    parseFloat(d.geometry.coordinates[0]) !== 0 &&
    parseFloat(d.geometry.coordinates[1]) !== 0
  });


  const layers = [
    // new ColumnLayer({
    //   id: 'column-layer',
    //   data: validData.filter(
    //     (d) => 
    //     (searchTerm === '' || (searchTerm === '경기/인천' ? (d.properties.address.toLowerCase().includes(searchTerm.toLowerCase()) 
    //     || !(d.properties.address.toLowerCase().includes('서울') 
    //     || d.properties.address.toLowerCase().includes('제주'))) : d.properties.address.toLowerCase().includes(searchTerm.toLowerCase())))
    //     && (chargerNameSearchTerm === '' || d.properties.charger_name.toLowerCase().includes(chargerNameSearchTerm.toLowerCase()))  
    //     && (selectedAddress === null || selectedAddress === d.properties.charger_id)
    //   ),
    //   diskResolution: 12,
    //   radius: 50,
    //   extruded: true,
    //   pickable: true,
    //   elevationScale: 12,
    //   getPosition: (d) => d.geometry.coordinates,
    //   getFillColor: (d) => {
    //     if (theme === 'dark') {
    //         if (d.properties.charging_efficiency < 90) {
    //           return [202, 131, 235, 120];
    //         } else if (d.properties.charging_efficiency >= 90 && d.properties.charging_efficiency < 95) {
    //           return [15, 122, 103, 120];
    //         } else {
    //           return [0, 255, 255, 120]; 
    //         }
    //     } else {
    //         if (d.properties.charging_efficiency < 90) {
    //           return [141, 2, 2, 100]; 
    //         } else if (d.properties.charging_efficiency >= 90 && d.properties.charging_efficiency < 95) {
    //           return [8, 2, 199, 100];
    //         } else {
    //           return [141, 2, 2, 100]; 
    //         }
    //     }
    // },

    // getElevation: (d) => Math.min(d.properties.charging_efficiency, chargingEfficiency),
      // onClick: handleClick, 
    //   onHover: ({object, x, y}) => {
    //     if (object) {
    //         setTooltipInfo({
    //             text: (object.properties.charger_name + " : " + object.properties.charging_efficiency + "%"),
    //             x: x,
    //             y: y
    //         });
    //     } else {
    //         setTooltipInfo(null);
    //     }
    //   }
    // }),

  //   new GridLayer({
  //     id: 'grid-layer',
  //     data: validData,
  //     pickable: true,
  //     extruded: true,
  //     cellSize: 300,
  //     getPosition: d => d.geometry.coordinates,
  //     getColor: d => {
  //       if (d.properties.speed < 0) {
  //         return [0, 0, 255, 255];  // Blue color
  //       } else {
  //         return [255, 0, 0, 255];  // Red color
  //       }
  //     },
  //     getElevation: d => {
  //       return Math.abs(d.properties.speed);
  //     }
  //   })
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
    getElevation: d => Math.abs(d.properties.speed) * 14,
  })
  
  
  ];

  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentSecond = new Date().getSeconds();
      setChargingEfficiency((prevEfficiency) => {
        if (prevEfficiency < 100) {
          return prevEfficiency + 1; 
        } else {
          if (currentSecond % 5 === 0) {
            setChargingEfficiency(1);}
          return prevEfficiency;
        }
      });
    }, 10);
  
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      updateTheme();
    }, 60000); 
  
    return () => {
      clearInterval(intervalId);
    };
  }, []);


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
    const efficiencyValueMatch = Number(selectedFilters.efficiencyValue) ? Number(item.charging_efficiency) === Number(selectedFilters.efficiencyValue) : true;
    return regionMatch && manufacturerMatch && voltTypeMatch && efficiencyValueMatch
  }); 
  
  
  const convertToCSV = (selectedPropertiesData) => {
    let csvContent = '\uFEFF';
    // to header (key value) column name
    csvContent += objectToCSVRow(Object.keys(selectedPropertiesData[0])); 
  
    for (let i = 0; i < propertiesData.length; i++) {
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

  const efficiencyArray = filteredResults.map(result => parseFloat(result.properties.charging_efficiency));
  const avgEfficiency = efficiencyArray.reduce((acc, val) => acc + val, 0) / efficiencyArray.length;
  const minEfficiency = Math.min(...efficiencyArray);
  const maxEfficiency = Math.max(...efficiencyArray);


  
  const handleZoomIn = () => {
    setZoomButtonDisabled(false);
    setChargingEfficiency(1);
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
    setChargingEfficiency(1);
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
  // isClicked ?  left2pane(setPaneIsOpen) info link
  // const handleClick = ({ x, y, object }) => {
  //   if (object && object.Longitude !== "NULL" && object.Latitude !== "NULL") {
  //   setIsClicked(true);
  //   setPaneIsOpen(false);
  //   setRightPaneIsOpen(false);
  //   setClickedChargerName(object.properties.charger_name);
  //   setChargingEfficiency(1);
  //   }
  // };
  
  const handleClosePane = () => {
    setIsClicked(false);
    setPaneIsOpen(false);
    setRightPaneIsOpen(false);
    
  };

  const handleHomeClick = () => {
    setPaneIsOpen(false);
    setIsClicked(false);
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
    setSelectedFilters([]);
    setFilterStep(0);
  };

  const handleAddressClick = (charger_id) => {
    if (selectedAddress === charger_id) {
      setSelectedAddress(null);
      setPaneIsOpen(false);
    } else {
      setSelectedAddress(charger_id);
      setPaneIsOpen(true);
      setChargingEfficiency(1);
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
  
  // if soc under => scatter change
 
 

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

  // useEffect  efficiency
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
        console.log(json); 
        setData(json.features);
        setRadiusData(Array.from({ length: json.features.length }, () => Math.random() * 5 + 3));
      })
      .catch(error => console.log(error));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRadiusData(Array.from({ length: data.length }, () => Math.random() * 5 + 5));
      if (!isClicked && !selectedAddress) {
        setRadiusData(Array.from({ length: data.length }, () => Math.random() * 5 + 3));
      }
    }, 100); 
  
    return () => {
      clearInterval(interval);
    };
  }, [isClicked, selectedAddress, data.length]);

  useEffect(() => {
    const selectedData = validData.find(d => d.properties.charger_id === selectedAddress);
    if (selectedData) {
      setClickedChargerId(selectedData.properties.charger_id);
      setClickedChargerName(selectedData.properties.charger_name);
      setClickedMnfacrName(selectedData.properties.mnfacr_name);
      setClickedModelName(selectedData.properties.model_name);
    } 
    
  }, [selectedAddress, validData]); 
  
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('http://v2cloud.iptime.org:5000/charger');
      const data = await response.json();
  
      const uniqueManufacturers = Array.from(new Set(data.features.map(feature => feature.properties.mnfacr_name))).filter(Boolean);
      setManufacturers(uniqueManufacturers);

      const uniqueVoltTypes = Array.from(new Set(data.features.map(feature => feature.properties.volt_type))).filter(Boolean);
      setVoltTypes(uniqueVoltTypes);

      const uniqueEfficiencys = Array.from(new Set(data.features.map(feature => parseFloat(feature.properties.charging_efficiency)))).filter(Boolean);
      setEfficiencyValues(uniqueEfficiencys);

      let filterFunction;
  
      if (searchTerm === '') {
        filterFunction = (feature) => true;
        
      
      } else if (searchTerm === '경기/인천') {
        filterFunction = (feature) => {
          const address = feature.properties.address;
          return !address.includes('서울') && !address.includes('제주') 
            && (manufacturer === '' || feature.properties.mnfacr_name === manufacturer) 
            && (voltType === '' || feature.properties.volt_type === voltType)
            && (efficiencyValue === '' || Math.abs(feature.properties.charging_efficiency - Number(efficiencyValue)) <= 0.0001)

        };
      } else if (['서울', '제주'].includes(searchTerm)) {
        filterFunction = (feature) => {
          const address = feature.properties.address;
          return searchTerms.some((term) => address.includes(term) && searchTerm === term) 
            && (manufacturer === '' || feature.properties.mnfacr_name === manufacturer) 
            && (voltType === '' || feature.properties.volt_type === voltType)
            && (efficiencyValue === '' || Math.abs(feature.properties.charging_efficiency - Number(efficiencyValue)) <= 0.0001)

        };
      } else {
        filterFunction = (feature) => {
          return (feature.properties.address.includes('경기') || feature.properties.address.includes('인천')) 
            && (manufacturer === '' || feature.properties.mnfacr_name === manufacturer) 
            && (voltType === '' || feature.properties.volt_type === voltType)
            && (efficiencyValue === '' || Math.abs(feature.properties.charging_efficiency - Number(efficiencyValue)) <= 0.0001)

        };
      }
      
      const results = data.features.filter(filterFunction);
      setFilteredResults(results);
      
    };
  
    fetchData();
  }, [searchTerm, manufacturer, voltType, efficiencyValue]); 


  return (
    <div className='full'>
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
          // eslint-disable-next-line no-unused-vars
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
        <h1 className="title-main" style={{color: color}}>배터리 충전소 데이터</h1>
        <h1 className="title-sub" style={{color: color}} onClick={toggleMapStyle}>서울, 경기/인천, 제주 테스트</h1>
      </div>
    </DeckGL>
      
    </div>
  );
}
