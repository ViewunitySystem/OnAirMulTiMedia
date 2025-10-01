import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '..');
const schemaFile = path.join(root, 'public', 'schemas', 'blueprint.schema.json');
const dir = path.join(root, 'public', 'blueprints');

const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

let failures = 0;
for (const f of fs.readdirSync(dir)){
  if (!f.endsWith('.json')) continue;
  const p = path.join(dir, f);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const ok = validate(data);
  if (!ok){
    console.error(`❌ ${f}`);
    console.error(validate.errors);
    failures++;
  } else {
    console.log(`✅ ${f}`);
  }
}

if (failures){
  console.error(`Validation failed for ${failures} file(s).`);
  process.exit(1);
} else {
  console.log('All blueprints valid.');
}

