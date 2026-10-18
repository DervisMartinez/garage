export interface MotoSpecs {
  engineType?: string;
  displacement?: string;
  hp?: string;
  torque?: string;
  transmission?: string;
  weight?: string;
  fuelCapacity?: string;
  oilCapacity?: string;
  oilTypeRecommended?: string;
  coolantCapacity?: string;
  frontTireSize?: string;
  frontTirePressure?: string;
  rearTireSize?: string;
  rearTirePressure?: string;
  chainType?: string;
  timingBeltType?: string;
  sparkPlug?: string;
  battery?: string;
  brakesFront?: string;
  brakesRear?: string;
  cooling?: string;
  maintenanceIntervalOil?: string;
  maintenanceIntervalTimingBelt?: string;
  suspensionFront?: string;
  suspensionRear?: string;
  dimensions?: string;
  trunkCapacity?: string;
  equipment?: string;
}

export type VehicleSpecs = MotoSpecs;


export const MOTO_SPECS_DB: Record<string, MotoSpecs> = {
  'empire keeway-new horse 150': {
    engineType: 'Monocilíndrico 4T, OHV con árbol de levas inferior',
    displacement: '149 cc',
    hp: '11.5 HP @ 8500 RPM',
    torque: '10.0 Nm @ 7500 RPM',
    transmission: '5 Velocidades multidisco húmedo',
    weight: '120 kg',
    fuelCapacity: '12 Litros (Reserva: 2.0L)',
    oilCapacity: '1.0 Litro',
    oilTypeRecommended: '20W-50 4T JASO MA2',
    frontTireSize: '2.75 - 18',
    frontTirePressure: '28 PSI',
    rearTireSize: '90/90 - 18',
    rearTirePressure: '32 PSI',
    chainType: 'Paso 428H x 118 eslabones',
    sparkPlug: 'NGK D8EA / Resistencia 0.7mm',
    battery: '12V - 7Ah libre de mantenimiento',
    brakesFront: 'Disco hidráulico 240mm',
    brakesRear: 'Tambor mecánico con zapatas',
    cooling: 'Enfriado por aire natural',
    maintenanceIntervalOil: 'Cada 2,000 - 3,000 km',
  },
  'empire keeway-horse 150rl': {
    engineType: 'Monocilíndrico 4T con balanceador anti-vibración',
    displacement: '149.2 cc',
    hp: '11.8 HP @ 8200 RPM',
    torque: '10.5 Nm @ 7000 RPM',
    transmission: '5 Velocidades',
    weight: '122 kg',
    fuelCapacity: '13 Litros',
    oilCapacity: '1.0 Litro',
    oilTypeRecommended: '20W-50 o 15W-40 JASO MA2',
    frontTireSize: '2.75 - 18',
    frontTirePressure: '28 PSI',
    rearTireSize: '3.00 - 18',
    rearTirePressure: '32 PSI',
    chainType: '428H Reforzada',
    sparkPlug: 'NGK D8EA',
    battery: '12V 7Ah',
    brakesFront: 'Disco hidráulico',
    brakesRear: 'Tambor',
    cooling: 'Aire',
    maintenanceIntervalOil: 'Cada 2,500 km',
  },
  'empire keeway-rk 250': {
    engineType: 'Bicilíndrico en paralelo 4T, SOHC 4 válvulas',
    displacement: '249 cc',
    hp: '18.0 HP @ 8500 RPM',
    torque: '16.5 Nm @ 6000 RPM',
    transmission: '6 Velocidades retorno',
    weight: '160 kg',
    fuelCapacity: '16 Litros',
    oilCapacity: '1.4 Litros (con filtro)',
    oilTypeRecommended: 'Semi-Sintético 15W-40 o 10W-40',
    frontTireSize: '100/80 - 17',
    frontTirePressure: '30 PSI',
    rearTireSize: '130/70 - 17',
    rearTirePressure: '33 PSI',
    chainType: '520 O-Ring x 108L',
    sparkPlug: 'NGK CR8E (x2)',
    battery: '12V 9Ah',
    brakesFront: 'Doble disco lobulado 260mm',
    brakesRear: 'Disco hidráulico 240mm',
    cooling: 'Radiador de aceite asistido por aire',
    maintenanceIntervalOil: 'Cada 3,000 km',
  },
  'empire keeway-xpress 150': {
    engineType: 'Monocilíndrico 4T, varillero económico',
    displacement: '149 cc',
    hp: '11.0 HP @ 8000 RPM',
    torque: '9.8 Nm @ 7000 RPM',
    transmission: '5 Velocidades',
    weight: '112 kg',
    fuelCapacity: '10 Litros',
    oilCapacity: '1.0 Litro',
    oilTypeRecommended: '20W-50 Mineral',
    frontTireSize: '2.75 - 18',
    frontTirePressure: '28 PSI',
    rearTireSize: '3.00 - 18',
    rearTirePressure: '30 PSI',
    chainType: '428H',
    sparkPlug: 'NGK D8EA',
    battery: '12V 6.5Ah',
    brakesFront: 'Tambor mecánico',
    brakesRear: 'Tambor mecánico',
    cooling: 'Aire',
    maintenanceIntervalOil: 'Cada 2,000 km',
  },
  'bera-sbr 150cc': {
    engineType: 'Monocilíndrico 4T con tecnología balanceada',
    displacement: '150 cc',
    hp: '12.0 HP @ 8500 RPM',
    torque: '11.0 Nm @ 7500 RPM',
    transmission: '5 Velocidades',
    weight: '118 kg',
    fuelCapacity: '12.5 Litros',
    oilCapacity: '1.0 Litro',
    oilTypeRecommended: '20W-50 4T JASO MA2',
    frontTireSize: '2.75 - 18',
    frontTirePressure: '28 PSI',
    rearTireSize: '90/90 - 18',
    rearTirePressure: '32 PSI',
    chainType: '428H x 120L',
    sparkPlug: 'NGK D8EA',
    battery: '12V 7Ah',
    brakesFront: 'Disco hidráulico con cáliper de doble pistón',
    brakesRear: 'Tambor mecánico',
    cooling: 'Aire forzado',
    maintenanceIntervalOil: 'Cada 2,000 km',
  },
  'bera-kavak 150cc': {
    engineType: 'Monocilíndrico 4T, diseño utilitario reforzado',
    displacement: '150 cc',
    hp: '12.0 HP @ 8000 RPM',
    torque: '10.8 Nm @ 7000 RPM',
    transmission: '5 Velocidades',
    weight: '115 kg',
    fuelCapacity: '11 Litros',
    oilCapacity: '1.0 Litro',
    oilTypeRecommended: '20W-50 Mineral / Semi',
    frontTireSize: '2.75 - 18',
    frontTirePressure: '28 PSI',
    rearTireSize: '3.00 - 18',
    rearTirePressure: '32 PSI',
    chainType: '428H',
    sparkPlug: 'NGK D8EA',
    battery: '12V 7Ah',
    brakesFront: 'Disco hidráulico',
    brakesRear: 'Tambor mecánico',
    cooling: 'Aire',
    maintenanceIntervalOil: 'Cada 2,000 km',
  },
  'bera-gbr 200cc': {
    engineType: 'Monocilíndrico 4T, 200cc con eje balanceador',
    displacement: '198 cc',
    hp: '14.5 HP @ 8000 RPM',
    torque: '14.0 Nm @ 6500 RPM',
    transmission: '6 Velocidades retorno',
    weight: '135 kg',
    fuelCapacity: '14 Litros',
    oilCapacity: '1.2 Litros',
    oilTypeRecommended: 'Semi-Sintético 15W-40 / 20W-50',
    frontTireSize: '90/90 - 17',
    frontTirePressure: '29 PSI',
    rearTireSize: '120/80 - 17',
    rearTirePressure: '33 PSI',
    chainType: '520 x 106L',
    sparkPlug: 'NGK D8EA',
    battery: '12V 9Ah',
    brakesFront: 'Disco hidráulico ventilado',
    brakesRear: 'Disco hidráulico mono-pistón',
    cooling: 'Radiador de aceite y aletas de aire',
    maintenanceIntervalOil: 'Cada 3,000 km',
  },
  'bera-super dt 250cc': {
    engineType: 'Monocilíndrico 4T, refrigeración dual aire/aceite',
    displacement: '249 cc',
    hp: '19.0 HP @ 7500 RPM',
    torque: '18.5 Nm @ 6000 RPM',
    transmission: '5 Velocidades de alto torque',
    weight: '138 kg',
    fuelCapacity: '13 Litros',
    oilCapacity: '1.3 Litros',
    oilTypeRecommended: 'Semi-Sintético 15W-50',
    frontTireSize: '80/100 - 21 (Enduro)',
    frontTirePressure: '25 PSI',
    rearTireSize: '110/90 - 18 (Enduro)',
    rearTirePressure: '28 PSI',
    chainType: '520 O-Ring',
    sparkPlug: 'NGK DPR8EA-9',
    battery: '12V 7Ah',
    brakesFront: 'Disco hidráulico wave 260mm',
    brakesRear: 'Disco hidráulico 220mm',
    cooling: 'Radiador de aceite con deflector',
    maintenanceIntervalOil: 'Cada 2,500 km',
  },
  'escuda-em 200': {
    engineType: 'Monocilíndrico 4T con contrapeso anti-vibración',
    displacement: '198 cc',
    hp: '14.2 HP @ 8000 RPM',
    torque: '13.8 Nm @ 6500 RPM',
    transmission: '5 Velocidades',
    weight: '128 kg',
    fuelCapacity: '13 Litros',
    oilCapacity: '1.1 Litros',
    oilTypeRecommended: '20W-50 JASO MA2',
    frontTireSize: '90/90 - 17',
    frontTirePressure: '29 PSI',
    rearTireSize: '110/80 - 17',
    rearTirePressure: '32 PSI',
    chainType: '428H Reforzada',
    sparkPlug: 'NGK D8EA',
    battery: '12V 7Ah',
    brakesFront: 'Disco hidráulico',
    brakesRear: 'Disco hidráulico',
    cooling: 'Aire',
    maintenanceIntervalOil: 'Cada 2,500 km',
  },
  'escuda-alexa 180 cc.': {
    engineType: 'Monocilíndrico 4T urbano ágil',
    displacement: '175 cc',
    hp: '13.0 HP @ 8000 RPM',
    torque: '12.5 Nm @ 6800 RPM',
    transmission: '5 Velocidades',
    weight: '122 kg',
    fuelCapacity: '12 Litros',
    oilCapacity: '1.0 Litro',
    oilTypeRecommended: '20W-50',
    frontTireSize: '2.75 - 18',
    frontTirePressure: '28 PSI',
    rearTireSize: '90/90 - 18',
    rearTirePressure: '32 PSI',
    chainType: '428H',
    sparkPlug: 'NGK D8EA',
    battery: '12V 7Ah',
    brakesFront: 'Disco hidráulico',
    brakesRear: 'Tambor',
    cooling: 'Aire',
    maintenanceIntervalOil: 'Cada 2,500 km',
  },
  'forza-forza sf501 - 250cc': {
    engineType: 'Monocilíndrico 4T, árbol de levas a la cabeza (OHC)',
    displacement: '249 cc',
    hp: '18.5 HP @ 8500 RPM',
    torque: '17.2 Nm @ 6500 RPM',
    transmission: '6 Velocidades',
    weight: '148 kg',
    fuelCapacity: '14.5 Litros',
    oilCapacity: '1.3 Litros',
    oilTypeRecommended: 'Semi-Sintético 10W-40 / 15W-50',
    frontTireSize: '110/70 - 17',
    frontTirePressure: '30 PSI',
    rearTireSize: '140/70 - 17',
    rearTirePressure: '33 PSI',
    chainType: '520H',
    sparkPlug: 'NGK CR8E',
    battery: '12V 9Ah',
    brakesFront: 'Disco hidráulico doble pistón 280mm',
    brakesRear: 'Disco hidráulico 240mm',
    cooling: 'Radiador de aceite',
    maintenanceIntervalOil: 'Cada 3,000 km',
  },
  'kadi-kadi lovis 150': {
    engineType: 'Monocilíndrico 4T, tecnología de bajo consumo',
    displacement: '149 cc',
    hp: '11.2 HP @ 8000 RPM',
    torque: '10.2 Nm @ 7000 RPM',
    transmission: '5 Velocidades',
    weight: '116 kg',
    fuelCapacity: '11.5 Litros',
    oilCapacity: '1.0 Litro',
    oilTypeRecommended: '20W-50 Mineral',
    frontTireSize: '2.75 - 18',
    frontTirePressure: '28 PSI',
    rearTireSize: '3.00 - 18',
    rearTirePressure: '31 PSI',
    chainType: '428H',
    sparkPlug: 'NGK D8EA',
    battery: '12V 7Ah',
    brakesFront: 'Disco hidráulico',
    brakesRear: 'Tambor mecánico',
    cooling: 'Aire',
    maintenanceIntervalOil: 'Cada 2,000 km',
  },
  'chevrolet-optra 2011': {
    engineType: '4 Cilindros en línea, 1.8L DOHC 16 Válvulas E-TEC II / D-TEC MPFI',
    displacement: '1.799 cc (1.8L)',
    hp: '121 HP (89 kW) @ 5.800 RPM',
    torque: '165 Nm (16.8 kg-m) @ 4.000 RPM',
    transmission: 'Manual 5 velocidades / Automática 4 velocidades con Hold Mode',
    weight: '1.250 kg (Peso en vacío)',
    fuelCapacity: '60 Litros (15.8 galones) - Gasolina 91/95 Octanos',
    oilCapacity: '4.0 Litros (con filtro)',
    oilTypeRecommended: '10W-30 / 15W-40 Semi-Sintético o 5W-30 Sintético API SN/SP',
    coolantCapacity: '7.0 Litros (Dex-Cool 50/50)',
    frontTireSize: '195/55 R15',
    frontTirePressure: '30 - 32 PSI',
    rearTireSize: '195/55 R15',
    rearTirePressure: '30 - 32 PSI',
    timingBeltType: 'Correa DOHC 16V (162 dientes) - Motor interferencia',
    sparkPlug: 'NGK BKR6E-11 / Champion RC9YC4 (Luz: 1.1 mm)',
    battery: '12V 60Ah - 550 CCA (Borne invertido)',
    brakesFront: 'Discos ventilados 256 mm con cáliper flotante',
    brakesRear: 'Discos sólidos 258 mm con tambor interno de parqueo (ABS + EBD)',
    cooling: 'Líquido presurizado, electroventilador doble y radiador aluminio',
    maintenanceIntervalOil: 'Cada 5.000 km (Semi-sintético) o 7.500 km (Sintético)',
    maintenanceIntervalTimingBelt: 'Cada 40.000 - 50.000 km (Cambio Crítico)',
    suspensionFront: 'Independiente tipo McPherson con barra estabilizadora',
    suspensionRear: 'Independiente Dual-Link multibrazo con barra estabilizadora',
    dimensions: 'Largo: 4.520 mm | Ancho: 1.725 mm | Alto: 1.445 mm | Batalla: 2.600 mm',
    trunkCapacity: '405 Litros',
    equipment: 'Chevystar Platinum con pantalla 4.3" y GPS, Climatizador digital, Doble Airbag, Sunroof',
  },
  'chevrolet-optra advance 2011': {
    engineType: '4 Cilindros en línea, 1.8L DOHC 16 Válvulas E-TEC II / D-TEC MPFI',
    displacement: '1.799 cc (1.8L)',
    hp: '121 HP (89 kW) @ 5.800 RPM',
    torque: '165 Nm (16.8 kg-m) @ 4.000 RPM',
    transmission: 'Manual 5 velocidades / Automática 4 velocidades con Hold Mode',
    weight: '1.250 kg (Peso en vacío)',
    fuelCapacity: '60 Litros (15.8 galones) - Gasolina 91/95 Octanos',
    oilCapacity: '4.0 Litros (con filtro)',
    oilTypeRecommended: '10W-30 / 15W-40 Semi-Sintético o 5W-30 Sintético API SN/SP',
    coolantCapacity: '7.0 Litros (Dex-Cool 50/50)',
    frontTireSize: '195/55 R15',
    frontTirePressure: '30 - 32 PSI',
    rearTireSize: '195/55 R15',
    rearTirePressure: '30 - 32 PSI',
    timingBeltType: 'Correa DOHC 16V (162 dientes) - Motor interferencia',
    sparkPlug: 'NGK BKR6E-11 / Champion RC9YC4 (Luz: 1.1 mm)',
    battery: '12V 60Ah - 550 CCA (Borne invertido)',
    brakesFront: 'Discos ventilados 256 mm con cáliper flotante',
    brakesRear: 'Discos sólidos 258 mm con tambor interno de parqueo (ABS + EBD)',
    cooling: 'Líquido presurizado, electroventilador doble y radiador aluminio',
    maintenanceIntervalOil: 'Cada 5.000 km (Semi-sintético) o 7.500 km (Sintético)',
    maintenanceIntervalTimingBelt: 'Cada 40.000 - 50.000 km (Cambio Crítico)',
    suspensionFront: 'Independiente tipo McPherson con barra estabilizadora',
    suspensionRear: 'Independiente Dual-Link multibrazo con barra estabilizadora',
    dimensions: 'Largo: 4.520 mm | Ancho: 1.725 mm | Alto: 1.445 mm | Batalla: 2.600 mm',
    trunkCapacity: '405 Litros',
    equipment: 'Chevystar Platinum con pantalla 4.3" y GPS, Climatizador digital, Doble Airbag, Sunroof',
  },
  'chevrolet-optra': {
    engineType: '4 Cilindros en línea, 1.8L DOHC 16 Válvulas E-TEC II / D-TEC MPFI',
    displacement: '1.799 cc (1.8L)',
    hp: '121 HP (89 kW) @ 5.800 RPM',
    torque: '165 Nm (16.8 kg-m) @ 4.000 RPM',
    transmission: 'Manual 5 velocidades / Automática 4 velocidades con Hold Mode',
    weight: '1.250 kg (Peso en vacío)',
    fuelCapacity: '60 Litros (15.8 galones) - Gasolina 91/95 Octanos',
    oilCapacity: '4.0 Litros (con filtro)',
    oilTypeRecommended: '10W-30 / 15W-40 Semi-Sintético o 5W-30 Sintético API SN/SP',
    coolantCapacity: '7.0 Litros (Dex-Cool 50/50)',
    frontTireSize: '195/55 R15',
    frontTirePressure: '30 - 32 PSI',
    rearTireSize: '195/55 R15',
    rearTirePressure: '30 - 32 PSI',
    timingBeltType: 'Correa DOHC 16V (162 dientes) - Motor interferencia',
    sparkPlug: 'NGK BKR6E-11 / Champion RC9YC4 (Luz: 1.1 mm)',
    battery: '12V 60Ah - 550 CCA (Borne invertido)',
    brakesFront: 'Discos ventilados 256 mm con cáliper flotante',
    brakesRear: 'Discos sólidos 258 mm con tambor interno de parqueo (ABS + EBD)',
    cooling: 'Líquido presurizado, electroventilador doble y radiador aluminio',
    maintenanceIntervalOil: 'Cada 5.000 km (Semi-sintético) o 7.500 km (Sintético)',
    maintenanceIntervalTimingBelt: 'Cada 40.000 - 50.000 km (Cambio Crítico)',
    suspensionFront: 'Independiente tipo McPherson con barra estabilizadora',
    suspensionRear: 'Independiente Dual-Link multibrazo con barra estabilizadora',
    dimensions: 'Largo: 4.520 mm | Ancho: 1.725 mm | Alto: 1.445 mm | Batalla: 2.600 mm',
    trunkCapacity: '405 Litros',
    equipment: 'Chevystar Platinum con pantalla 4.3" y GPS, Climatizador digital, Doble Airbag, Sunroof',
  }
};

export const getMotoSpecs = (brand: string, model: string): MotoSpecs => {
  if (!brand && !model) {
    return generateFallbackSpecs('150 cc');
  }

  const cleanBrand = (brand || '').trim().toLowerCase();
  const cleanModel = (model || '').trim().toLowerCase();
  const exactKey = `${cleanBrand}-${cleanModel}`;

  if (MOTO_SPECS_DB[exactKey]) {
    return MOTO_SPECS_DB[exactKey];
  }

  // Detect Optra or Chevrolet car
  if (cleanModel.includes('optra') || (cleanBrand.includes('chevrolet') && cleanModel.includes('optra'))) {
    return MOTO_SPECS_DB['chevrolet-optra 2011'];
  }

  // Find approximate match
  for (const k of Object.keys(MOTO_SPECS_DB)) {
    if (k.includes(cleanModel) || (cleanModel && cleanModel.includes(k.split('-')[1]))) {
      return MOTO_SPECS_DB[k];
    }
  }


  // Derive specs automatically based on model name / displacement
  let displacementHint = '150 cc';
  if (cleanModel.includes('250')) displacementHint = '250 cc';
  else if (cleanModel.includes('200')) displacementHint = '200 cc';
  else if (cleanModel.includes('180')) displacementHint = '180 cc';
  else if (cleanModel.includes('125')) displacementHint = '125 cc';
  else if (cleanModel.includes('300')) displacementHint = '300 cc';

  return generateFallbackSpecs(displacementHint);
};

function generateFallbackSpecs(disp: string): MotoSpecs {
  const is250 = disp.includes('250') || disp.includes('300');
  const is200 = disp.includes('200') || disp.includes('180');

  return {
    engineType: `Monocilíndrico 4 Tiempos (${disp})`,
    displacement: disp,
    hp: is250 ? '18.5 HP @ 8000 RPM' : (is200 ? '14.0 HP @ 8000 RPM' : '11.5 HP @ 8200 RPM'),
    torque: is250 ? '16.8 Nm @ 6500 RPM' : (is200 ? '13.2 Nm @ 6500 RPM' : '10.2 Nm @ 7000 RPM'),
    transmission: is250 ? '6 Velocidades' : '5 Velocidades sincronizadas',
    weight: is250 ? '145 kg' : (is200 ? '130 kg' : '118 kg'),
    fuelCapacity: is250 ? '14 Litros' : '12 Litros',
    oilCapacity: is250 ? '1.3 Litros' : (is200 ? '1.1 Litros' : '1.0 Litro'),
    oilTypeRecommended: is250 ? '15W-40 o 10W-40 Semi-Sintético' : '20W-50 4T JASO MA2',
    frontTireSize: is250 ? '90/90 - 17' : '2.75 - 18',
    frontTirePressure: '28 PSI',
    rearTireSize: is250 ? '130/70 - 17' : '90/90 - 18',
    rearTirePressure: '32 PSI',
    chainType: is250 ? '520 O-Ring' : '428H Reforzada',
    sparkPlug: is250 ? 'NGK CR8E' : 'NGK D8EA',
    battery: is250 ? '12V 9Ah' : '12V 7Ah',
    brakesFront: 'Disco hidráulico ventilado',
    brakesRear: is250 ? 'Disco hidráulico' : 'Tambor mecánico',
    cooling: is250 ? 'Radiador de aceite y aire' : 'Aire forzado',
    maintenanceIntervalOil: is250 ? 'Cada 3,000 km' : 'Cada 2,000 km',
  };
}
