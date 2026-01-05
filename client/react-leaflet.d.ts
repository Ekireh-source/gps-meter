// Type declaration for react-leaflet module
// This allows TypeScript to recognize react-leaflet before package installation

import type { ComponentType, ReactNode, CSSProperties } from 'react';

export interface MapContainerProps {
  center: [number, number];
  zoom: number;
  style?: CSSProperties;
  scrollWheelZoom?: boolean;
  className?: string;
  children?: ReactNode;
}

export interface TileLayerProps {
  attribution?: string;
  url: string;
}

export interface MarkerProps {
  position: [number, number];
  icon?: any;
  children?: ReactNode;
}

export interface PopupProps {
  children?: ReactNode;
}

export interface CircleProps {
  center: [number, number];
  radius: number;
  pathOptions?: {
    color?: string;
    fillColor?: string;
    fillOpacity?: number;
    weight?: number;
  };
}

declare module 'react-leaflet' {
  export const MapContainer: ComponentType<MapContainerProps>;
  export const TileLayer: ComponentType<TileLayerProps>;
  export const Marker: ComponentType<MarkerProps>;
  export const Popup: ComponentType<PopupProps>;
  export const Circle: ComponentType<CircleProps>;
}

