export function frame(len = 960){
  return { 
    event: 'VOICE_FRAME', 
    codec: 'opus', 
    len, 
    license: 'unknown', 
    ts: new Date().toISOString() 
  };
}

