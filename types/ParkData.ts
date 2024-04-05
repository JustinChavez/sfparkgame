// src/types/parkData.ts

export interface ParkFeature {
    id: any;
    type: string;
    properties: {
      park_name: any;
      map_park_n: string;
      image: string;
      // ...other property types
    };
    geometry: any; // Replace 'any' with a more specific type if you know the structure
    
  }
  
  export interface ParkData {
    features: ParkFeature[];
  }