export function buildPayload(id: string, license = 'EU-VALID'){
  return { 
    meet: `oamtm://meet/${id}`, 
    license, 
    sig: 'ed25519:PLACEHOLDER' 
  };
}

