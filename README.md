# THE CRAZY NIGHT

> Everyone has that one crazy night. We don't talk about ours.

A non-profit, invite-by-spirit drinking society in Singapore. Static landing page for
**thatcrazynight.com** — the manifesto, the code, the crawl, and the door (application form).

No build step. No backend. Plain HTML / CSS / JS, deployed on Cloudflare Pages,
applications handled by a hosted form backend (Web3Forms).

---

## Stack

| Piece | Choice | Cost |
|---|---|---|
| Hosting | Cloudflare Pages (auto-deploy from this repo) | $0 |
| Form backend | [Web3Forms](https://web3forms.com) (form posts to their endpoint) | $0 |
| Domain | thatcrazynight.com | ~$10/yr |

---

## Files

```
index.html    — the whole page
styles.css    — design tokens + all styling ("The Record": warm dark, oxblood stamp)
script.js     — load/scroll motion, the stamp press, form submit handling
favicon.svg   — the stamp mark
```

The look is token-driven — every colour lives in `:root` at the top of `styles.css`,
so the whole site can be re-themed by editing a handful of variables.

---

## 1 — Wire the application form (required before it works)

The form posts to **Web3Forms**. It needs an access key:

1. Go to <https://web3forms.com>, enter the email where you want applications to land,
   and copy the **Access Key**.
2. In `index.html`, find:
   ```html
   <input type="hidden" name="access_key" value="YOUR_WEB3FORMS_ACCESS_KEY" />
   ```
   and paste your key in place of `YOUR_WEB3FORMS_ACCESS_KEY`.
3. Done. Submissions email you and can be piped to a Google Sheet from the Web3Forms
   dashboard (your curation board — add columns: `Accepted?`, `Gender`, `Referred by`, `Night #`).

Until the key is set, the form intentionally falls back to a native submit so it's
obvious during setup that it isn't keyed yet.

## 2 — Deploy on Cloudflare Pages (auto-build on push)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Pick this repo.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
4. Save & deploy. Every `git push` to the default branch auto-deploys.
5. Add the custom domain `thatcrazynight.com` under the project's **Custom domains** tab.

## 3 — The QR

Generate a QR pointing to `https://thatcrazynight.com` and drop it where the right
people are. It routes to this page → the application. Replace the placeholder frame in
the "Door" section with the QR image when ready.

---

## Upkeep

- Bump the night number after each night: edit `var NIGHT = "001";` in `script.js`.
- That's it.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
