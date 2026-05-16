import type { Dispatch, SetStateAction } from 'react';
import SlidingPane from 'react-sliding-pane';
import type { ChargerFeature, ChargerProperties } from './types/charger';
import type { ZoomTarget } from './types/filters';
import { useFilters } from './state/FiltersContext';

type SearchFilterPaneProps = {
  leftPaneIsOpen: boolean;
  setLeftPaneIsOpen: Dispatch<SetStateAction<boolean>>;
  handleZoomOut: () => void;
  setHasZoomedIn: Dispatch<SetStateAction<ZoomTarget>>;
  handleZoomIn: () => void;
  searchTerms: readonly string[];
  handleZoomInJeju: () => void;
  manufacturers: string[];
  voltTypes: string[];
  setRightPaneIsOpen: Dispatch<SetStateAction<boolean>>;
  filteredResults: ChargerFeature[];
  sortResults: (results: ChargerFeature[]) => ChargerFeature[];
  handleAddressClick: (chargerId: string) => void;
  selectedAddress: string | null;
  hasZoomedIn: ZoomTarget;
  selectedPropertiesData: ChargerProperties[];
  convertToCSV: (rows: ChargerProperties[]) => string;
  downloadCSV: (content: string, fileName: string) => void;
  efficiencyValues: number[];
  avgEfficiency: number;
  minEfficiency: number;
  maxEfficiency: number;
};

const SearchFilterPane = (props: SearchFilterPaneProps) => {
  const {
    leftPaneIsOpen, setLeftPaneIsOpen,
    handleZoomOut, setHasZoomedIn, handleZoomIn,
    searchTerms, handleZoomInJeju,
    manufacturers, voltTypes,
    setRightPaneIsOpen,
    filteredResults, sortResults, handleAddressClick,
    selectedAddress, hasZoomedIn, selectedPropertiesData,
    convertToCSV, downloadCSV, efficiencyValues,
    avgEfficiency, minEfficiency, maxEfficiency,
  } = props;
  const { state: filters, dispatch } = useFilters();

  return (
    <SlidingPane
      isOpen={leftPaneIsOpen}
      from="left"
      width="360px"
      onRequestClose={() => setLeftPaneIsOpen(false)}
      className="black-background hide-pane-header"
    >
      <div className="pane-container hide-scrollbar">
        <div className="filter-container">
          <label htmlFor="search-select" className="filter-label">Search Filter 검색필터</label>
          <p></p>
          <select
            id="search-select"
            className="custom-select custom-option"
            value={filters.region}
            onChange={(e) => {
              const selectedRegion = e.target.value;
              if (selectedRegion === '전체') {
                handleZoomOut();
                setHasZoomedIn(false);
                dispatch({ type: 'RESET' });
              } else {
                dispatch({ type: 'SET_REGION', value: selectedRegion });
                if (selectedRegion === '서울' || selectedRegion === '경기/인천') {
                  if (hasZoomedIn !== 'seoul_gyeongin') {
                    handleZoomIn();
                    setHasZoomedIn('seoul_gyeongin');
                  }
                } else if (selectedRegion === '제주') {
                  if (hasZoomedIn !== 'jeju') {
                    handleZoomInJeju();
                    setHasZoomedIn('jeju');
                  }
                }
                dispatch({ type: 'SET_FILTER_STEP', value: 3 });
              }
            }}
          >
            <option value="전체">전체</option>
            {searchTerms.map((term) => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
          <button
            className="add-filter"
            onClick={() => {
              if (filters.filterStep >= 3) {
                dispatch({ type: 'RESET' });
                handleZoomOut();
                setHasZoomedIn(false);
              } else {
                dispatch({ type: 'SET_FILTER_STEP', value: filters.filterStep + 3 });
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="add-icon"
            >
              <polygon points="22 3 2 3 7 12.46 7 19 14 21 14 12.46 22 3" />
            </svg>
            <span className="span-add-filter">+add</span>
          </button>
          {filters.filterStep >= 1 && (
            <select
              id="manufacturer-select"
              className="custom-select custom-option"
              value={filters.manufacturer}
              onChange={(e) => dispatch({ type: 'SET_MANUFACTURER', value: e.target.value })}
              disabled={filters.region === ''}
            >
              <option value="">제조사</option>
              {manufacturers.map((mnfacr_name) => (
                <option key={mnfacr_name} value={mnfacr_name}>{mnfacr_name}</option>
              ))}
            </select>
          )}
          {filters.filterStep >= 2 && (
            <select
              id="volt-type-select"
              className="custom-select custom-option"
              value={filters.voltType}
              onChange={(e) => dispatch({ type: 'SET_VOLT_TYPE', value: e.target.value })}
              disabled={filters.region === ''}
            >
              <option value="">계량기 종류</option>
              {voltTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          )}
          {filters.filterStep >= 3 && (
            <select
              id="efficiency-select"
              className="custom-select custom-option"
              value={filters.efficiencyValue}
              onChange={(e) => dispatch({ type: 'SET_EFFICIENCY_VALUE', value: e.target.value })}
              disabled={filters.region === ''}
            >
              <option value="">충전기 효율</option>
              {efficiencyValues.map((charging_efficiency) => (
                <option key={charging_efficiency} value={charging_efficiency}>90% 미만</option>
              ))}
            </select>
          )}

          <div className="selected-filters selected-filters-box">
            {[filters.region, filters.manufacturer, filters.voltType, filters.efficiencyValue]
              .filter((v) => v !== '')
              .map((filter, index) => (
                <span key={index}>{filter}/</span>
              ))}
          </div>
          <button className="open-rg" onClick={() => setRightPaneIsOpen((current) => !current)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
              <line x1="12" y1="20" x2="12" y2="7" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
          </button>
        </div>
        <div className="result-container">
          <div className="result-info">
            {filteredResults.length} 건 검색됨
            <button className="sort" onClick={() => dispatch({ type: 'TOGGLE_SORT_ORDER' })}>
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="20" viewBox="0 0 25 25" stroke="currentColor" className="sort-icon">
                <line x1="7.5" y1="20" x2="7.5" y2="5" strokeWidth="1" />
                <polyline points="5,7.5 7.5,5 7,7.5" strokeWidth="1" fill="none" />
                <line x1="15" y1="5" x2="15" y2="20" strokeWidth="1" />
                <polyline points="12.5,17.5 15,20 17.5,17.5" strokeWidth="1" fill="none" />
              </svg>
            </button>
          </div>

          <div className="result-content">
            {sortResults(filteredResults).map((result, index) => {
              const eff = result.properties.charging_efficiency;
              const colorClass = eff >= 95 ? '' : eff >= 90 ? 'under95' : 'under90';

              return (
                <div
                  key={index}
                  onClick={() => handleAddressClick(result.properties.charger_id)}
                  className={`address-item ${selectedAddress === result.properties.charger_id ? 'selected-address' : ''} ${colorClass}`}
                >
                  <span className="result-line">
                    {result.properties.charger_name + ' [' + result.properties.charger_id + ']'}
                  </span>
                  <span className="result-efficiency">
                    {result.properties.charging_efficiency + '%'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="statistics">statistics
            <div className="AvgMinMax" style={{ marginTop: '8px', fontSize: '13.8px' }}>
              {filteredResults.length > 0 && (
                <>
                  Avg <span style={{ marginRight: '7px' }}>{avgEfficiency.toFixed(1)}%</span>
                  <span style={{ marginLeft: '7px', marginRight: '7px' }}>|</span>
                  Min <span style={{ marginRight: '7px', marginLeft: '7px' }}>{minEfficiency.toFixed(1)}%</span>
                  <span style={{ marginLeft: '7px', marginRight: '7px' }}>|</span>
                  Max <span style={{ marginLeft: '7px' }}>{maxEfficiency.toFixed(1)}%</span>%
                </>
              )}
            </div>
          </div>
          <button className="downloadCsv" onClick={() => downloadCSV(convertToCSV(selectedPropertiesData), 'statistics.csv')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 7 12 15 17 7" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
      </div>
    </SlidingPane>
  );
};

export default SearchFilterPane;
