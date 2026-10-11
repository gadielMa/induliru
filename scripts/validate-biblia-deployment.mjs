import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourceRoot = resolve(repoRoot, 'biblia');
const deploymentRoot = resolve(repoRoot, process.argv[2] || 'biblia');
const indexFile = resolve(sourceRoot, 'index.html');
const deploymentIndex = resolve(deploymentRoot, 'index.html');
const errors = [];

function existsInside(root, relativePath) {
  const path = resolve(root, relativePath);
  return !isAbsolute(relativePath) && (path === root || path.startsWith(`${root}${sep}`)) && existsSync(path);
}

if (!existsSync(indexFile)) errors.push(`Falta ${indexFile}`);
if (!existsSync(deploymentIndex)) errors.push(`Falta la página copiada: ${deploymentIndex}`);

try {
  const tree = execFileSync('git', ['ls-tree', 'HEAD', 'biblia'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const expected = tree.match(/^160000 commit ([a-f0-9]+)\tbiblia$/)?.[1];
  const actual = execFileSync('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (!expected) errors.push('El commit del repositorio principal no registra biblia como submódulo.');
  else if (expected !== actual) errors.push(`El submódulo está en ${actual}; el commit principal requiere ${expected}.`);
} catch (error) {
  errors.push(`No se pudo verificar el commit del submódulo: ${error.message}`);
}

if (existsSync(indexFile)) {
  const html = readFileSync(indexFile, 'utf8');
  const requiredPaths = new Set();
  for (const match of html.matchAll(/["']((?:assets|textos|pdfs)\/[^"']+)["']/g)) {
    requiredPaths.add(match[1].split(/[?#]/, 1)[0]);
  }

  const catalogPath = resolve(sourceRoot, 'textos/catalog.json');
  if (!existsSync(catalogPath)) errors.push('Falta textos/catalog.json en el submódulo.');
  else {
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
    for (const entry of catalog) requiredPaths.add(`textos/${entry.file}`);
  }
  requiredPaths.add('textos/search-index.json');

  for (const relativePath of requiredPaths) {
    if (!existsInside(sourceRoot, relativePath)) errors.push(`Falta en el submódulo: ${relativePath}`);
    if (!existsInside(deploymentRoot, relativePath)) errors.push(`Falta en la carpeta publicada: ${relativePath}`);
  }
}

if (errors.length) {
  console.error('Validación de Biblioteca Bíblica fallida:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Biblioteca validada: commit del submódulo y ${existsSync(indexFile) ? 'recursos locales completos' : 'página raíz presente'}.`);
}
