export type ComponentType = 
  | 'oil' 
  | 'tires_front' 
  | 'tires_rear' 
  | 'brakes_front' 
  | 'brakes_rear' 
  | 'chain' 
  | 'air_filter' 
  | 'fuel_filter' 
  | 'spark_plugs'
  | 'fuel'
  | 'other';

export interface ServiceRecord {
  id: string;
  type: ComponentType;
  date: string;
  odometer: number;
  costUSD: number;
  notes?: string;
  isAgency?: boolean;
}

export interface Moto {
  id: string;
  brand: string;
  model: string;
  year: number;
  imageUrl?: string;
  catalogImageRes?: any;
  plate?: string;
  
  // Real-time tracking
  currentOdometer: number;
  purchaseDate?: string;
  isFromAgency?: boolean;
}
