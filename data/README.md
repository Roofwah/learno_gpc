# Store list (editable)

Kiosks load stores at runtime from **`public/data/stores.json`**.

## Update stores for an event

1. Edit **`data/stores.csv`** in Excel or a text editor.  
   Columns: `displayName`, `suburb`, `state`, `country` (`AU` or `NZ`)

2. Rebuild JSON on your Mac:
   ```bash
   npm run build-stores
   ```

3. Copy **`public/data/stores.json`** to every kiosk PC (same path in the project).  
   No code rebuild required on kiosks — just replace that one file and refresh the browser.

## First-time CSV export (optional)

If `data/stores.csv` does not exist yet:

```bash
npx ts-node scripts/export-stores-csv.ts
npm run build-stores
```

## Files

| File | Purpose |
|------|---------|
| `data/stores.csv` | Source you edit |
| `public/data/stores.json` | What kiosks fetch at runtime |
| `lib/stores-raw.ts` | Fallback if CSV is missing when building |
