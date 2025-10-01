export type Waypoint = { 
  t: string; 
  hint?: string 
};

export type NomadicPath = { 
  path: Waypoint[] 
};

export const empty: NomadicPath = { 
  path: [] 
};
