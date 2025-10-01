import crypto from 'node:crypto';
import fs from 'node:fs';

const data = fs.readFileSync(process.argv[2]);
const hash = crypto.createHash('sha256').update(data).digest('hex');

process.stdout.write(hash);
