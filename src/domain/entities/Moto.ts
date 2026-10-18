export type VehicleType = 'moto' | 'car';

export type ComponentType = 
  | 'oil' 
  | 'oil_filter'
  | 'tires_front' 
  | 'tires_rear' 
  | 'brakes_front' 
  | 'brakes_rear' 
  | 'chain' 
  | 'timing_belt'
  | 'cabin_filter'
  | 'coolant'
  | 'brake_fluid'
  | 'transmission_fluid'
  | 'battery'
  | 'shock_absorbers'
  | 'accessory_belt'
  | 'wiper_blades'
  | 'clutch'
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
  vehicleType?: VehicleType;
  
  // Real-time tracking
  currentOdometer: number;
  purchaseDate?: string;
  isFromAgency?: boolean;
}

export const isCar = (vehicle?: { brand?: string; model?: string; vehicleType?: string } | null): boolean => {
  if (!vehicle) return false;
  if (vehicle.vehicleType === 'car') return true;
  if (vehicle.vehicleType === 'moto') return false;

  const brand = (vehicle.brand || '').trim().toLowerCase();
  const model = (vehicle.model || '').trim().toLowerCase();

  if (brand.includes('chevrolet') || model.includes('optra')) return true;
  if (
    brand.includes('toyota') || 
    brand.includes('ford') || 
    brand.includes('renault') || 
    brand.includes('volkswagen') || 
    brand.includes('hyundai') || 
    brand.includes('nissan') ||
    brand.includes('fiat') ||
    brand.includes('peugeot') ||
    brand.includes('kia')
  ) {
    return true;
  }

  return false;
};

