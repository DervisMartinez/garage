const fs = require('fs');
const path = require('path');

const motosDir = path.join(__dirname, '../assets/images/motos');
const outputFilePath = path.join(__dirname, '../src/data/catalog.ts');

if (!fs.existsSync(motosDir)) {
  console.error(`Directorio no encontrado: ${motosDir}`);
  process.exit(1);
}

const brands = fs.readdirSync(motosDir).filter(file => fs.statSync(path.join(motosDir, file)).isDirectory());

let fileContent = `// ARCHIVO GENERADO AUTOMÁTICAMENTE. NO EDITAR A MANO.\n`;
fileContent += `// Para actualizar este catálogo, ejecuta: node scripts/generateCatalog.js\n\n`;
fileContent += `export interface CatalogMoto {\n  id: string;\n  brand: string;\n  model: string;\n  imageRes: any;\n}\n\n`;
fileContent += `export const MOTO_CATALOG: CatalogMoto[] = [\n`;

brands.forEach(brand => {
  const brandDir = path.join(motosDir, brand);
  const models = fs.readdirSync(brandDir).filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'));
  
  models.forEach(modelFile => {
    const modelName = path.parse(modelFile).name;
    const cleanBrand = brand.trim();
    const cleanModel = modelName.trim();
    // Use posix paths for require
    const relativePath = `../../assets/images/motos/${brand}/${modelFile}`.replace(/\\/g, '/');
    
    fileContent += `  {\n`;
    fileContent += `    id: "${cleanBrand}-${cleanModel}".replace(/\\s+/g, '-').toLowerCase(),\n`;
    fileContent += `    brand: "${cleanBrand}",\n`;
    fileContent += `    model: "${cleanModel}",\n`;
    fileContent += `    imageRes: require('${relativePath}'),\n`;
    fileContent += `  },\n`;
  });
});

fileContent += `];\n`;

fs.writeFileSync(outputFilePath, fileContent);
console.log(`Catálogo generado exitosamente con ${brands.length} marcas en: ${outputFilePath}`);
