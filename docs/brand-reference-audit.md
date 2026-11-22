# Brand reference audit

Date: 2026-11-22. Scope: Q1. Every matching source line from the requested extensions is listed below, with an occurrence count and retention reason. Counts describe this source audit, not product performance.

Command (PowerShell-compatible replacement for the requested recursive grep):

```powershell
rg --hidden -n -i "seclume" . -g "*.md" -g "*.ts" -g "*.tsx" -g "*.json" -g "!.git/**" -g "!docs/brand-reference-audit.md"
```

The search respects repository ignore files: installed dependencies, build/cache artifacts, local environments, private working documents and Git internals are excluded. Lockfiles and matching hidden source files are included. This generated inventory is explicitly excluded because it repeats source references; its search term, command and rows are retained solely to document this audit. No vendor/private tree is rewritten.

Result: 108 matching lines, 137 occurrences, 22 files.

| Source line | Occurrences | Reason |
|---|---:|---|
| `CHANGELOG.md:20` | 2 | Current public name, actual rename history or stable repository release links. |
| `CHANGELOG.md:22` | 1 | Current public name, actual rename history or stable repository release links. |
| `CHANGELOG.md:45` | 1 | Current public name, actual rename history or stable repository release links. |
| `CHANGELOG.md:46` | 1 | Current public name, actual rename history or stable repository release links. |
| `CHANGELOG.md:47` | 1 | Current public name, actual rename history or stable repository release links. |
| `CHANGELOG.md:48` | 1 | Current public name, actual rename history or stable repository release links. |
| `CODE_OF_CONDUCT.md:40` | 1 | Repository URL or existing image configuration identifier; independent of display name/domain. |
| `CONTRIBUTING.md:1` | 1 | Current public product name or maintained branding reference. |
| `CONTRIBUTING.md:3` | 1 | Current public product name or maintained branding reference. |
| `NOTES.md:8` | 2 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:9` | 1 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:13` | 1 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:25` | 1 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:30` | 1 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:40` | 1 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:41` | 1 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:49` | 2 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:55` | 2 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:56` | 1 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:63` | 1 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:67` | 1 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:68` | 1 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:70` | 3 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:77` | 1 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:79` | 1 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:99` | 2 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:100` | 3 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:107` | 1 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:135` | 1 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:139` | 1 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:220` | 1 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:227` | 1 | Historical decisions and verification record; retained for provenance. |
| `NOTES.md:231` | 1 | Historical decisions and verification record; retained for provenance. |
| `README.md:1` | 1 | Current public product name or maintained branding reference. |
| `README.md:3` | 1 | Current public product name or maintained branding reference. |
| `README.md:7` | 3 | Current public product name or maintained branding reference. |
| `README.md:11` | 2 | Current public product name or maintained branding reference. |
| `README.md:13` | 2 | Current public product name or maintained branding reference. |
| `README.md:15` | 2 | Current public product name or maintained branding reference. |
| `README.md:16` | 2 | Current public product name or maintained branding reference. |
| `README.md:59` | 1 | Current public product name or maintained branding reference. |
| `README.md:69` | 1 | Current public product name or maintained branding reference. |
| `README.md:98` | 1 | Current public product name or maintained branding reference. |
| `README.md:99` | 1 | Current public product name or maintained branding reference. |
| `README.md:125` | 1 | Current public product name or maintained branding reference. |
| `README.md:138` | 2 | Current public product name or maintained branding reference. |
| `README.md:184` | 2 | Current public product name or maintained branding reference. |
| `README.md:185` | 1 | Current public product name or maintained branding reference. |
| `README.md:191` | 1 | Current public product name or maintained branding reference. |
| `README.md:192` | 1 | Current public product name or maintained branding reference. |
| `README.md:203` | 1 | Current public product name or maintained branding reference. |
| `README.md:213` | 1 | Current public product name or maintained branding reference. |
| `README.md:217` | 1 | Current public product name or maintained branding reference. |
| `README.md:230` | 1 | Current public product name or maintained branding reference. |
| `README.md:290` | 7 | Current public product name or maintained branding reference. |
| `README.md:292` | 1 | Current public product name or maintained branding reference. |
| `README.md:296` | 1 | Current public product name or maintained branding reference. |
| `SECURITY.md:3` | 1 | Current public product name or maintained branding reference. |
| `SECURITY.md:7` | 3 | Current public product name or maintained branding reference. |
| `SECURITY.md:9` | 1 | Current public product name or maintained branding reference. |
| `SECURITY.md:33` | 1 | Current public product name or maintained branding reference. |
| `SUPPORT.md:20` | 1 | Repository URL or existing image configuration identifier; independent of display name/domain. |
| `docs/CLAIMS.md:7` | 2 | Approved public name/configuration claims and source repository evidence. |
| `docs/CLAIMS.md:20` | 1 | Approved public name/configuration claims and source repository evidence. |
| `docs/CLAIMS.md:21` | 3 | Approved public name/configuration claims and source repository evidence. |
| `docs/CLAIMS.md:35` | 1 | Approved public name/configuration claims and source repository evidence. |
| `docs/DESIGN.md:1` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/DESIGN.md:50` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/SITE_ARCHITECTURE.md:1` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/SITE_ARCHITECTURE.md:9` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/SITE_ARCHITECTURE.md:91` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/SITE_ARCHITECTURE.md:115` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/SITE_ARCHITECTURE.md:139` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/SITE_ARCHITECTURE.md:185` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/SITE_ARCHITECTURE.md:205` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/SITE_ARCHITECTURE.md:210` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/SITE_ARCHITECTURE.md:221` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/SITE_ARCHITECTURE.md:284` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/SITE_ARCHITECTURE.md:364` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/SITE_ARCHITECTURE.md:551` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/SITE_ARCHITECTURE.md:623` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/WEBSITE_APP_INTEGRATION.md:12` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/WEBSITE_APP_INTEGRATION.md:14` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/WEBSITE_APP_INTEGRATION.md:29` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/WEBSITE_APP_INTEGRATION.md:30` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/WEBSITE_APP_INTEGRATION.md:32` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/WEBSITE_APP_INTEGRATION.md:38` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/configuration.md:44` | 1 | Repository URL or existing image configuration identifier; independent of display name/domain. |
| `docs/configuration.md:52` | 2 | Repository URL or existing image configuration identifier; independent of display name/domain. |
| `docs/configuration.md:56` | 1 | Repository URL or existing image configuration identifier; independent of display name/domain. |
| `docs/configuration.md:57` | 1 | Repository URL or existing image configuration identifier; independent of display name/domain. |
| `docs/configuration.md:58` | 1 | Repository URL or existing image configuration identifier; independent of display name/domain. |
| `docs/configuration.md:59` | 1 | Repository URL or existing image configuration identifier; independent of display name/domain. |
| `docs/deployment.md:17` | 1 | Repository URL or existing image configuration identifier; independent of display name/domain. |
| `docs/deployment.md:24` | 1 | Repository URL or existing image configuration identifier; independent of display name/domain. |
| `docs/nav.json:252` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/nav.json:324` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/q1-verification.md:3` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/quickstart.md:18` | 1 | Repository URL or existing image configuration identifier; independent of display name/domain. |
| `docs/release-checklist.md:3` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/release-checklist.md:20` | 1 | Maintained public name in documentation/blueprint or recorded verification; no future rename claimed. |
| `docs/security-model.md:25` | 1 | Repository URL or existing image configuration identifier; independent of display name/domain. |
| `frontend/package.json:8` | 1 | Stable repository package metadata; a display-name change does not move the repository. |
| `website/components/ThemeToggle.tsx:13` | 1 | Current public product name or maintained branding reference. |
| `website/components/ThemeToggle.tsx:16` | 1 | Current public product name or maintained branding reference. |
| `website/components/ThemeToggle.tsx:27` | 1 | Current public product name or maintained branding reference. |
| `website/lib/theme.ts:3` | 1 | Existing browser preference storage key, preserved for compatibility. |
| `website/package.json:8` | 1 | Stable repository package metadata; a display-name change does not move the repository. |

## Additional identity modules and environment examples

The requested extension list does not include `.mjs` or `.env.example`. These newly introduced identity modules and public examples are listed separately so their retained defaults are visible.

| Source line | Reason |
|---|---|
| `website/lib/brand.mjs:1` | Current display-name constant. |
| `website/lib/brand.mjs:2` | Stable GitHub repository URL. |
| `website/lib/brand.mjs:7` | Confirmed current domain/mailbox default; configuration can override it. |
| `website/lib/contacts.mjs:12` | Confirmed current domain/mailbox default; configuration can override it. |
| `website/lib/contacts.mjs:13` | Confirmed current domain/mailbox default; configuration can override it. |
| `website/lib/contacts.mjs:14` | Confirmed current domain/mailbox default; configuration can override it. |
| `frontend/lib/brand.mjs:2` | Current display-name constant. |
| `frontend/lib/brand.mjs:3` | Stable GitHub repository URL. |
| `frontend/lib/brand.mjs:8` | Confirmed current domain/mailbox default; configuration can override it. |
| `website/.env.example:8` | Confirmed current domain/mailbox default; configuration can override it. |
| `website/.env.example:9` | Confirmed current domain/mailbox default; configuration can override it. |
| `website/.env.example:10` | Confirmed current domain/mailbox default; configuration can override it. |
| `website/.env.example:11` | Confirmed current domain/mailbox default; configuration can override it. |
| `frontend/.env.example:2` | Confirmed current domain/mailbox default; configuration can override it. |
