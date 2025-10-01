export type MirrorInput = { 
  source: 'rf'|'sms'|'webrtc'; 
  target: 'webrtc'|'canvas'; 
  payload: unknown 
};

export async function mirror(i: MirrorInput){
  const ts = new Date().toISOString();
  // TODO: route to adapters
  return { 
    event:'MIRROR_COMPLETED', 
    ts, 
    source:i.source, 
    target:i.target, 
    hash:'sha256-PLACEHOLDER', 
    license:{status:'unknown'} 
  };
}
