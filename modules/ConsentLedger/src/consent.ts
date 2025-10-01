export function consent(user: string, scope: string){ 
  return { 
    user, 
    scope, 
    event: 'CONSENT_GIVEN', 
    ts: new Date().toISOString() 
  }; 
}
