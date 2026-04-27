# Auth0 Login Template

This folder contains Auth0 login templates for RoRadar.

## Files

- [universal-login-template.html](./universal-login-template.html)
- [classic-login-page.html](./classic-login-page.html)

## What it is

`universal-login-template.html` is for **Universal Login page templates**.

`classic-login-page.html` is for **Classic Login customization with Lock**.

## How to use it

If your Auth0 dashboard is rendering the hosted Lock form directly, use [classic-login-page.html](./classic-login-page.html).

If your Auth0 dashboard is using Universal Login page templates with `{%- auth0:widget -%}`, use [universal-login-template.html](./universal-login-template.html).

Official Auth0 docs for this feature:

- Customize Universal Login Page Templates: https://auth0.com/docs/customize/universal-login-pages/universal-login-page-templates
- Customize Classic Login Pages: https://auth0.com/docs/universal-login/advanced-customization

## Important Auth0 requirement

For `classic-login-page.html`, Auth0's docs describe Classic Login as a customizable hosted page that uses JavaScript and inline CSS, often with Lock. Auth0 also notes that if you fully customize a Classic page, you are responsible for maintaining that page and the library versions it uses.

## Branding notes

The template currently references RoRadar assets hosted at:

- `https://roradar.vercel.app/branding/roradar-mark.png`
- `https://roradar.vercel.app/branding/roradar-wordmark.png`

If you want those assets served from another domain later, replace the URLs in the HTML file.

## Design direction

This template was built to match the live RoRadar application:

- deep charcoal background
- electric blue primary accent
- glassy card surfaces
- soft radial glows
- rounded security-product layout

It also borrows layout inspiration from a 21st.dev auth-card pattern, then adapts it into a static Auth0-compatible template instead of a React component.
