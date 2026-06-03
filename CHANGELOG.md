# Changelog

## 1.1.0 (2026-06-03)

Full API v2 surface parity, security fixes, modern deps, and TypeScript types.

### Security / Fixed
- **Removed `httpsAgent: { rejectUnauthorized: false }`** — the SDK was disabling
  TLS certificate verification on every request (silent MITM exposure). TLS is now
  verified normally.
- **Bumped `axios` `^0.21.4` → `^1.7.7`** (the 0.21 line carries known CVEs incl.
  CVE-2023-45857) and **removed the deprecated `moment` dependency** (date check is
  now a small regex + `Date`).
- **Base URL** default `v2-us1.idanalyzer.com` (single node, no Cloudflare/LB/HA) →
  **`api2.idanalyzer.com`**. EU unchanged (`api2-eu` via `IDANALYZER_REGION=eu`).
- Unknown `IDANALYZER_REGION` now throws `InvalidArgumentException` instead of
  returning `undefined` (which broke every request).
- Fixed `Profile.webhook()` protocol guard (`!== 'http' || !== 'https'` was always
  true and compared without the `:` suffix → rejected every URL).
- Fixed `Transaction.listTransaction` and `Docupass.listDocupass` passing query
  params as the axios request body — filters/pagination were never sent.
- Fixed the age-range regex (`^\d+-\d$` → `^\d+-\d+$`) so multi-digit max ages validate.
- Removed leftover `console.log(1)`/`console.log(2)` debug output from `updateTemplate`.
- Constructor now honours the `IDANALYZER_KEY` environment variable.

### Added
- `Scanner.veryQuickScan` → `POST /veryquickscan`.
- `AML` class — `search` (`POST /aml`, incl. optional `birthYear`) and `searchV3`
  (`POST /amlv3`).
- `Docupass.getDocupass` → `GET /docupass/{reference}`.
- `ProfileAPI` class — server-side KYC profile CRUD + export.
- `Webhook` class — `listWebhook`/`resendWebhook`/`deleteWebhook`.
- `Account` class — `getAccount` (`GET /myaccount`).
- **Bundled TypeScript definitions** (`index.d.ts`).
- `engines.node >= 18`.
