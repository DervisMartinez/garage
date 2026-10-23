// ARCHIVO GENERADO AUTOMÁTICAMENTE. NO EDITAR A MANO.
// Para actualizar este catálogo, ejecuta: node scripts/generateCatalog.js

export type VehicleType = 'moto' | 'car';

export interface CatalogVehicle {
  id: string;
  brand: string;
  model: string;
  vehicleType?: VehicleType;
  category?: string;
  year?: number;
  imageRes: any;
}

export type CatalogMoto = CatalogVehicle;

export const MOTO_CATALOG: CatalogMoto[] = [
  {
    id: "BERA-GBR 200cc".replace(/\s+/g, '-').toLowerCase(),
    brand: "BERA",
    model: "GBR 200cc",
    vehicleType: 'moto',
    imageRes: require('../../assets/images/motos/BERA/GBR 200cc.png'),
  },
  {
    id: "BERA-Kavak 150cc".replace(/\s+/g, '-').toLowerCase(),
    brand: "BERA",
    model: "Kavak 150cc",
    vehicleType: 'moto',
    imageRes: require('../../assets/images/motos/BERA/Kavak 150cc.png'),
  },
  {
    id: "BERA-SBR 150cc".replace(/\s+/g, '-').toLowerCase(),
    brand: "BERA",
    model: "SBR 150cc",
    vehicleType: 'moto',
    imageRes: require('../../assets/images/motos/BERA/SBR 150cc.png'),
  },
  {
    id: "BERA-Super DT 250cc".replace(/\s+/g, '-').toLowerCase(),
    brand: "BERA",
    model: "Super DT 250cc",
    vehicleType: 'moto',
    imageRes: require('../../assets/images/motos/BERA/Super DT 250cc.png'),
  },
  {
    id: "EMPIRE KEEWAY-Horse 150RL".replace(/\s+/g, '-').toLowerCase(),
    brand: "EMPIRE KEEWAY",
    model: "Horse 150RL",
    vehicleType: 'moto',
    imageRes: require('../../assets/images/motos/EMPIRE KEEWAY/Horse 150RL.png'),
  },
  {
    id: "EMPIRE KEEWAY-New Horse 150".replace(/\s+/g, '-').toLowerCase(),
    brand: "EMPIRE KEEWAY",
    model: "New Horse 150",
    vehicleType: 'moto',
    imageRes: require('../../assets/images/motos/EMPIRE KEEWAY/New Horse 150.png'),
  },
  {
    id: "EMPIRE KEEWAY-RK 250".replace(/\s+/g, '-').toLowerCase(),
    brand: "EMPIRE KEEWAY",
    model: "RK 250",
    vehicleType: 'moto',
    imageRes: require('../../assets/images/motos/EMPIRE KEEWAY/RK 250.png'),
  },
  {
    id: "EMPIRE KEEWAY-Xpress 150".replace(/\s+/g, '-').toLowerCase(),
    brand: "EMPIRE KEEWAY",
    model: "Xpress 150",
    vehicleType: 'moto',
    imageRes: require('../../assets/images/motos/EMPIRE KEEWAY/Xpress 150.png'),
  },
  {
    id: "ESCUDA-Alexa 180 cc.".replace(/\s+/g, '-').toLowerCase(),
    brand: "ESCUDA",
    model: "Alexa 180 cc.",
    vehicleType: 'moto',
    imageRes: require('../../assets/images/motos/ESCUDA/Alexa 180 cc..png'),
  },
  {
    id: "ESCUDA-EM 200".replace(/\s+/g, '-').toLowerCase(),
    brand: "ESCUDA",
    model: "EM 200",
    vehicleType: 'moto',
    imageRes: require('../../assets/images/motos/ESCUDA/EM 200.png'),
  },
  {
    id: "FORZA-Forza SF501 - 250cc".replace(/\s+/g, '-').toLowerCase(),
    brand: "FORZA",
    model: "Forza SF501 - 250cc",
    vehicleType: 'moto',
    imageRes: require('../../assets/images/motos/FORZA/Forza SF501 - 250cc.png'),
  },
  {
    id: "KADI-Kadi Lovis 150".replace(/\s+/g, '-').toLowerCase(),
    brand: "KADI",
    model: "Kadi Lovis 150",
    vehicleType: 'moto',
    imageRes: require('../../assets/images/motos/KADI/Kadi Lovis 150.png'),
  },
];

export const CAR_CATALOG: CatalogVehicle[] = [
  {
    id: 'chevrolet-optra-2011',
    brand: 'CHEVROLET',
    model: 'Optra Advance 2011',
    vehicleType: 'car',
    category: 'SEDAN',
    year: 2011,
    imageRes: require('../../assets/images/autos/CHEVROLET/SEDAN/OPTRA 2011.png'),
  },
  {
    id: 'toyota-samurai-fj60-1982',
    brand: 'TOYOTA',
    model: 'Samurai FJ60 1982',
    vehicleType: 'car',
    category: 'SUV / 4X4',
    year: 1982,
    imageRes: require('../../assets/images/autos/TOYOTA/1982/SAMURAI FJ60 1982.png'),
  },
];

export const VEHICLE_CATALOG: CatalogVehicle[] = [
  ...MOTO_CATALOG.map(m => ({ ...m, vehicleType: 'moto' as VehicleType })),
  ...CAR_CATALOG,
];
