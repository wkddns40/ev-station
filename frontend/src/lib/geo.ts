import type { ChargerFeature } from '../types/charger';

export function getValidData(features: ChargerFeature[]): ChargerFeature[] {
  return features.filter((d) => {
    const [lng, lat] = d.geometry.coordinates;
    return (
      (lng as unknown) !== 'NULL' &&
      (lat as unknown) !== 'NULL' &&
      Number(lng) !== 0 &&
      Number(lat) !== 0
    );
  });
}

export function getLatestDataPoint(features: ChargerFeature[]): ChargerFeature | null {
  if (features.length === 0) return null;
  return features.reduce((prev, curr) => (prev.properties.systemtime > curr.properties.systemtime ? prev : curr));
}

export function buildPaths(features: ChargerFeature[]): [number, number][] {
  return features.reduce<[number, number][]>((acc, curr) => {
    const last = acc[acc.length - 1];
    const [lng, lat] = curr.geometry.coordinates;
    if (!last || last[0] !== lng || last[1] !== lat) {
      acc.push([lng, lat]);
    }
    return acc;
  }, []);
}
