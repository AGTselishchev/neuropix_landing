# Security notes

This is a static GitHub Pages project. Every file committed to the repository
and every value delivered to browser JavaScript must be treated as public.

## Never commit

- passwords, access tokens or API keys;
- OAuth client secrets or service-account JSON files;
- private customer photos or production exports containing personal data.

The Google Apps Script URL and spreadsheet ID used by the form are public
identifiers. Abuse protection and validation therefore live in `apps-script/Code.gs`.

## Public demonstration data

The connected demonstration spreadsheet is readable by anyone who has its
link. Do not submit real names, contacts or confidential descriptions while
that sharing mode is enabled. A production sheet must be private and shared
only with the operators who process requests.

## Production recommendations

For a real service, put the form behind a server-side CAPTCHA or an edge
function with stronger IP-based rate limiting. GitHub Pages cannot keep a
server secret in frontend code.
