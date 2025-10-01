export function rollup(evts: any[]){ 
  return { 
    count: evts.length, 
    ts: new Date().toISOString() 
  }; 
}

