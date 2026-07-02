# OCRS App Icons

## Master icon

Place your source logo here as **`OCRS.png`**.

After updating `OCRS.png`, regenerate the install sizes:

```bash
npm run generate-app-icons
```

## Generated files (auto-created from OCRS.png)

| File | Size | Gamit |
|------|------|-------|
| `icon-512.png` | 512 x 512 px | Main install icon (Android / PWA) |
| `icon-192.png` | 192 x 192 px | Home screen icon (Android) |
| `icon-180.png` | 180 x 180 px | Home screen icon (iPhone / iPad) |
| `favicon-32.png` | 32 x 32 px | Browser tab icon |

## Tips

- Keep `OCRS.png` as your master file — edit this, then run `npm run generate-app-icons`.
- PNG works best. Square source images give the cleanest result.
- After replacing icons, refresh the site or reinstall the app to see changes.
