import { ComponentType } from '../domain/entities/Moto';
export { ComponentType };

export const COMPONENT_LIFESPAN_KM: Record<Exclude<ComponentType, 'fuel' | 'other'>, number> = {
  oil: 5000,
  oil_filter: 5000,
  tires_front: 15000,
  tires_rear: 12000,
  brakes_front: 15000,
  brakes_rear: 15000,
  chain: 25000,
  timing_belt: 50000,
  cabin_filter: 15000,
  coolant: 40000,
  brake_fluid: 40000,
  transmission_fluid: 50000,
  battery: 40000,
  shock_absorbers: 60000,
  accessory_belt: 40000,
  wiper_blades: 20000,
  clutch: 80000,
  air_filter: 15000,
  fuel_filter: 30000,
  spark_plugs: 20000,
};

// Lifespan for cars specifically (based on recambiosdeconfianza and automotive standard)
export const CAR_COMPONENT_LIFESPAN_KM: Record<string, number> = {
  oil: 7500,
  oil_filter: 7500,
  air_filter: 20000,
  cabin_filter: 15000,
  fuel_filter: 35000,
  spark_plugs: 30000,
  timing_belt: 45000, // Optra 1.8 DOHC is critical 40k-50k km
  coolant: 40000,
  brake_fluid: 40000,
  brakes_front: 30000,
  brakes_rear: 50000,
  battery: 40000,
  shock_absorbers: 60000,
  tires_front: 40000,
  tires_rear: 40000,
  transmission_fluid: 50000,
  accessory_belt: 40000,
  wiper_blades: 20000,
  clutch: 80000,
};

export const COMPONENT_NAMES: Record<ComponentType, string> = {
  oil: 'Aceite de Motor',
  oil_filter: 'Filtro de Aceite',
  tires_front: 'Caucho Delantero',
  tires_rear: 'Caucho Trasero',
  brakes_front: 'Frenos Delanteros',
  brakes_rear: 'Frenos Traseros',
  chain: 'Cadena de Transmisión',
  timing_belt: 'Correa de Distribución (Tiempo)',
  cabin_filter: 'Filtro de Habitáculo / A/C',
  coolant: 'Refrigerante / Anticongelante',
  brake_fluid: 'Líquido de Frenos',
  transmission_fluid: 'Aceite de Transmisión',
  battery: 'Batería',
  shock_absorbers: 'Amortiguadores / Suspensión',
  accessory_belt: 'Correa de Accesorios',
  wiper_blades: 'Limpiaparabrisas (Plumillas)',
  clutch: 'Embrague / Clutch',
  air_filter: 'Filtro de Aire',
  fuel_filter: 'Filtro de Gasolina',
  spark_plugs: 'Bujías',
  fuel: 'Combustible',
  other: 'Otro Mantenimiento'
};

export const getComponentLifespan = (component: ComponentType, isCarVehicle = false): number => {
  if (isCarVehicle && component in CAR_COMPONENT_LIFESPAN_KM) {
    return CAR_COMPONENT_LIFESPAN_KM[component];
  }
  return COMPONENT_LIFESPAN_KM[component as Exclude<ComponentType, 'fuel' | 'other'>] || 15000;
};

export const getVehicleComponents = (isCarVehicle = false): ComponentType[] => {
  if (isCarVehicle) {
    return [
      'fuel',
      'oil',
      'oil_filter',
      'timing_belt',
      'coolant',
      'brake_fluid',
      'cabin_filter',
      'air_filter',
      'fuel_filter',
      'spark_plugs',
      'brakes_front',
      'brakes_rear',
      'tires_front',
      'tires_rear',
      'battery',
      'shock_absorbers',
      'transmission_fluid',
      'accessory_belt',
      'wiper_blades',
      'clutch',
      'other',
    ];
  }
  return [
    'fuel',
    'oil',
    'tires_front',
    'tires_rear',
    'brakes_front',
    'brakes_rear',
    'chain',
    'air_filter',
    'fuel_filter',
    'spark_plugs',
    'battery',
    'other',
  ];
};

export const calculateWearPercentage = (
  currentOdo: number, 
  lastChangeOdo: number, 
  component: Exclude<ComponentType, 'fuel' | 'other'>,
  lifespanOverride?: number,
  isCarVehicle = false
): number => {
  const maxLife = lifespanOverride || getComponentLifespan(component, isCarVehicle);
  const distanceTraveled = currentOdo - lastChangeOdo;
  
  if (distanceTraveled < 0) return 100; // Anomaly (odo rolled back?)
  if (distanceTraveled >= maxLife) return 0; // Completely worn
  
  const percentLeft = ((maxLife - distanceTraveled) / maxLife) * 100;
  return Math.round(percentLeft);
};


