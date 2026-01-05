// Type declaration for leaflet module
// This allows TypeScript to recognize leaflet before package installation
declare module 'leaflet' {
  export interface IconOptions {
    iconUrl?: string;
    iconRetinaUrl?: string;
    shadowUrl?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
  }

  export class Icon {
    static Default: {
      prototype: Icon;
      new (options?: IconOptions): Icon;
      mergeOptions(options: IconOptions): void;
    };
    constructor(options?: IconOptions);
  }

  export class DivIcon extends Icon {
    constructor(options?: IconOptions & { html?: string; className?: string });
  }

  const L: {
    Icon: typeof Icon;
    divIcon: (options?: IconOptions & { html?: string; className?: string }) => DivIcon;
  };

  export default L;
}

