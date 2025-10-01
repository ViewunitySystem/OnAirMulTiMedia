export async function diff(prev: number, curr: number){
  return { 
    region: 'EU', 
    rule: 'duty_cycle', 
    prev, 
    curr, 
    status: prev === curr ? 'same' : 'changed', 
    ts: new Date().toISOString() 
  };
}

