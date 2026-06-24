# Domain Plan Contribution: security-minion

## Recommendations

### (a) innerHTML Usage Pattern -- Qualified Acceptance with Caveats

The `innerHTML` usage in `header.js` (line 31), `footer.js` (line 17), and `fragment.js` (line 26) follows a consistent pattern: `fetch()` a `.plain.html` endpoint, then assign the response text to `innerHTML` of a freshly created, unattached DOM element.

**Risk assessment: LOW (Informational) -- accept as standard EDS practice, with documentation.**

The threat model for this pattern depends on two factors:

1. **Content origin trust**: The `.plain.html` endpoints resolve to same-origin paths (e.g., `/nav.plain.html`, `/footer.plain.html`). In AEM Edge Delivery Services, this content is served by the EDS CDN from Document Authoring (DA) at `content.da.live` (confirmed by `fstab.yaml` line 3). The content pipeline is: author edits in DA -> content synced to EDS CDN -> served as `.plain.html`. This is *author-controlled content*, not user-generated content. The trust boundary is the DA authoring environment, not the end user.

2. **Same-origin enforcement**: The `fetch()` calls use relative paths (`${navPath}.plain.html`), so they are bound by the same-origin policy. There is no mechanism for an external attacker to inject content into these responses without first compromising the DA authoring environment or the CDN.

**However, there are residual risks worth documenting:**

- **Compromised author account**: If a DA author account is compromised, an attacker could inject malicious HTML/JS into nav, footer, or fragment content. This would be rendered via `innerHTML` without sanitization. This is an accepted risk in any CMS-backed system -- the mitigation is DA account security (MFA, access control), not client-side sanitization.
- **`readBlockConfig` path override**: In `header.js` line 24 and `footer.js` line 12, the nav/footer path comes from `readBlockConfig(block)` which reads from the block's DOM content. Since this DOM content is also author-sourced (not user-sourced), this is not an exploitable vector. But note that `readBlockConfig` extracts `href` attributes from `<a>` tags (see `aem.js` lines 220-226), meaning the fetch path could theoretically be any URL the author puts in the block config. This is by design in EDS.
- **Fragment path from link href**: In `fragment.js` lines 46-47, the path is extracted from either an `<a>` href or the block's text content. The guard on line 22 (`path.startsWith('/') && !path.startsWith('//')`) prevents protocol-relative URLs and requires a root-relative path, which effectively limits fetches to same-origin. This is a good defensive pattern.

**Recommendation: Accept as standard EDS practice. No code changes needed. Document the trust model in a security notes section of the review report.**

### (b) dapreview.js -- Medium Concern, Requires Conditional Loading Guard

`/Users/ben/github/benpeter/da-schamdan/scripts/dapreview.js` (3 lines):

```javascript
const defined = new URLSearchParams(window.location.search).get('dapreview');
export default defined ? import('https://da.live/scripts/dapreview.js') : undefined;
```

This pattern conditionally imports and executes a remote script from `da.live` based solely on the presence of a `?dapreview` query parameter. This is loaded in *every page load* via `scripts.js` line 74:

```javascript
const daPreview = (await import(`${import.meta.url.replace('scripts.js', 'dapreview.js')}`)).default;
if (daPreview) await daPreview;
```

**Risk assessment: MEDIUM**

**Concerns:**

1. **Any visitor can trigger remote script loading**: Appending `?dapreview=anything` to any page URL causes the browser to fetch and execute `https://da.live/scripts/dapreview.js`. This is a third-party script from Adobe's DA platform. While `da.live` is a trusted Adobe domain, the loading is unconditional -- there is no authentication check, no origin check, no environment check.

2. **Supply chain risk**: If `da.live` is ever compromised, or if the script at that URL changes behavior, every page visit with `?dapreview` in the URL executes attacker-controlled code. The script is fetched at runtime with no integrity hash (no SRI). An attacker who can trick users into clicking a link with `?dapreview` in the URL gets the script executed in the page context.

3. **Production exposure**: This is a development/preview feature that is active in production. There is no guard limiting it to non-production environments (e.g., checking `window.location.hostname` against known dev/staging hosts).

**Recommendations:**

- **Restrict to non-production environments**: Add a hostname check so `dapreview` only activates on `localhost`, `*.hlx.page`, or `*.aem.page` -- not on `schamdan.de`. Example:

```javascript
const isPreviewEnv = ['localhost', '.hlx.page', '.hlx.live', '.aem.page', '.aem.live']
  .some((h) => window.location.hostname.endsWith(h) || window.location.hostname === 'localhost');
const defined = isPreviewEnv && new URLSearchParams(window.location.search).get('dapreview');
export default defined ? import('https://da.live/scripts/dapreview.js') : undefined;
```

- **Add Subresource Integrity (SRI)**: If the script must remain loadable in production, pin it with an integrity hash. However, this is impractical for a dynamically updated preview script, so the environment guard is the preferred mitigation.

- **Note**: This is a standard DA (Document Authoring) pattern used across EDS sites. The risk is accepted across the EDS ecosystem. However, for a security review, it is correct to flag it and recommend the environment guard.

### (c) External Link Handling in delayed.js -- Correctly Implemented

`/Users/ben/github/benpeter/da-schamdan/scripts/delayed.js` lines 9-19:

```javascript
function isLocal(a) {
  return window.location.hostname === a.hostname || !a.hostname.length;
}

document.querySelectorAll('a').forEach((a) => {
  if (!isLocal(a)) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
});
```

**Risk assessment: LOW (Informational) -- correctly implemented.**

**Analysis:**

- `noopener` prevents the opened page from accessing `window.opener`, mitigating tabnabbing attacks. Correctly applied.
- `noreferrer` prevents the Referer header from being sent to the external site, which is a privacy enhancement. Correctly applied.
- The `isLocal` check correctly identifies same-origin links (hostname match) and relative links (empty hostname). This is sound.

**Minor observations (not security issues):**

- This runs after a 3-second delay (`scripts.js` line 120: `window.setTimeout(() => import('./delayed.js'), 3000)`). Links that are dynamically added after this script runs (e.g., from lazy-loaded blocks) will not have the `noopener noreferrer` treatment. For this site, this is unlikely to matter since all content is loaded within the initial page lifecycle, but it is worth noting for future development.
- The pattern only processes links that exist in the DOM at execution time. Fragment blocks loaded via `loadFragment()` happen in `loadSections()` which completes before `loadDelayed()` is called, so fragments are covered.

**Recommendation: No changes needed. The implementation is correct and follows best practices.**

### (d) readBlockConfig Usage Pattern -- Accept as Standard EDS Practice

`readBlockConfig` in `/Users/ben/github/benpeter/da-schamdan/scripts/aem.js` lines 211-247 reads configuration from the block's DOM structure (key-value pairs from a two-column div layout). It extracts:
- Text content (via `textContent`)
- Link hrefs (via `a.href`)
- Image sources (via `img.src`)

**Risk assessment: LOW -- standard EDS pattern, no user input vector.**

The block config DOM is authored content delivered through the EDS content pipeline. It is not populated by user input (e.g., query parameters, form submissions, or URL fragments). The data flow is: DA authoring -> EDS CDN -> HTML -> `readBlockConfig` parses DOM -> values used as paths or display text.

The values extracted by `readBlockConfig` flow into:
- `header.js`: `cfg.nav` used as a fetch path (line 24). Mitigated by same-origin fetch.
- `footer.js`: `cfg.footer` used as a fetch path (line 12). Same mitigation.
- `aem.js` `decorateSections`: Section metadata values set as `dataset` properties or CSS classes (lines 516-527). The `toClassName` function (line 186-193) sanitizes values to `[0-9a-z-]` before use as class names, which prevents injection via CSS class names.

**Recommendation: Accept as standard EDS practice. The `toClassName` sanitization for CSS classes is adequate. The fetch path usage is safe given same-origin constraints.**

---

## Additional Security Findings

### [INFORMATIONAL] No Content Security Policy (CSP) Headers

**Location**: `/Users/ben/github/benpeter/da-schamdan/head.html` -- no CSP meta tag present.

**Description**: The site has no Content Security Policy configured. In AEM Edge Delivery Services, HTTP headers are typically configured at the CDN/Edge level (not in the application code), so this may be handled externally. However, no CSP meta tag fallback exists.

**Impact**: Without CSP, if an XSS vulnerability is ever introduced (e.g., through a compromised DA account injecting a `<script>` tag into authored content), there is no browser-level defense to prevent script execution.

**Remediation**: Configure CSP at the EDS CDN level. At minimum, a reporting-only CSP would provide visibility. A meta tag in `head.html` could serve as a fallback:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://da.live https://ot.aem.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://ot.aem.live https://content.da.live;">
```

Note: The `da.live` import in `dapreview.js` and the `ot.aem.live` RUM endpoint would need to be allowlisted. The `'unsafe-inline'` for styles is needed because EDS uses inline styles for section visibility control.

### [INFORMATIONAL] Missing Security Headers in head.html

**Location**: `/Users/ben/github/benpeter/da-schamdan/head.html`

**Description**: The `head.html` file contains no security-related meta tags. While EDS controls most HTTP headers at the CDN level, the following should be verified in the deployed site's response headers:
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (or `SAMEORIGIN`)
- `Referrer-Policy`
- `Permissions-Policy`

**Remediation**: Verify these headers are set at the EDS CDN level. If not, file a request with Adobe/EDS infrastructure to configure them.

### [LOW] innerHTML in speisen.js with Regex-Extracted Content

**Location**: `/Users/ben/github/benpeter/da-schamdan/blocks/speisen/speisen.js` lines 80-81

```javascript
sizesEl.innerHTML = matches.map((m) => `<p>${m[1]}</p>`).join('');
pricesEl.innerHTML = matches.map((m) => `<p>${m[2]}</p>`).join('');
```

**Description**: The `PRICE_RE` regex (`/^(.+?)\s+(\d[\d,.]*\s*\u20ac)$/`) captures groups from text content and interpolates them into HTML via template literals assigned to `innerHTML`. The capture group `m[1]` (the label/size) accepts any characters before a space+price pattern.

**Impact**: If an author writes content where the label portion of a price line contains HTML special characters (e.g., `<script>alert(1)</script> 3,50 EUR`), it would be rendered as HTML. However, this requires a compromised or malicious author, and the regex is fairly restrictive (requires the string to end with a `\d[\d,.]*\s*EUR` pattern).

**Remediation**: Use `textContent` instead of `innerHTML` for these interpolations, or apply HTML encoding:

```javascript
const escapeHTML = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
sizesEl.innerHTML = matches.map((m) => `<p>${escapeHTML(m[1])}</p>`).join('');
pricesEl.innerHTML = matches.map((m) => `<p>${escapeHTML(m[2])}</p>`).join('');
```

Also applies to `headerCellHTML` function (lines 20-28) where `rest` (plain text) is interpolated into HTML without encoding on line 27: `if (rest) html += `<p>${rest}</p>`;`

### [LOW] innerHTML in cards.js with row.innerHTML

**Location**: `/Users/ben/github/benpeter/da-schamdan/blocks/cards/cards.js` line 8

```javascript
li.innerHTML = row.innerHTML;
```

**Description**: This copies HTML from one DOM element to another via `innerHTML`. Since both elements are from author-controlled EDS content, this is a DOM-to-DOM copy, not an injection of external data. The risk profile is identical to the header/footer pattern.

**Recommendation**: Accept as standard EDS pattern. No change needed.

### [INFORMATIONAL] 404 Page Referrer Handling

**Location**: `/Users/ben/github/benpeter/da-schamdan/404.html` lines 17-26

```javascript
if (document.referrer) {
  const { origin, pathname } = new URL(document.referrer);
  if (origin === window.location.origin) {
    const backBtn = document.createElement('a');
    backBtn.href = pathname;
    backBtn.textContent = 'Go back';
```

**Analysis**: This correctly checks that the referrer is same-origin before creating the back button, and uses `pathname` (not the full URL) for the href. The link text is hardcoded, not derived from user input. This is properly implemented with no XSS or open redirect risk.

### [INFORMATIONAL] No Lock File Verification

**Location**: `/Users/ben/github/benpeter/da-schamdan/package.json`

**Description**: The project has dev dependencies (`@babel/eslint-parser`, `eslint`, `stylelint`, etc.) but these are development-only tools. The production site has zero runtime npm dependencies -- it is a purely static frontend with vanilla JS. This is an excellent security posture for supply chain risk.

**Note**: The `package-lock.json` should be committed and present (verify it is tracked in git). The `.gitignore` does not exclude it, which is correct.

---

## Proposed Tasks

### Task 1: Document Security Trust Model for EDS innerHTML Pattern
- **What**: Create a brief security trust model document explaining why `innerHTML` from same-origin `.plain.html` fetches is accepted, what the trust boundary is (DA authoring environment), and what compensating controls exist.
- **Deliverable**: Section in the review report documenting the accepted risk with rationale.
- **Dependencies**: None.

### Task 2: Harden dapreview.js with Environment Guard
- **What**: Add a hostname check to `/Users/ben/github/benpeter/da-schamdan/scripts/dapreview.js` so the `da.live` script import only activates on preview/development environments, not on the production `schamdan.de` domain.
- **Deliverable**: Updated `dapreview.js` with environment guard. Unit test verifying behavior.
- **Dependencies**: Need to confirm the list of valid preview hostnames (typically `localhost`, `*.hlx.page`, `*.hlx.live`, `*.aem.page`, `*.aem.live`).

### Task 3: Add HTML Encoding to speisen.js Template Literal Interpolations
- **What**: Apply HTML entity encoding to the regex capture groups before interpolating into `innerHTML` in `/Users/ben/github/benpeter/da-schamdan/blocks/speisen/speisen.js` lines 27, 80-81, and the `headerCellHTML` function.
- **Deliverable**: Updated `speisen.js` with `escapeHTML` utility applied to interpolated text.
- **Dependencies**: None. Should include test updates if speisen tests exist.

### Task 4: Verify Deployed Security Headers
- **What**: Run a security header scan against the deployed `schamdan.de` site to verify CSP, HSTS, X-Content-Type-Options, X-Frame-Options, and Referrer-Policy are properly configured at the EDS CDN level.
- **Deliverable**: Findings table of present/missing headers with remediation recommendations.
- **Dependencies**: Requires the site to be deployed and accessible. This is a runtime check, not a code review task.

### Task 5: Compile Security Findings into Review Report
- **What**: Consolidate all findings into a structured security review report following the standard format (severity, location, description, impact, remediation).
- **Deliverable**: Security review section of the comprehensive code review report.
- **Dependencies**: Tasks 1-4.

---

## Risks and Concerns

### Risk 1: dapreview.js as a Social Engineering Vector
**Likelihood**: Low. **Impact**: High.
An attacker could craft a URL like `https://schamdan.de/?dapreview=1` and distribute it. While the loaded script from `da.live` is Adobe-controlled and benign, the pattern of loading external scripts based on URL parameters sets a precedent that could be exploited if copied to other parameters or domains. If `da.live` were ever compromised or served malicious content, all visitors clicking such links would execute the payload.

### Risk 2: No CSP Reduces Defense-in-Depth Against Compromised Author Content
**Likelihood**: Very Low. **Impact**: High.
Without CSP, a compromised DA author account could inject `<script>` tags into authored content (nav, footer, fragments, page body) that would execute in every visitor's browser. CSP is the last line of defense against this class of attack.

### Risk 3: Delayed External Link Processing Creates a Window
**Likelihood**: Very Low. **Impact**: Low.
The 3-second delay before `delayed.js` runs means there is a brief window where external links do not have `noopener noreferrer`. If a user clicks an external link within the first 3 seconds of page load, the opened page could access `window.opener`. In practice, this is extremely unlikely for a restaurant site, but the pattern should be noted for completeness.

### Risk 4: innerHTML Patterns Are Safe Only Under Current Architecture
**Likelihood**: N/A (architectural concern). **Impact**: Medium if violated.
The security of all `innerHTML` usage depends on the invariant that `.plain.html` content comes exclusively from the trusted DA authoring pipeline. If the architecture ever changes to allow user-generated content, API-sourced content, or third-party content to flow through these same paths, the `innerHTML` usage becomes an XSS vector. This invariant should be documented and enforced.

---

## Additional Agents Needed

**infrastructure/deployment specialist**: To verify the deployed security headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy) at the EDS CDN level. The code review can identify the absence of these in application code, but verifying they are set at the infrastructure level requires inspecting the live deployment. If an **iac-minion** or **observability-minion** is available, they should run the header verification task (Task 4).

Otherwise, the current team is sufficient for the code-level security review.
