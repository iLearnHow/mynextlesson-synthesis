# iLearn Planning Suite (Imported)

This folder mirrors the planning suite artifacts used during integration.

## Contents
- `openapi/openapi.yaml`: Public and Admin API contracts
- `schemas/`: JSON Schemas (manifest, popup payloads, events, reports)
- `examples/`: Example manifests and report payloads for local testing

## Local validation (optional)
Use your root Node toolchain if available. These commands are informative only.

```bash
npm run validate || echo "Validation scripts not configured in this repo"
```

## Notes
- These assets are for development. They should not be served to production.
- The final player must be wired into `index.html`; this folder is reference material and test data.


