export function encode(obj: any) { 
  return Buffer.from(JSON.stringify(obj)).toString('base64url'); 
}

