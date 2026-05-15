import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ChargerFeature } from '../types/charger';

const DATA_URL = `${import.meta.env.VITE_API_BASE_URL || ''}/charger`;

type ChargerCollection = { features: ChargerFeature[] };

async function fetchChargers(): Promise<ChargerCollection> {
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`Charger fetch failed: ${String(response.status)}`);
  }
  return response.json() as Promise<ChargerCollection>;
}

export type UseChargerDataResult = {
  data: ChargerFeature[];
  manufacturers: string[];
  voltTypes: string[];
  efficiencyValues: number[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
};

export function useChargerData(): UseChargerDataResult {
  const query = useQuery({ queryKey: ['chargers'], queryFn: fetchChargers });
  const features = useMemo<ChargerFeature[]>(() => query.data?.features ?? [], [query.data]);

  const manufacturers = useMemo<string[]>(
    () => Array.from(new Set(features.map((f) => f.properties.mnfacr_name))).filter((v): v is string => Boolean(v)),
    [features],
  );
  const voltTypes = useMemo<string[]>(
    () => Array.from(new Set(features.map((f) => f.properties.volt_type))).filter((v): v is string => Boolean(v)),
    [features],
  );
  const efficiencyValues = useMemo<number[]>(
    () => Array.from(new Set(features.map((f) => Number(f.properties.charging_efficiency)))).filter((v) => !Number.isNaN(v)),
    [features],
  );

  return {
    data: features,
    manufacturers,
    voltTypes,
    efficiencyValues,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
