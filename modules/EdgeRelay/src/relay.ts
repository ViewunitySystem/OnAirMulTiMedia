export async function relay(url: string) { 
  return { 
    url, 
    ok: true, 
    ts: new Date().toISOString() 
  }; 
}

