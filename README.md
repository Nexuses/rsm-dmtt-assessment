This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Google Sheets integration (capture all form submissions)

When a user completes the assessment form, the server API (`pages/api/send-assessment.ts`) appends the submission to a Google Sheet.

- **Spreadsheet**: configure via `GOOGLE_SHEETS_SPREADSHEET_ID` (defaults to the spreadsheet id in `env.example`).
- **Tabs**:
  - `GOOGLE_SHEETS_ASSESSMENT_SHEET_NAME` (default `Sheet1`)
  - `GOOGLE_SHEETS_CONSULTATION_SHEET_NAME` (default `Sheet2`)

### Setup

1. Create a **Google Cloud service account** and enable **Google Sheets API**.
2. Create a **JSON key** for the service account.
3. Share your Google Sheet with the **service account email** (Editor permission).
4. Create a local `.env.local` and copy variables from `env.example`.
   - Set `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` to the **entire JSON** contents of your key file.

### Header “auto-analysis”

On each submission the API:

- Reads **row 1** of the configured sheet tab (your headers).
- If headers are missing, it creates them.
- If headers exist, it **keeps them** and **appends any missing columns** needed to capture all fields.
- Builds the new row by matching values to headers (e.g., `Name`, `Email`, `Q5`, `Q5 - ...`, etc.).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
