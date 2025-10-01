export function drift(ms: number) { 
  return { 
    event: 'TIME_DRIFT', 
    driftMs: ms, 
    ok: Math.abs(ms) < 5000, 
    ts: new Date().toISOString() 
  }; 
}
