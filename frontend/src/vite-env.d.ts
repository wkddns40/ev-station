/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_TOKEN: string;
  readonly VITE_MAPBOX_STYLE_URL: string;
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css';

declare module '@deck.gl/react';
declare module '@deck.gl/layers';
declare module '@deck.gl/core';
