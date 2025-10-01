export function change(name: string, prev: any, curr: any){ 
  return { 
    name, 
    prev, 
    curr, 
    changed: prev !== curr, 
    ts: new Date().toISOString() 
  }; 
}

