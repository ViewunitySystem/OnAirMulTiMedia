export async function simulate(kind: 'net'|'cpu'|'io'){ 
  return { 
    kind, 
    injected: true, 
    ts: new Date().toISOString() 
  }; 
}

