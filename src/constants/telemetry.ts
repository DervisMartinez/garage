import { ComponentType } from '../domain/entities/Moto';
export { ComponentType };

export const COMPONENT_LIFESPAN_KM: Record<Exclude<ComponentType, 'fuel' | 'other'>, number> = {
  oil: 5000,
  tires_front: 15000,
  tires_rear: 12000,
  brakes_front: 15000,
  brakes_rear: 15000,
  chain: 25000,
  air_filter: 15000,
  fuel_filter: 30000,
  spark_plugs: 20000,
};

export const COMPONENT_NAMES: Record<ComponentType, string> = {
  oil: 'Aceite de Motor',
  tires_front: 'Caucho Delantero',
  tires_rear: 'Caucho Trasero',
  brakes_front: 'Frenos Delanteros',
  brakes_rear: 'Frenos Traseros',
  chain: 'Cadena de Transmisión',
  air_filter: 'Filtro de Aire',
  fuel_filter: 'Filtro de Gasolina',
  spark_plugs: 'Bujías',
  fuel: 'Combustible',
  other: 'Otro Mantenimiento'
};

export const calculateWearPercentage = (
  currentOdo: number, 
  lastChangeOdo: number, 
  component: Exclude<ComponentType, 'fuel' | 'other'>,
  lifespanOverride?: number
): number => {
  const maxLife = lifespanOverride || COMPONENT_LIFESPAN_KM[component];
  const distanceTraveled = currentOdo - lastChangeOdo;
  
  if (distanceTraveled < 0) return 100; // Anomaly (odo rolled back?)
  if (distanceTraveled >= maxLife) return 0; // Completely worn
  
  const percentLeft = ((maxLife - distanceTraveled) / maxLife) * 100;
  return Math.round(percentLeft);
};

