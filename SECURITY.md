# Security

## What this project is

Kinemotif is a static site. There is no server, no database, no API and no account. The studio
is a single HTML file that runs entirely in the browser. It makes no network requests after the
page has loaded.

## Data

Nothing is transmitted. Stories, projects and settings live in `localStorage` for the origin you
opened the file from, and nowhere else. Exported shows are written to your own disk by the
browser's download mechanism.

## Reporting a vulnerability

If you find a security issue — an XSS vector through imported project files, a way to make the
studio execute injected content, or anything that leaks data off the device — please open a
private security advisory on this repository rather than a public issue.

Include the browser and version, the steps to reproduce, and what you expected instead. You will
get a response within a few days.

## Scope

In scope:

- Cross-site scripting through `.kinemotif.json` or an exported `.html` file opened in the studio
- Any code path that sends user content to a remote host
- Denial of service through a malformed project file

Out of scope:

- The absence of content security policy headers on GitHub Pages (a hosting property, not ours)
- Anything requiring the user to run untrusted code outside the browser

## Design note

Project files are parsed with `JSON.parse` and the result is used only as data — it is never
evaluated, and no field is interpolated into HTML. The renderer draws text with
`CanvasRenderingContext2D.fillText`, which does not interpret markup.
