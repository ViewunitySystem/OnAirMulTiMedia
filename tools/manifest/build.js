import fs from 'node:fs';

const modules = fs.readdirSync('modules').filter(f => fs.statSync(`modules/${f}`).isDirectory());

const manifest = { 
  version: new Date().toISOString().slice(0,10).replaceAll('-','.'), 
  modules, 
  generatedAt: new Date().toISOString() 
};

console.log(JSON.stringify(manifest, null, 2));

