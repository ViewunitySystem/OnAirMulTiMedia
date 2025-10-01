export async function get(key: string){ 
  return { 
    key, 
    value: '***', 
    ts: new Date().toISOString() 
  }; 
}

