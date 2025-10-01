export function authorize(lat: number, lon: number){ 
  return { 
    allowed: true, 
    region: 'EU', 
    ts: new Date().toISOString() 
  }; 
}
