export function route(role: 'controller'|'display'){ 
  return { 
    role, 
    room: 'auto', 
    ts: new Date().toISOString() 
  }; 
}
