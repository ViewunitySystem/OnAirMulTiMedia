export function logSwipe(from: string, to: string){
  return { 
    event: 'SWIPE', 
    from, 
    to, 
    ts: new Date().toISOString() 
  };
}

