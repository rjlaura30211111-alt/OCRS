# Word Template Guide

Ilagay ang ready-made Word file mo dito:

```
templates/document-template.docx
```

## Placeholders sa Word mo

Sa Word document mo, i-type ang tatlong placeholder na ito **exactly** kung saan mo gusto lumabas ang data:

| Placeholder | Lalabas |
|-------------|---------|
| `{subject}` | Subject na na-type sa app |
| `{referenceNumber}` | Reference / Control number |
| `{%qrCode}` | QR code image |

### Halimbawa layout sa Word mo (Routing Slip)

```
SUBJECT: {subject}

...

Control Number: {referenceNumber}
{%qrCode}
```

## Important tips

1. **I-type nang diretso** ang placeholders — huwag i-copy from formatted text na pwedeng mag-split ang characters sa Word.
2. **`.docx` format** — save as Word Document (.docx), hindi `.doc`.
3. **Palitan lang** ang `templates/document-template.docx` kung kailangan baguhin ang papel — fixed na ito sa app.

## Patch routine.docx (already done for default template)

Kung may `routine.docx` ka at gusto mong i-auto-insert ang placeholders:

```bash
node scripts/patch-routine-template.mjs
```
