# Grant Type

In their **Grant Types** page, they explicitly state:

> "Due to growing security concerns we do not support this grant type. With OAuth 2.1 it looks like this grant will be removed."
>
> - [Ref](https://zitadel.com/docs/apis/openidoauth/grant-types#resource-owner-password-credentials).

**ZITADEL does not support this grant type. Period.** That's why you get `unsupported_grant_type` / `password not supported` if you try it.

## Auth.js

Full Auth.js Proxy. `ZitadelModule` has a `ZitadelController` that proxies all `/auth/*` routes through Auth.js (`@auth/core`) which handles the proper **Authorization Code + PKCE** flow. This is the correct, ZITADEL-supported approach. The middleware converts Express requests to Web API Requests, passes them to `Auth()`, and converts back.

Authentication should flow through Auth.js's browser-based OAuth flow:

- **Frontend** → redirects to `/auth/signin/zitadel` (or your custom login page).
- **Auth.js** → redirects to ZITADEL's authorization endpoint (Authorization Code + PKCE).
- **ZITADEL** → shows its login page, user enters email/password there.
- **ZITADEL** → redirects back to `/auth/callback/zitadel` with an authorization code.
- **Auth.js** → exchanges code for tokens, sets session cookie.
- **Frontend** → can now call `/auth/session` to get the session, or the GraphQL `whoAmI` query.

### IdP Swappability

- Auth.js supports dozens of providers — changing from ZITADEL to Keycloak/Auth0/Okta is just swapping the provider config in `createAuthConfig()`.
- Your app never touches raw OIDC endpoints directly (except refresh, which is standard).
- The session management is abstracted by Auth.js.
