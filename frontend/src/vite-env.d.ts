/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css';

declare module '@deck.gl/react';
declare module '@deck.gl/layers';
declare module '@deck.gl/core';
