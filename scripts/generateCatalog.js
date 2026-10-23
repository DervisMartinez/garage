const fs = require('fs');
const path = require('path');

const motosDir = path.join(__dirname, '../assets/images/motos');
const autosDir = path.join(__dirname, '../assets/images/autos');
const outputFilePath = path.join(__dirname, '../src/data/catalog.ts');

if (!fs.existsSync(motosDir)) {
  console.error(`Directorio no encontrado: ${motosDir}`);
  process.exit(1);
}

const motoBrands = fs.readdirSync(motosDir).filter(file => fs.statSync(path.join(motosDir, file)).isDirectory());

let fileContent = `// ARCHIVO GENERADO AUTOMÁTICAMENTE. NO EDITAR A MANO.\n`;
fileContent += `// Para actualizar este catálogo, ejecuta: node scripts/generateCatalog.js\n\n`;
fileContent += `export type VehicleType = 'moto' | 'car';\n\n`;
fileContent += `export interface CatalogVehicle {\n  id: string;\n  brand: string;\n  model: string;\n  vehicleType?: VehicleType;\n  category?: string;\n  year?: number;\n  imageRes: any;\n}\n\n`;
fileContent += `export type CatalogMoto = CatalogVehicle;\n\n`;
fileContent += `export const MOTO_CATALOG: CatalogMoto[] = [\n`;

motoBrands.forEach(brand => {
  const brandDir = path.join(motosDir, brand);
  const models = fs.readdirSync(brandDir).filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'));
  
  models.forEach(modelFile => {
    const modelName = path.parse(modelFile).name;
    const cleanBrand = brand.trim();
    const cleanModel = modelName.trim();
    const relativePath = `../../assets/images/motos/${brand}/${modelFile}`.replace(/\\/g, '/');
    
    fileContent += `  {\n`;
    fileContent += `    id: "${cleanBrand}-${cleanModel}".replace(/\\s+/g, '-').toLowerCase(),\n`;
    fileContent += `    brand: "${cleanBrand}",\n`;
    fileContent += `    model: "${cleanModel}",\n`;
    fileContent += `    vehicleType: 'moto',\n`;
    fileContent += `    imageRes: require('${relativePath}'),\n`;
    fileContent += `  },\n`;
  });
});

fileContent += `];\n\n`;

fileContent += `export const CAR_CATALOG: CatalogVehicle[] = [\n`;
fileContent += `  {\n`;
fileContent += `    id: 'chevrolet-optra-2011',\n`;
fileContent += `    brand: 'CHEVROLET',\n`;
fileContent += `    model: 'Optra Advance 2011',\n`;
fileContent += `    vehicleType: 'car',\n`;
fileContent += `    category: 'SEDAN',\n`;
fileContent += `    year: 2011,\n`;
fileContent += `    imageRes: require('../../assets/images/autos/CHEVROLET/SEDAN/OPTRA 2011.png'),\n`;
fileContent += `  },\n`;
fileContent += `  {\n`;
fileContent += `    id: 'toyota-samurai-fj60-1982',\n`;
fileContent += `    brand: 'TOYOTA',\n`;
fileContent += `    model: 'Samurai FJ60 1982',\n`;
fileContent += `    vehicleType: 'car',\n`;
fileContent += `    category: 'SUV / 4X4',\n`;
fileContent += `    year: 1982,\n`;
fileContent += `    imageRes: require('../../assets/images/autos/TOYOTA/1982/SAMURAI FJ60 1982.png'),\n`;
fileContent += `  },\n`;
fileContent += `];\n\n`;

fileContent += `export const VEHICLE_CATALOG: CatalogVehicle[] = [\n`;
fileContent += `  ...MOTO_CATALOG.map(m => ({ ...m, vehicleType: 'moto' as VehicleType })),\n`;
fileContent += `  ...CAR_CATALOG,\n`;
fileContent += `];\n`;

fs.writeFileSync(outputFilePath, fileContent);
console.log(`Catálogo generado exitosamente con motos y autos en: ${outputFilePath}`);
