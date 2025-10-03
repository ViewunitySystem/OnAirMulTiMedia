#!/usr/bin/env python3
import json, sys
from jsonschema import validate

bp_path, schema_path = sys.argv[1], sys.argv[2]
with open(bp_path,'r',encoding='utf-8') as f: bp=json.load(f)
with open(schema_path,'r',encoding='utf-8') as f: schema=json.load(f)
validate(instance=bp, schema=schema)
req = ["module","interfaces","audit_flags","ci_cd_hooks","compliance"]
assert all(k in bp for k in req), "missing required keys"
print("OK: blueprint valid")
