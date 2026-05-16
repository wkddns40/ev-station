import { useMemo } from 'react';
import type { ChargerFeature, ChargerProperties } from '../types/charger';
import type { FilterState } from '../types/filters';

export type UseFilteredChargersResult = {
  filteredResults: ChargerFeature[];
  selectedPropertiesData: ChargerProperties[];
  avgEfficiency: number;
  minEfficiency: number;
  maxEfficiency: number;
};

function matchesRegion(address: string | undefined, region: string): boolean {
  if (region === '') return true;
  if (!address) return false;
  if (region.includes('/')) {
    return region.split('/').some((r) => address.includes(r));
  }
  return address.includes(region);
}

export function useFilteredChargers(data: ChargerFeature[], filters: FilterState): UseFilteredChargersResult {
  // Deps keyed on individual filter fields (not the whole `filters` object) so
  // sortOrder / filterStep changes don't invalidate the filter memo.
  const filteredResults = useMemo<ChargerFeature[]>(() => {
    const { region, manufacturer, voltType, efficiencyValue } = filters;
    return data.filter((feature) => {
      const regionMatch = matchesRegion(feature.properties.address, region);
      const manufacturerMatch = manufacturer === '' || feature.properties.mnfacr_name === manufacturer;
      const voltTypeMatch = voltType === '' || feature.properties.volt_type === voltType;
      const efficiencyMatch = efficiencyValue === ''
        || Math.abs(feature.properties.charging_efficiency - Number(efficiencyValue)) <= 0.0001;
      return regionMatch && manufacturerMatch && voltTypeMatch && efficiencyMatch;
    });
  }, [data, filters.region, filters.manufacturer, filters.voltType, filters.efficiencyValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedPropertiesData = useMemo<ChargerProperties[]>(() => {
    const { region, manufacturer, voltType, efficiencyValue } = filters;
    return data.map((d) => d.properties).filter((item) => {
      const regionMatch = matchesRegion(item.address, region);
      const manufacturerMatch = manufacturer === '' || item.mnfacr_name === manufacturer;
      const voltTypeMatch = voltType === '' || item.volt_type === voltType;
      const efficiencyValueMatch = efficiencyValue === ''
        || Number(item.charging_efficiency) === Number(efficiencyValue);
      return regionMatch && manufacturerMatch && voltTypeMatch && efficiencyValueMatch;
    });
  }, [data, filters.region, filters.manufacturer, filters.voltType, filters.efficiencyValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const { avgEfficiency, minEfficiency, maxEfficiency } = useMemo(() => {
    const values = filteredResults.map((r) => Number(r.properties.charging_efficiency));
    if (values.length === 0) {
      return { avgEfficiency: NaN, minEfficiency: Infinity, maxEfficiency: -Infinity };
    }
    const sum = values.reduce((acc, v) => acc + v, 0);
    return {
      avgEfficiency: sum / values.length,
      minEfficiency: Math.min(...values),
      maxEfficiency: Math.max(...values),
    };
  }, [filteredResults]);

  return { filteredResults, selectedPropertiesData, avgEfficiency, minEfficiency, maxEfficiency };
}
