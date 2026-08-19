# Google Apps Script

`Code.gs` is the server-side handler for the contact form. After changing it in
Apps Script, create a new web-app deployment version; an existing deployment
does not update until a new version is selected.

The endpoint and spreadsheet ID are public identifiers, not credentials. Never
put OAuth client secrets, service-account JSON, access tokens or passwords in
this repository.
