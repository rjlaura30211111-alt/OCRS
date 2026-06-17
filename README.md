# OCRS — Document Tracker

Web app for submitting routing slip reports with QR codes. Fill in subject, reference number, date/time, and action requested — then download a filled Word document from the fixed template.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

On Windows, submitting a report can auto-open the generated Word file. On Vercel, the file downloads in the browser instead.

## Fixed Word template

The routing slip always uses:

```
templates/document-template.docx
```

Placeholders: `{subject}`, `{referenceNumber}`, `{date}`, `{time}`, `{%qrCode}`.

If placeholders break after editing in Word, run:

```bash
npm run repair-template
```

See `templates/README.md` for the full guide.

## Deploy to Vercel

- **Live:** [https://ocrs-cyan.vercel.app](https://ocrs-cyan.vercel.app)
- **GitHub:** [https://github.com/rjlaura30211111-alt/OCRS](https://github.com/rjlaura30211111-alt/OCRS)
- **Dashboard:** [Vercel — rogie-josue-laura-s-projects/ocrs](https://vercel.com/rogie-josue-laura-s-projects/ocrs)

```bash
npx vercel --prod --scope rogie-josue-laura-s-projects
```

Commit `templates/document-template.docx` with the app so the template is available on deploy.
