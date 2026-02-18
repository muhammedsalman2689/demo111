export type PropertyType = 'Apartment' | 'Independent House' | 'Villa';

export type RoomType = 'Living Room' | 'Bedroom' | 'Bathroom' | 'Kitchen' | 'Custom';

export type ElementType = 'Window' | 'Door' | 'Bathtub' | 'Wall' | 'Floor' | 'Custom';

export interface Project {
  id: string;
  name: string;
  customerName: string;
  address: string;
  propertyType: PropertyType;
  notes?: string;
  createdAt: string;
  synced: boolean;
}

export interface Room {
  id: string;
  projectId: string;
  name: string;
  roomType: RoomType;
  createdAt: string;
}

export interface Element {
  id: string;
  roomId: string;
  name: string;
  elementType: ElementType;
  videoUrl?: string;
  images: string[];
  notes?: string;
  createdAt: string;
}

export interface MeasurementPoint {
  id: string;
  x: number;
  y: number;
  imageIndex: number;
}

export interface Measurement {
  id: string;
  elementId: string;
  points: MeasurementPoint[];
  length?: number;
  unit: 'cm' | 'inch' | 'm';
  createdAt: string;
}

export interface Frame {
  id: string;
  url: string;
  timestamp: number;
  measurements: Measurement[];
}
