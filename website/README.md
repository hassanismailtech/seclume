# Website maintenance notes

## Privacy review

**Draft pending legal review:** the Privacy content in `lib/site-content.ts` describes the supplied website and playground code. This status is recorded here and in a source comment, not rendered on the public page. It is not an approved legal policy. Controller identity, actual hosting/email providers, infrastructure logging and retention, and any required notices must be reviewed against an operator's real deployment before treating it as one.

## Q6 assumptions

- No website input/result persistence is added. Temporary Redis Session Map state, rate-limit counters, optional in-process NER span caches and the existing audit dependency are described separately; there is no blanket claim that nothing is stored.
- The paused message covers missing API configuration, network/timeout failures and unavailable responses. Input rejection and rate-limit guidance remain distinct. Source and Docker quickstart links remain available.
- Removed Press and Careers paths have narrowly matched 404 responses in `proxy.ts`: otherwise the catch-all can stream a not-found page with HTTP 200 on its first request. Other routes retain their existing behavior.
- Performance rows use the Torch “after” column in the benchmark recorded in `NOTES.md` at commit `faabe2e` on 2026-10-28: 100 runs per prompt, Windows demo laptop with 14.9 GB RAM, cold model/cache bypassed. The CPU model and exact measurement time were not recorded. This is a historical layer benchmark, not current end-to-end latency or a new measurement.
- Decisions stay in this file because Q6 is website-only; root `NOTES.md` is outside its allowlist. No dependency, backend, dashboard or deployment configuration changes are included.

## Development

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
