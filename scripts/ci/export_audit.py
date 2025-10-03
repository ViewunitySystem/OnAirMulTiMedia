#!/usr/bin/env python3
import json, sys, hashlib, time
bp=json.load(open(sys.argv[1],'r',encoding='utf-8'))
h=hashlib.sha256(json.dumps(bp,sort_keys=True).encode('utf-8')).hexdigest()
out={
  "ts": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
  "module": bp.get('module'),
  "blueprint_checksum": h,
  "flags": bp.get('audit_flags',[]),
  "compliance": bp.get('compliance',{}),
}
print(json.dumps(out, indent=2))
