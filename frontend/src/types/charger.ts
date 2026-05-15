export type ChargerProperties = {
  charger_id: string;
  charger_name: string;
  mnfacr_name: string;
  model_name: string;
  volt_type: string;
  address: string;
  charging_efficiency: number;
  systemtime: string;
  speed: number;
};

export type ChargerFeature = {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: ChargerProperties;
};

export type FeatureCollection = {
  type: 'FeatureCollection';
  features: ChargerFeature[];
};
