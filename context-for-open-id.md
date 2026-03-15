# Recommended authorization flows with OpenID Connect (OIDC) and OAuth 2.x

Introduction
In this guide we will go over some basics on how to obtain an authorization with OpenID Connect 1.x and OAuth 2.x.

ZITADEL does not make assumptions about the application type you are about to integrate. Therefore, you must qualify and define an appropriate method for your users to gain authorization to access your application (“authentication flow”). Your choice depends on the application’s ability to maintain the confidentiality of client credentials and the technological capabilities of your application. If you choose a deprecated or unfeasible flow to obtain authorization for your application, your users’ credentials may be compromised.

We invite you to further explore the different authorization flows in the OAuth 2.x standard. For the start we assume that you have a brand-new application (i.e. without legacy requirements) and you found a reliable SDK/Library that does the heavy lifting for you.

So this module will only go over the basics and explain why we recommend the flow “Authorization Flow with PKCE” as default for most applications. We will also cover the case of machine-to-machine communication, i.e. where there is no interactive login. Further we will guide you to further reading viable alternatives, if the default flow is not feasible.

Basics of Federated Identity
Although Federated Identities are not a new concept (RFC 6749, “The OAuth 2.0 Authorization Framework” was released in 2012) it is important to highlight the difference between the traditional client-server authentication model and the concept of delegated authorization and authentication.

The aforementioned RFC provides us with some problems and limitations of the client-server authentication, where a client requests a protected resource on the server by authenticating with the user’s credentials:

Applications need to store users credentials (eg, password) for future use; compromise of any application results in compromise of the end-users credentials
Servers are required to support password authentication
Without means of limiting scope when providing the user’s credentials, the application gains overly broad access to protected resources
Users cannot revoke access for a single application, but only for all by changing credentials
So what do we want to achieve with delegated authentication?

Instead of implementing authentication on each server and trusting each server

Users only authenticate with a trusted server (i.e. ZITADEL), that validates the user’s identity through a challenge (eg, multiple authentication factors) and issues an ID token (OpenID Connect 1.x)
Applications have means of validating the integrity of presented access and ID tokens
Instead of sending around the user’s credentials

Clients may access protected resources with an access token that is only valid for specific scope and limited lifetime (OAuth 2.x)
Users have to authorize applications to access certain scopes (eg, email address or custom roles). Applications can request claims (key:value pairs, e.g. email address) for the authorized scopes with the access token or ID token from ZITADEL
Access tokens are bearer tokens, meaning that possession of the token provides access to a resource. But the tokens expire frequently and the application must request a new access token via refresh token or the user must reauthenticate

This is where the so-called “flows” come into play: There are a number of different flows on how to handle the process from authentication, over authorization, getting tokens and requesting additional information about the user.

Maybe interesting to mention is that we are mostly concerned with choosing the right OAuth 2.x flows (alas “authorization”). OpenID Connect extends the OAuth 2.x flow with useful features like endpoint discovery (where to ask), ID Token (who is the user, when and how did she authenticate), and UserInfo Endpoint (getting additional information about the user).

Different client profiles
As mentioned in the beginning of this module, there are two main determinants for choosing the optimal authorization flow:

Client’s ability to maintain the confidentiality of client credentials
Technological limitations
OAuth 2.x defines two client types based on their ability to maintain the confidentiality of their client credentials:

Confidential: Clients capable of maintaining the confidentiality of their credentials (e.g., client implemented on a secure server with restricted access to the client credentials), or capable of secure client authentication using other means.
Public: Clients incapable of maintaining the confidentiality of their credentials (e.g., clients executing on the device used by the resource owner, such as an installed native application or a web browser-based application), and incapable of secure client authentication via any other means.
The following table gives you a brief overview of different client profiles.

<table>
  <thead>
    <tr>
      <th>Confidentiality of client credentials</th>
      <th>Client profile</th>
      <th>Examples of clients</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="2">Public</td>
      <td>User-Agent</td>
      <td>Single-page web applications (SPA), generally JavaScript executed in Browser</td>
    </tr>
    <tr>
      <td>Native</td>
      <td>Native, Mobile, or Desktop applications</td>
    </tr>
    <tr>
      <td rowspan="2">Confidential</td>
      <td>Web</td>
      <td>Server-side web applications such as java, .net, ...</td>
    </tr>
    <tr>
      <td>Machine-to-Machine</td>
      <td>APIs, generally services without direct user-interaction at the authorization server</td>
    </tr>
  </tbody>
</table>

Our recommended authorization flows
We recommend using the flow “Authorization Code with Proof Key of Code Exchange (PKCE)” (RFC7636) for User-Agent, Native, and Web clients.

If you don’t have any technical limitations, you should favor the flow Authorization Code with PKCE over other methods. The PKCE part makes the flow resistant against authorization code interception attack as described well in RFC7636.

So what about APIs?

We recommend using “JWT bearer token with private key” (RFC7523) for Machine-to-Machine clients.

What this means is that you have to send an JWT token, containing the standard claims for access tokens and that is signed with your private key, to the token endpoint to request the access token. We will see how this works in another module about Service Accounts.

If you don’t have any technical limitations, you should prefer this method over other methods.

A JWT with a private key can also be used with client profile web to further enhance security.

In case you need alternative flows and their advantages and drawbacks, there will be a module to outline more methods and our recommended fallback strategy per client profile that are available in ZITADEL.

# Authenticate users with OpenID Connect

Overview
This guide will show you how to use ZITADEL to login users into your application (authentication). It will guide you step-by-step through the basics and point out on how to customize process.

OIDC / OAuth Flow
OAuth and therefore OIDC know three different application types:

Web (Server-side web applications such as java, .net, ...)
Native (native, mobile or desktop applications)
User Agent (single page applications / SPA, generally JavaScript executed in the browser)
Depending on the app type you're trying to register, there are small differences. But regardless of the app type we recommend using Proof Key for Code Exchange (PKCE).

Please read the following guide about the different-client-profiles and why to use PKCE.

Code Flow
For a basic understanding of OAuth and its flows, we'll briefly describe the most important flow: Authorization Code.

The following diagram demonstrates a basic authorization_code flow:

1. When an unauthenticated user visits your application,
2. you will create an authorization request to the authorization endpoint.
3. The Authorization Server (ZITADEL) will send an HTTP 302 to the user's browser, which will redirect them to the login UI.
4. The user will have to authenticate using the demanded auth mechanics.
5. Your application will be called on the registered callback path (redirect_uri) and be provided an authorization_code.
6. This authorization_code must then be sent together with you applications authentication (client_id + client_secret) to the token_endpoint
7. In exchange the Authorization Server (ZITADEL) will return an access_token and if requested a refresh_token and in the case of OIDC an id_token as well
8. The access_token can then be used to call a Resource Server (API). The token will be sent as Authorization Header.

This flow is the same when using PKCE or JWT with Private Key for authentication.

Create Application
To create an application, open your project in Management Console and start by clicking on the "New" button in the Application section.

Application type
This will start a wizard asking you for an application name and a type.

# OpenID Connect Endpoints in ZITADEL

OpenID Connect 1.0 Discovery
The OpenID Connect Discovery Endpoint is located within the issuer domain. This would give us ${CUSTOM_DOMAIN}/.well-known/openid-configuration.

Link to spec. OpenID Connect Discovery 1.0 incorporating errata set 1

authorization_endpoint
${CUSTOM_DOMAIN}/oauth/v2/authorize

The authorization_endpoint is located with the login page, due to the need of accessing the same cookie domain

The authorization_endpoint is the starting point for all initial user authentications. The user agent (browser) will be redirected to this endpoint to authenticate the user in exchange for an authorization_code (authorization code flow) or tokens (implicit flow).

Required request parameters

<table>
  <thead>
    <tr>
      <th>Parameter</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>client_id</code></td>
      <td>The id of your client as shown in Console.</td>
    </tr>
    <tr>
      <td><code>redirect_uri</code></td>
      <td>
        Callback uri of the authorization request where the code or tokens will be sent to.
        Must match exactly one of the preregistered in Console.
      </td>
    </tr>
    <tr>
      <td><code>response_type</code></td>
      <td>
        Determines whether a <code>code</code>, <code>id_token token</code> or just
        <code>id_token</code> will be returned. Most use cases will need <code>code</code>.
        See flow guide for more info.
      </td>
    </tr>
    <tr>
      <td><code>scope</code></td>
      <td>
        <code>openid</code> is required, see Scopes for more possible values.
        Scopes are space delimited, e.g. <code>openid email profile</code>
      </td>
    </tr>
  </tbody>
</table>

Following the OIDC Core 1.0 specs whenever an access_token is issued, the id_token will not contain any claims of the scopes profile, email, phone and address.

Send the access_token to the userinfo_endpoint or introspection_endpoint the retrieve these claims or set the id_token_userinfo_assertion Option ("User Info inside ID Token" in Management Console) to true.

Depending on your authorization method you will have to provide additional parameters or headers:

no additional parameters required

Additional parameters

<table>
  <thead>
    <tr>
      <th>Parameter</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>id_token_hint</code></td>
      <td>
        Valid <code>id_token</code> (of an existing session) used to identify the subject.
        SHOULD be provided when using <code>prompt none</code>.
      </td>
    </tr>
    <tr>
      <td><code>login_hint</code></td>
      <td>
        A valid logon name of a user. Will be used for username inputs or preselecting a user on
        <code>select_account</code>. Be sure to encode the hint correctly using url encoding
        (especially when using <code>+</code> or alike in the loginname).
      </td>
    </tr>
    <tr>
      <td><code>max_age</code></td>
      <td>Seconds since the last active successful authentication of the user</td>
    </tr>
    <tr>
      <td><code>nonce</code></td>
      <td>
        Random string value to associate the client session with the ID Token and for replay attacks
        mitigation. MUST be provided when using implicit flow.
      </td>
    </tr>
    <tr>
      <td><code>prompt</code></td>
      <td>
        If the Auth Server prompts the user for (re)authentication.
        <br><br>
        no prompt: the user will have to choose a session if more than one session exists
        <br>
        <code>none</code>: user must be authenticated without interaction, an error is returned otherwise
        <br>
        <code>login</code>: user must reauthenticate / provide a user name
        <br>
        <code>select_account</code>: user is prompted to select one of the existing sessions or create a new one
        <br>
        <code>create</code>: the registration form will be displayed to the user directly
      </td>
    </tr>
    <tr>
      <td><code>state</code></td>
      <td>
        Opaque value used to maintain state between the request and the callback. Used for
        Cross-Site Request Forgery (CSRF) mitigation as well, therefore highly recommended.
      </td>
    </tr>
    <tr>
      <td><code>ui_locales</code></td>
      <td>
        Spaces delimited list of preferred locales for the login UI, e.g. <code>de-CH de en</code>.
        If none is provided or matches the possible locales provided by the login UI, the
        <code>accept-language</code> header of the browser will be taken into account.
      </td>
    </tr>
    <tr>
      <td><code>response_mode</code></td>
      <td>
        The mechanism to be used for returning parameters to the application. See response modes
        for valid values. Invalid values are ignored.
      </td>
    </tr>
  </tbody>
</table>

Response modes

ZITADEL supports the following response_mode values. When no response mode is requested, the response mode is chosen based on the configured Response Type of the application. As per OpenID Connect Core 1.0, Section 3.1.2.1:

The use of this parameter is NOT RECOMMENDED when the Response Mode that would be requested is the default mode specified for the Response Type.

<table>
  <thead>
    <tr>
      <th>Response Mode</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>query</code></td>
      <td>
        Encode the returned parameters in the URL query string. This is the default when the
        Response type is <code>code</code>, for example Web applications.
      </td>
    </tr>
    <tr>
      <td><code>fragment</code></td>
      <td>
        Encode the returned parameters in the URL fragment. This is the default when the Response
        Type is <code>id_token</code>, for example implicit User Agent apps. This mode will not work
        for server-side applications, because fragments are never sent by the browser to the server.
      </td>
    </tr>
    <tr>
      <td><code>form_post</code><sup>1</sup></td>
      <td>
        ZITADEL serves a small JavaScript to the browser which will send the returned parameters to
        the <code>redirect_uri</code> using HTTP POST. This mode only works for server-side
        applications and user agents which support / allow JavaScript.
      </td>
    </tr>
  </tbody>
</table>

Successful code response

When your response_type was code and no error occurred, the following response will be returned:

<table>
  <thead>
    <tr>
      <th>Property</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>code</code></td>
      <td>Opaque string which will be necessary to request tokens on the token endpoint</td>
    </tr>
    <tr>
      <td><code>state</code></td>
      <td>Unmodified <code>state</code> parameter from the request</td>
    </tr>
  </tbody>
</table>

[ZITADEL Docs](https://zitadel.com/docs)

[ZITADEL Docs](https://zitadel.com/docs)

Search
`⌘` `K`
ZITADEL Docs (Latest)v4.12v4.11v4.10

Get Started

[Quick Start Guide](https://zitadel.com/docs/guides/start/quickstart)

Key Concepts

Authenticate Users

Example Applications

Use Cases

Onboard Customers and Users

Branding & Customization

Integrate & Authenticate

OIDC & OAuth Flows

[Recommended authorization flows](https://zitadel.com/docs/guides/integrate/login/oidc/oauth-recommended-flows) [OIDC Code Flow + PKCE](https://zitadel.com/docs/guides/integrate/login/oidc/login-users) [Device Authorization Flow](https://zitadel.com/docs/guides/integrate/login/oidc/device-authorization) [OpenID Connect Endpoints](https://zitadel.com/docs/apis/openidoauth/endpoints) [Authentication Methods](https://zitadel.com/docs/apis/openidoauth/authn-methods) [Scopes](https://zitadel.com/docs/apis/openidoauth/scopes) [Claims](https://zitadel.com/docs/apis/openidoauth/claims) [Grant Types](https://zitadel.com/docs/apis/openidoauth/grant-types) [OIDC Playground](https://zitadel.com/docs/apis/openidoauth/authrequest) [Web Keys](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys) [Token Exchange](https://zitadel.com/docs/guides/integrate/token-exchange)

SAML

API Access

SDKs & Integrations

[SCIM](https://zitadel.com/docs/guides/manage/user/scim2)

[Token Introspection](https://zitadel.com/docs/guides/integrate/token-introspection)

[Back-Channel Logout](https://zitadel.com/docs/guides/integrate/back-channel-logout)

External Integrations

Build your own Login UI

Actions

Migrate

Configure Identity & Policies

Test & Debug

Deploy & Operate

Architecture & Concepts

Product, Releases & Support

APIs

Legal Agreements

OpenID Connect EndpointsOpenID Connect 1.0 Discovery

Integrate & AuthenticateOIDC & OAuth Flows

# OpenID Connect Endpoints in ZITADEL

## [OpenID Connect 1.0 Discovery](https://zitadel.com/docs/apis/openidoauth/endpoints#open-id-connect-1-0-discovery)

The OpenID Connect Discovery Endpoint is located within the issuer domain.
This would give us `${CUSTOM_DOMAIN}/.well-known/openid-configuration`.

**Link to spec.** [OpenID Connect Discovery 1.0 incorporating errata set 1](https://openid.net/specs/openid-connect-discovery-1_0.html)

## [authorization_endpoint](https://zitadel.com/docs/apis/openidoauth/endpoints#authorization-endpoint)

`${CUSTOM_DOMAIN}/oauth/v2/authorize`

The authorization_endpoint is located with the login page, due to the need of accessing the same cookie domain

The authorization_endpoint is the starting point for all initial user authentications. The user agent (browser) will be redirected to this endpoint to
authenticate the user in exchange for an authorization_code (authorization code flow) or tokens (implicit flow).

Links to specs

- [Section 3.1 of OAuth2.0 (RFC6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-3.1)
- [Section 3.1.2 of OpenID Connect Core 1.0 incorporating errata set 1](https://openid.net/specs/openid-connect-core-1_0.html#AuthorizationEndpoint)

### [Required request parameters](https://zitadel.com/docs/apis/openidoauth/endpoints#required-request-parameters)

| Parameter     | Description                                                                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| client_id     | The id of your client as shown in Console.                                                                                                                             |
| redirect_uri  | Callback uri of the authorization request where the code or tokens will be sent to. Must match exactly one of the preregistered in Console.                            |
| response_type | Determines whether a `code`, `id_token token` or just `id_token` will be returned. Most use cases will need `code`. See flow guide for more info.                      |
| scope         | `openid` is required, see [Scopes](https://zitadel.com/docs/apis/openidoauth/scopes) for more possible values. Scopes are space delimited, e.g. `openid email profile` |

Following the [OIDC Core 1.0 specs](https://openid.net/specs/openid-connect-core-1_0.html#ScopeClaims) whenever an access_token is issued,
the id_token will not contain any claims of the scopes `profile`, `email`, `phone` and `address`.

Send the access_token to the [userinfo_endpoint](https://zitadel.com/docs/apis/openidoauth/endpoints#userinfo-endpoint) or [introspection_endpoint](https://zitadel.com/docs/apis/openidoauth/endpoints#introspection-endpoint) the retrieve these claims
or set the `id_token_userinfo_assertion` Option ("User Info inside ID Token" in Management Console) to true.

Depending on your authorization method you will have to provide additional parameters or headers:

no additional parameters required

no additional parameters required

| Parameter             | Description                                           |
| --------------------- | ----------------------------------------------------- |
| code_challenge        | The SHA-256 value of the generated `code_verifier`    |
| code_challenge_method | Method used to generate the challenge, must be `S256` |

see PKCE guide for more information

no additional parameters required

### [Additional parameters](https://zitadel.com/docs/apis/openidoauth/endpoints#additional-parameters)

| Parameter     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| id_token_hint | Valid `id_token` (of an existing session) used to identity the subject. **SHOULD** be provided when using prompt `none`.                                                                                                                                                                                                                                                                                                                                                             |
| login_hint    | A valid logon name of a user. Will be used for username inputs or preselecting a user on `select_account`. Be sure to encode the hint correctly using url encoding (especially when using `+` or alike in the loginname)                                                                                                                                                                                                                                                             |
| max_age       | Seconds since the last active successful authentication of the user                                                                                                                                                                                                                                                                                                                                                                                                                  |
| nonce         | Random string value to associate the client session with the ID Token and for replay attacks mitigation. **MUST** be provided when using **implicit flow**.                                                                                                                                                                                                                                                                                                                          |
| prompt        | If the Auth Server prompts the user for (re)authentication. <br>no prompt: the user will have to choose a session if more than one session exists<br>`none`: user must be authenticated without interaction, an error is returned otherwise <br>`login`: user must reauthenticate / provide a user name <br>`select_account`: user is prompted to select one of the existing sessions or create a new one <br>`create`: the registration form will be displayed to the user directly |
| state         | Opaque value used to maintain state between the request and the callback. Used for Cross-Site Request Forgery (CSRF) mitigation as well, therefore highly **recommended**.                                                                                                                                                                                                                                                                                                           |
| ui_locales    | Spaces delimited list of preferred locales for the login UI, e.g. `de-CH de en`. If none is provided or matches the possible locales provided by the login UI, the `accept-language` header of the browser will be taken into account.                                                                                                                                                                                                                                               |
| response_mode | The mechanism to be used for returning parameters to the application. See [response modes](https://zitadel.com/docs/apis/openidoauth/endpoints#response-modes) for valid values. Invalid values are ignored.                                                                                                                                                                                                                                                                         |

#### [Response modes](https://zitadel.com/docs/apis/openidoauth/endpoints#response-modes)

ZITADEL supports the following `response_mode` values. When no response mode is requested, the response mode is chosen based on the configured Response Type of the application.
As per [OpenID Connect Core 1.0, Section 3.1.2.1](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest):

> The use of this parameter is NOT RECOMMENDED when the Response Mode that would be requested is the default mode specified for the Response Type.

| Response Mode                                                                       | Description                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| query                                                                               | Encode the returned parameters in the URL query string. This is the default when the Response type is `code`, for example [Web applications](https://zitadel.com/docs/guides/manage/console/applications-overview#web).                                                                                                                                     |
| fragment                                                                            | Encode the returned parameters in the URL fragment. This is the default when the Response Type is `id_token`, for example implicit [User Agent apps](https://zitadel.com/docs/guides/manage/console/applications-overview#user-agent). This mode will not work for server-side applications, because fragments are never sent by the browser to the server. |
| form_post[1](https://zitadel.com/docs/apis/openidoauth/endpoints#user-content-fn-1) | ZITADEL serves a small JavaScript to the browser which will send the returned parameters to the `redirect_uri` using HTTP POST. This mode only works for server-side applications and user agents which support / allow JavaScript.                                                                                                                         |

### [Successful code response](https://zitadel.com/docs/apis/openidoauth/endpoints#successful-code-response)

When your `response_type` was `code` and no error occurred, the following response will be returned:

| Property | Description                                                                   |
| -------- | ----------------------------------------------------------------------------- |
| code     | Opaque string which will be necessary to request tokens on the token endpoint |
| state    | Unmodified `state` parameter from the request                                 |

### [Successful implicit response](https://zitadel.com/docs/apis/openidoauth/endpoints#successful-implicit-response)

When your `response_type` was either `id_token` or `id_token token` and no error occurred, the following response will be returned:

| Property     | Description                                                                           |
| ------------ | ------------------------------------------------------------------------------------- |
| access_token | Only returned if `response_type` included `token`                                     |
| expires_in   | Number of second until the expiration of the `access_token`                           |
| id_token     | An `id_token` of the authorized user                                                  |
| token_type   | Type of the `access_token`. Value is always `Bearer`                                  |
| scope        | Scopes of the `access_token`. These might differ from the provided `scope` parameter. |
| state        | Unmodified `state` parameter from the request                                         |

### [Error response](https://zitadel.com/docs/apis/openidoauth/endpoints#error-response)

Regardless of the authorization flow chosen, if an error occurs the following response will be returned to the redirect_uri.

If the redirect_uri is not provided, was not registered or anything other prevents the auth server form returning the response to the client,
the error will be display directly to the user on the auth server

| Property          | Description                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| error             | An OAuth / OIDC [error_type](https://zitadel.com/docs/apis/openidoauth/endpoints#authorize-errors) |
| error_description | Description of the error type or additional information of the error                               |
| state             | Unmodified `state` parameter from the request                                                      |

#### [Possible errors](https://zitadel.com/docs/apis/openidoauth/endpoints#possible-errors)

| error_type                | Possible reason                                                                                                                                                                                                                                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| invalid_request           | The request is missing a required parameter, includes an invalid parameter value, includes a parameter more than once, or is otherwise malformed.                                                                                                                                                  |
| invalid_scope             | The requested scope is invalid. Typically the required `openid` value is missing.                                                                                                                                                                                                                  |
| unauthorized_client       | The client is not authorized to request an access_token using this method. Check in Management Console that the requested `response_type` is allowed in your application settings.                                                                                                                 |
| unsupported_response_type | The authorization server does not support the requested response_type.                                                                                                                                                                                                                             |
| server_error              | The authorization server encountered an unexpected condition that prevented it from fulfilling the request.                                                                                                                                                                                        |
| interaction_required      | The authorization server requires end-user interaction of some form to proceed. This error MAY be returned when the prompt parameter value in the Authentication Request is none, but the Authentication Request cannot be completed without displaying a user interface for end-user interaction. |
| login_required            | The authorization server requires end-user authentication. This error MAY be returned when the prompt parameter value in the Authentication Request is none, but the Authentication Request cannot be completed without displaying a user interface for end-user authentication.                   |

## [token_endpoint](https://zitadel.com/docs/apis/openidoauth/endpoints#token-endpoint)

`${CUSTOM_DOMAIN}/oauth/v2/token`

The token_endpoint will as the name suggests return various tokens (access, id and refresh) depending on the used `grant_type`.
When using [`authorization_code`](https://zitadel.com/docs/apis/openidoauth/endpoints#authorization-code-grant-code-exchange) flow call this endpoint after receiving the code from the authorization_endpoint.
When using [`refresh_token`](https://zitadel.com/docs/apis/openidoauth/endpoints#authorization-code-grant-code-exchange) or [`urn:ietf:params:oauth:grant-type:jwt-bearer` (JWT Profile)](https://zitadel.com/docs/apis/openidoauth/endpoints#jwt-profile-grant) you will call this endpoint directly.

### [Authorization code grant (Code Exchange)](https://zitadel.com/docs/apis/openidoauth/endpoints#authorization-code-grant-code-exchange)

As mention above, when using `authorization_code` grant, this endpoint will be your second request for authorizing a user with its user agent (browser).

#### [Required request parameters](https://zitadel.com/docs/apis/openidoauth/endpoints#required-request-parameters)

| Parameter    | Description                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| code         | Code that was issued from the authorization request.                                                          |
| grant_type   | Must be `authorization_code`                                                                                  |
| redirect_uri | Callback uri where the code was be sent to. Must match exactly the redirect_uri of the authorization request. |

Depending on your authorization method you will have to provide additional parameters or headers:

Send your `client_id` and `client_secret` as Basic Auth Header. Check [Client Secret Basic Auth Method](https://zitadel.com/docs/apis/openidoauth/authn-methods#client-secret-basic) on how to build it correctly.

Send your `client_id` and `client_secret` as parameters in the body:

| Parameter     | Description                      |
| ------------- | -------------------------------- |
| client_id     | client_id of the application     |
| client_secret | client_secret of the application |

Send your `client_id` and `code_verifier` for us to recompute the `code_challenge` of the authorization request.

| Parameter     | Description                                                  |
| ------------- | ------------------------------------------------------------ |
| client_id     | client_id of the application                                 |
| code_verifier | code_verifier previously used to generate the code_challenge |

Send a client assertion as JWT for us to validate the signature against the registered public key.

| Parameter             | Description                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| client_assertion      | JWT built and signed according to [Using JWTs for Client Authentication](https://zitadel.com/docs/apis/openidoauth/authn-methods#jwt-with-private-key) |
| client_assertion_type | Must be `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`                                                                                       |

#### [Successful code response](https://zitadel.com/docs/apis/openidoauth/endpoints#successful-code-response)

| Property      | Description                                                                           |
| ------------- | ------------------------------------------------------------------------------------- |
| access_token  | An `access_token` as JWT or opaque token                                              |
| expires_in    | Number of second until the expiration of the `access_token`                           |
| id_token      | An `id_token` of the authorized user                                                  |
| scope         | Scopes of the `access_token`. These might differ from the provided `scope` parameter. |
| refresh_token | An opaque token. Only returned if `offline_access` scope was requested                |
| token_type    | Type of the `access_token`. Value is always `Bearer`                                  |

### [JWT profile grant](https://zitadel.com/docs/apis/openidoauth/endpoints#jwt-profile-grant)

#### [Required request parameters](https://zitadel.com/docs/apis/openidoauth/endpoints#required-request-parameters)

| Parameter  | Description                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| grant_type | Must be `urn:ietf:params:oauth:grant-type:jwt-bearer`                                                                                                              |
| assertion  | JWT built and signed according to [Using JWTs for Authorization Grants](https://zitadel.com/docs/apis/openidoauth/grant-types#using-jw-ts-as-authorization-grants) |
| scope      | [Scopes](https://zitadel.com/docs/apis/openidoauth/scopes) you would like to request from ZITADEL. Scopes are space delimited, e.g. `openid email profile`         |

```
curl --request POST \
  --url ${CUSTOM_DOMAIN}/oauth/v2/token \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer \
  --data assertion=eyJhbGciOiJSUzI1Ni...
```

#### [Successful JWT profile response](https://zitadel.com/docs/apis/openidoauth/endpoints#successful-jwt-profile-response)

| Property     | Description                                                                           |
| ------------ | ------------------------------------------------------------------------------------- |
| access_token | An `access_token` as JWT or opaque token                                              |
| expires_in   | Number of second until the expiration of the `access_token`                           |
| id_token     | An `id_token` of the authorized service account                                       |
| scope        | Scopes of the `access_token`. These might differ from the provided `scope` parameter. |
| token_type   | Type of the `access_token`. Value is always `Bearer`                                  |

### [Refresh token grant](https://zitadel.com/docs/apis/openidoauth/endpoints#refresh-token-grant)

To request a new `access_token` without user interaction, you can use the `refresh_token` grant.
See [offline_access Scope](https://zitadel.com/docs/apis/openidoauth/scopes#standard-scopes) for how to request a `refresh_token` in the authorization request.

#### [Required request parameters](https://zitadel.com/docs/apis/openidoauth/endpoints#required-request-parameters)

| Parameter     | Description                                                                                                                                                                                                                                                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| grant_type    | Must be `refresh_token`                                                                                                                                                                                                                                                                                                                                   |
| refresh_token | The refresh_token previously issued in the last authorization_code or refresh_token request.                                                                                                                                                                                                                                                              |
| scope         | [Scopes](https://zitadel.com/docs/apis/openidoauth/scopes) you would like to request from ZITADEL for the new access_token. Must be a subset of the scope originally requested by the corresponding auth request. When omitted, the scopes requested by the original auth request will be reused. Scopes are space delimited, e.g. `openid email profile` |

Depending on your authorization method you will have to provide additional parameters or headers:

Send your `client_id` and `client_secret` as Basic Auth Header. Check [Client Secret Basic Auth Method](https://zitadel.com/docs/apis/openidoauth/authn-methods#client-secret-basic) on how to build it correctly.

Send your `client_id` and `client_secret` as parameters in the body:

| Parameter     | Description                      |
| ------------- | -------------------------------- |
| client_id     | client_id of the application     |
| client_secret | client_secret of the application |

Send your `client_id` as parameter in the body. No authentication is required.

Send a `client_assertion` as JWT for us to validate the signature against the registered public key.

| Parameter             | Description                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| client_assertion      | JWT built and signed according to [Using JWTs for Client Authentication](https://zitadel.com/docs/apis/openidoauth/authn-methods#jwt-with-private-key) |
| client_assertion_type | Must be `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`                                                                                       |

#### [Successful refresh token response](https://zitadel.com/docs/apis/openidoauth/endpoints#successful-refresh-token-response)

| Property      | Description                                                                           |
| ------------- | ------------------------------------------------------------------------------------- |
| access_token  | An `access_token` as JWT or opaque token                                              |
| expires_in    | Number of second until the expiration of the `access_token`                           |
| id_token      | An `id_token` of the authorized user                                                  |
| scope         | Scopes of the `access_token`. These might differ from the provided `scope` parameter. |
| refresh_token | An new opaque refresh_token.                                                          |
| token_type    | Type of the `access_token`. Value is always `Bearer`                                  |

### [Client credentials grant](https://zitadel.com/docs/apis/openidoauth/endpoints#client-credentials-grant)

#### [Required request parameters](https://zitadel.com/docs/apis/openidoauth/endpoints#required-request-parameters)

| Parameter  | Description                                                                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| grant_type | Must be `client_credentials`                                                                                                                         |
| scope      | [Scopes](https://zitadel.com/docs/apis/openidoauth/scopes) you would like to request from ZITADEL. Scopes are space delimited, e.g. `openid profile` |

Additionally, you need to authenticate your client by either sending `client_id` and `client_secret` as Basic Auth Header.
Check [Client Secret Basic Auth Method](https://zitadel.com/docs/apis/openidoauth/authn-methods#client-secret-basic) on how to build it correctly.

```
curl --request POST \
  --url ${CUSTOM_DOMAIN}/oauth/v2/token \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --header 'Authorization: Basic ${BASIC_AUTH}' \
  --data grant_type=client_credentials \
  --data scope=openid profile
```

Or you can also send your `client_id` and `client_secret` as parameters in the body:

| Parameter     | Description                      |
| ------------- | -------------------------------- |
| client_id     | client_id of the application     |
| client_secret | client_secret of the application |

```
curl --request POST \
  --url ${CUSTOM_DOMAIN}/oauth/v2/token \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data grant_type=client_credentials \
  --data client_id=${CLIENT_ID} \
  --data client_secret=${CLIENT_SECRET} \
  --data scope=openid profile
```

#### [Successful client credentials response](https://zitadel.com/docs/apis/openidoauth/endpoints#successful-client-credentials-response)

| Property     | Description                                                                           |
| ------------ | ------------------------------------------------------------------------------------- |
| access_token | An `access_token` as JWT or opaque token                                              |
| expires_in   | Number of second until the expiration of the `access_token`                           |
| scope        | Scopes of the `access_token`. These might differ from the provided `scope` parameter. |
| token_type   | Type of the `access_token`. Value is always `Bearer`                                  |

### [Token Exchange grant](https://zitadel.com/docs/apis/openidoauth/endpoints#token-exchange-grant)

The Token Exchange grant implements [RFC 8693, OAuth 2.0 Token Exchange](https://www.rfc-editor.org/rfc/rfc8693) and can be used to exchange tokens to a different scope, audience or subject. Changing the subject of an authenticated token is called impersonation or delegation. ZITADEL also provides a [token exchange guide](https://zitadel.com/docs/guides/integrate/token-exchange) with more details on using the Token Exchange Grant.

#### [Request parameters](https://zitadel.com/docs/apis/openidoauth/endpoints#request-parameters)

| Parameter            | Description                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| grant_type           | Must be `urn:ietf:params:oauth:grant-type:token-exchange`                                                                                                                           |
| subject_token        | A token that represents the identity of the party on behalf of whom the request is being made.                                                                                      |
| subject_token_type   | An identifier that indicates the type of the token in the subject_token parameter.                                                                                                  |
| actor_token          | Optional. A token that represents the identity of the acting party. In ZITADEL this the impersonator.                                                                               |
| actor_token_type     | An identifier that indicates the type of the token in the actor_token parameter. Required when actor_token is provided                                                              |
| requested_token_type | Optional. An identifier that indicates the type of the token requested. Defaults to access token if not provided.                                                                   |
| scope                | [Scopes](https://zitadel.com/docs/apis/openidoauth/scopes) you would like to request from ZITADEL for the requested token. Scopes are space delimited, e.g. `openid email profile`. |
| audience             | Optional. Must be a subset of the combined audiences from both subject and actor tokens.                                                                                            |
| resource             | Currently not supported                                                                                                                                                             |

Depending on your authorization method you will have to provide additional parameters or headers:

Send your `client_id` and `client_secret` as Basic Auth Header. Check [Client Secret Basic Auth Method](https://zitadel.com/docs/apis/openidoauth/authn-methods#client-secret-basic) on how to build it correctly.

Send your `client_id` and `client_secret` as parameters in the body:

| Parameter     | Description                      |
| ------------- | -------------------------------- |
| client_id     | client_id of the application     |
| client_secret | client_secret of the application |

Send your `client_id` as parameter in the body. No authentication is required.

Send a `client_assertion` as JWT for us to validate the signature against the registered public key.

| Parameter             | Description                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| client_assertion      | JWT built and signed according to [Using JWTs for Client Authentication](https://zitadel.com/docs/apis/openidoauth/authn-methods#jwt-with-private-key) |
| client_assertion_type | Must be `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`                                                                                       |

#### [Successful token exchange response](https://zitadel.com/docs/apis/openidoauth/endpoints#successful-token-exchange-response)

| Property          | Description                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| access_token      | An `access_token` as opaque token or JWT for the subject user                                                                           |
| token_type        | Type of the `access_token`. Value can be `Bearer` or `N_A`                                                                              |
| issued_token_type | [Token type](https://zitadel.com/docs/apis/openidoauth/endpoints#token-types) of the returned token, matches the `requested_token_type` |
| refresh_token     | A refresh token if the `offline_access` scope was requested                                                                             |
| id_token          | An ID Token of the subject user, only with `openid` scope                                                                               |
| expires_in        | Number of second until the expiration of the `access_token`                                                                             |
| scope             | Scopes of the `access_token`. These might differ from the provided `scope` parameter                                                    |

#### [Token types](https://zitadel.com/docs/apis/openidoauth/endpoints#token-types)

The following table provides a matrix of supported token type parameter and responses for Token Exchange.

| Identifier                                       | subject_token                                                | actor_token   | requested_token_type |
| ------------------------------------------------ | ------------------------------------------------------------ | ------------- | -------------------- |
| `urn:ietf:params:oauth:token-type:access_token`  | JWT or Opaque                                                | JWT or Opaque | Opaque only          |
| `urn:ietf:params:oauth:token-type:refresh_token` | Not allowed                                                  | Not allowed   | Not allowed          |
| `urn:ietf:params:oauth:token-type:id_token`      | Allowed                                                      | Allowed       | Allowed              |
| `urn:ietf:params:oauth:token-type:jwt`           | JWT signed by client, only in combination with `actor_token` | Not allowed   | Access Token as JWT  |
| `urn:zitadel:params:oauth:token-type:user_id`    | user ID as string, only in combination with `actor_token`    | Not allowed   | Not allowed          |

### [Error response](https://zitadel.com/docs/apis/openidoauth/endpoints#error-response)

| error_type             | Possible reason                                                                                                                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| invalid_request        | The request is missing a required parameter, includes an unsupported parameter value (other than grant type), repeats a parameter, includes multiple credentials, utilizes more than one mechanism for authenticating the client, or is otherwise malformed. |
| invalid_scope          | The requested scope is invalid, unknown, malformed, or exceeds the scope granted by the resource owner.                                                                                                                                                      |
| unauthorized_client    | The authenticated client is not authorized to use this authorization grant type.                                                                                                                                                                             |
| unsupported_grant_type | The authorization grant type is not supported by the authorization server.                                                                                                                                                                                   |
| server_error           | The authorization server encountered an unexpected condition that prevented it from fulfilling the request.                                                                                                                                                  |
| invalid_grant          | The provided authorization grant (e.g., authorization code, resource owner credentials) or refresh token is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.                |
| invalid_client         | Client authentication failed (e.g., unknown client, no client authentication included, or unsupported authentication method).                                                                                                                                |

## [introspection_endpoint](https://zitadel.com/docs/apis/openidoauth/endpoints#introspection-endpoint)

`${CUSTOM_DOMAIN}/oauth/v2/introspect`

This endpoint enables clients to validate an `acccess_token`, either opaque or JWT. Unlike client side JWT validation,
this endpoint will check if the token is not revoked (by client or logout).

| Parameter | Description     |
| --------- | --------------- |
| token     | An access token |

Depending on your authorization method you will have to provide additional parameters or headers:

Send your `client_id` and `client_secret` as Basic Auth Header. Check [Client Secret Basic Auth Method](https://zitadel.com/docs/apis/openidoauth/authn-methods#client-secret-basic) on how to build it correctly.

```
curl --request POST \
  --url ${CUSTOM_DOMAIN}/oauth/v2/introspect \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --header 'Authorization: Basic {your_basic_auth_header}' \
  --data token=VjVxyCZmRmWYqd3_F5db9Pb9mHR5fqzhn...
```

Send a `client_assertion` as JWT for us to validate the signature against the registered public key.

| Parameter             | Description                                                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| client_assertion      | JWT built and signed according to [Using JWTs for Client Authentication](https://zitadel.com/docs/apis/openidoauth/authn-methods#client-secret-basic) |
| client_assertion_type | must be `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`                                                                                      |

```
curl --request POST \
  --url ${CUSTOM_DOMAIN}/oauth/v2/introspect \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer \
  --data client_assertion=eyJhbGciOiJSUzI1Ni... \
  --data token=VjVxyCZmRmWYqd3_F5db9Pb9mHR5fqzhn...
```

### [Successful introspection response](https://zitadel.com/docs/apis/openidoauth/endpoints#successful-introspection-response)

Upon successful authorization of the client a response with the boolean `active` is returned, indicating if the provided token
is active and the requesting client is part of the token audience.

If `active` is **true**, further information will be provided:

| Property   | Description                                                           |
| ---------- | --------------------------------------------------------------------- |
| aud        | The audience of the token                                             |
| client_id  | The client_id of the application the token was issued to              |
| exp        | Time the token expires (as unix time)                                 |
| iat        | Time of the token was issued at (as unix time)                        |
| iss        | Issuer of the token                                                   |
| jti        | Unique id of the token                                                |
| nbf        | Time the token must not be used before (as unix time)                 |
| scope      | Space delimited list of scopes granted to the token                   |
| token_type | Type of the inspected token. Value is always `Bearer`                 |
| username   | ZITADEL's login name of the user. Consist of `username@primarydomain` |

Additionally and depending on the granted scopes, information about the authorized user is provided.
Check the [Claims](https://zitadel.com/docs/apis/openidoauth/claims) page if a specific claims might be returned and for detailed description.

### [Error response](https://zitadel.com/docs/apis/openidoauth/endpoints#error-response)

If the authorization fails, an HTTP 401 with `invalid_client` will be returned.

## [userinfo_endpoint](https://zitadel.com/docs/apis/openidoauth/endpoints#userinfo-endpoint)

`${CUSTOM_DOMAIN}/oidc/v1/userinfo`

This endpoint will return information about the authorized user.

Send the `access_token` of the **user** (not the client) as Bearer Token in the `authorization` header:

```
curl --request GET \
  --url ${CUSTOM_DOMAIN}/oidc/v1/userinfo
  --header 'Authorization: Bearer dsfdsjk29fm2as...'
```

### [Successful userinfo response](https://zitadel.com/docs/apis/openidoauth/endpoints#successful-userinfo-response)

If the `access_token` is valid, the information about the user depending on the granted scopes is returned.
Check the [Claims](https://zitadel.com/docs/apis/openidoauth/claims) page if a specific claims might be returned and for detailed description.

### [Error response](https://zitadel.com/docs/apis/openidoauth/endpoints#error-response)

If the token is invalid or expired, an HTTP 401 will be returned.

## [revocation_endpoint](https://zitadel.com/docs/apis/openidoauth/endpoints#revocation-endpoint)

`${CUSTOM_DOMAIN}/oauth/v2/revoke`

This endpoint enables clients to revoke an `access_token` or `refresh_token` they have been granted.

If you revoke an `access_token` only the specific token will be revoked. When revoking a `refresh_token`,
the corresponding `access_token` will be revoked as well.

| Parameter | Description                      |
| --------- | -------------------------------- |
| token     | An access token or refresh token |

Depending on your authorization method you will have to provide additional parameters or headers:

Send your `client_id` and `client_secret` as Basic Auth Header. Check [Client Secret Basic Auth Method](https://zitadel.com/docs/apis/openidoauth/authn-methods#client-secret-basic) on how to construct a request correctly.

Send your `client_id` and `client_secret` as parameters in the body:

| Parameter     | Description                      |
| ------------- | -------------------------------- |
| client_id     | client_id of the application     |
| client_secret | client_secret of the application |

Send your `client_id` as parameters in the body:

| Parameter | Description                  |
| --------- | ---------------------------- |
| client_id | client_id of the application |

Send a `client_assertion` as JWT for ZITADEL to verify the signature against the registered public key.

| Parameter             | Description                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| client_assertion      | JWT created and signed according to [Using JWTs for Client Authentication](https://zitadel.com/docs/apis/openidoauth/authn-methods#client-secret-basic) |
| client_assertion_type | must be `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`                                                                                        |

```
curl --request POST \
  --url ${CUSTOM_DOMAIN}/oauth/v2/revoke \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer \
  --data client_assertion=eyJhbGciOiJSUzI1Ni... \
  --data token=VjVxyCZmRmWYqd3_F5db9Pb9mHR5fqzhn...
```

## [end_session_endpoint](https://zitadel.com/docs/apis/openidoauth/endpoints#end-session-endpoint)

`${CUSTOM_DOMAIN}/oidc/v1/end_session`

The endpoint has to be opened in the user agent (browser) to terminate the user sessions.

No parameters are needed apart from the user agent cookie, but you can provide the following to customize the behavior:

| Parameter                | Description                                                                                                                                                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id_token_hint            | the id_token that was previously issued to the client                                                                                                                                                                                  |
| client_id                | client_id of the application                                                                                                                                                                                                           |
| post_logout_redirect_uri | Callback uri of the logout where the user (agent) will be redirected to. Must match exactly one of the preregistered in Console.                                                                                                       |
| state                    | Opaque value used to maintain state between the request and the callback                                                                                                                                                               |
| logout_hint              | A valid login name of a user. Will be used to select the user to logout. Only supported when using the login UI V2.                                                                                                                    |
| ui_locales               | Spaces delimited list of preferred locales for the login UI, e.g. `de-CH de en`. If none is provided or matches the possible locales provided by the login UI, the `accept-language` header of the browser will be taken into account. |

The `post_logout_redirect_uri` will be checked against the previously registered uris of the client provided by the `azp` claim of the `id_token_hint` or the `client_id` parameter.
If both parameters are provided, they must be equal.

If neither an `id_token_hint` nor a `client_id` parameter is provided, the `post_logout_redirect_uri` will be ignored.

## [jwks_uri](https://zitadel.com/docs/apis/openidoauth/endpoints#jwks-uri)

`${CUSTOM_DOMAIN}/oauth/v2/keys`

The endpoint returns a JSON Web Key Set (JWKS) containing the public keys that can be used to locally validate JWTs you received from ZITADEL.
The alternative would be to validate tokens with the [introspection endpoint](https://zitadel.com/docs/apis/openidoauth/endpoints#introspection-endpoint).

### [Key rotation](https://zitadel.com/docs/apis/openidoauth/endpoints#key-rotation)

Keys are automatically rotated on a regular basis or on demand, meaning keys can change in irregular intervals.
ZITADEL ensures that a proper `kid` is set with each key.

Keys rotate without prior notice

Be aware that these keys can be rotated without any prior notice.

### [Caching](https://zitadel.com/docs/apis/openidoauth/endpoints#caching)

You can optimize performance of your clients by caching the response from the keys endpoint.
We recommend to regularly update the cached response, since the [keys can be rotated without prior notice](https://zitadel.com/docs/apis/openidoauth/endpoints#key-rotation).
You could also combine caching with a risk-based on-demand refresh when a critical operation is executed.

Without caching you will call this endpoint on each request.
This might result in being rate limited for a large number of requests that come from the same backend.

## [OAuth 2.0 metadata](https://zitadel.com/docs/apis/openidoauth/endpoints#o-auth-2-0-metadata)

**ZITADEL** does not yet provide a OAuth 2.0 Metadata endpoint but instead provides a [OpenID Connect Discovery Endpoint](https://openid.net/specs/openid-connect-discovery-1_0.html).

## [Footnotes](https://zitadel.com/docs/apis/openidoauth/endpoints#footnote-label)

1. Implements [OAuth 2.0 Form Post Response Mode](https://openid.net/specs/oauth-v2-form-post-response-mode-1_0.html) [↩](https://zitadel.com/docs/apis/openidoauth/endpoints#user-content-fnref-1)

Was this page helpful?

[Device Authorization Flow\\
\\
Authenticate with ZITADEL using RFC 8628 Device Authorization Flow by obtaining user consent without browser interaction](https://zitadel.com/docs/guides/integrate/login/oidc/device-authorization) [Authentication Methods\\
\\
The supported client authentication methods in ZITADEL, including Client Secret and JWT.](https://zitadel.com/docs/apis/openidoauth/authn-methods)

[ZITADEL Docs](https://zitadel.com/docs)

[ZITADEL Docs](https://zitadel.com/docs)

Search
`⌘` `K`
ZITADEL Docs (Latest)v4.12v4.11v4.10

Get Started

[Quick Start Guide](https://zitadel.com/docs/guides/start/quickstart)

Key Concepts

Authenticate Users

Example Applications

Use Cases

Onboard Customers and Users

Branding & Customization

Integrate & Authenticate

OIDC & OAuth Flows

[Recommended authorization flows](https://zitadel.com/docs/guides/integrate/login/oidc/oauth-recommended-flows) [OIDC Code Flow + PKCE](https://zitadel.com/docs/guides/integrate/login/oidc/login-users) [Device Authorization Flow](https://zitadel.com/docs/guides/integrate/login/oidc/device-authorization) [OpenID Connect Endpoints](https://zitadel.com/docs/apis/openidoauth/endpoints) [Authentication Methods](https://zitadel.com/docs/apis/openidoauth/authn-methods) [Scopes](https://zitadel.com/docs/apis/openidoauth/scopes) [Claims](https://zitadel.com/docs/apis/openidoauth/claims) [Grant Types](https://zitadel.com/docs/apis/openidoauth/grant-types) [OIDC Playground](https://zitadel.com/docs/apis/openidoauth/authrequest) [Web Keys](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys) [Token Exchange](https://zitadel.com/docs/guides/integrate/token-exchange)

SAML

API Access

SDKs & Integrations

[SCIM](https://zitadel.com/docs/guides/manage/user/scim2)

[Token Introspection](https://zitadel.com/docs/guides/integrate/token-introspection)

[Back-Channel Logout](https://zitadel.com/docs/guides/integrate/back-channel-logout)

External Integrations

Build your own Login UI

Actions

Migrate

Configure Identity & Policies

Test & Debug

Deploy & Operate

Architecture & Concepts

Product, Releases & Support

APIs

Legal Agreements

Authentication MethodsClient Secret Basic

Integrate & AuthenticateOIDC & OAuth Flows

# Authentication Methods in ZITADEL

## [Client Secret Basic](https://zitadel.com/docs/apis/openidoauth/authn-methods#client-secret-basic)

When using `client_secret_basic` on token or introspection endpoints, provide an`Authorization` header with a Basic auth value in the following form:

```
Authorization: "Basic " + base64( formUrlEncode(client_id) + ":" + formUrlEncode(client_secret) )
```

Given the client_id `78366401571920522@amce` and client_secret `veryweaksecret!`, this would result in the following `Authorization` header:
`Basic NzgzNjY0MDE1NzE5MjA1MjIlNDBhbWNlOnZlcnl3ZWFrc2VjcmV0JTIx`

## [JWT with Private Key](https://zitadel.com/docs/apis/openidoauth/authn-methods#jwt-with-private-key)

When using `private_key_jwt` (`urn:ietf:params:oauth:client-assertion-type:jwt-bearer`) for token or introspection endpoints, provide a JWT as assertion generated with the following structure and signed with a downloaded key:

---

Key JSON

| Key      | Example                                                             | Description                                                                   |
| -------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| type     | `"application"`                                                     | The type of account, right now only application is valid                      |
| keyId    | `"81693565968962154"`                                               | This is unique ID of the key                                                  |
| key      | `"-----BEGIN RSA PRIVATE KEY-----...-----END RSA PRIVATE KEY-----"` | The private key generated by ZITADEL, this can not be regenerated!            |
| clientId | `78366401571920522@acme`                                            | The client_id of the application, this is the same as the subject from tokens |
| appId    | `78366403256846242`                                                 | The id of the application (just for completeness, not used for JWT)           |

```
{
	"type": "application",
	"keyId": "81693565968962154",
	"key": "-----BEGIN RSA PRIVATE KEY-----...-----END RSA PRIVATE KEY-----",
	"clientId": "78366401571920522@acme",
	"appId": "78366403256846242"
}
```

---

JWT

| Claim | Example                      | Description                                                                                                     |
| ----- | ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| aud   | `"https://${CUSTOM_DOMAIN}"` | String or Array of intended audiences MUST include ZITADEL's issuing domain                                     |
| exp   | `1605183582`                 | Unix timestamp of the expiry                                                                                    |
| iat   | `1605179982`                 | Unix timestamp of the creation singing time of the JWT, MUST NOT be older than 1h                               |
| iss   | `"78366401571920522@acme"`   | String which represents the requesting party (owner of the key), normally the `clientID` from the json key file |
| sub   | `"78366401571920522@acme"`   | The subject ID of the application, normally the `clientID` from the json key file                               |

```
{
	"iss": "78366401571920522@acme",
	"sub": "78366401571920522@acme",
	"aud": "https://${CUSTOM_DOMAIN}",
	"exp": 1605183582,
	"iat": 1605179982
}
```

> To identify your key, it is necessary that you provide a JWT with a `kid` header claim representing your keyId from the Key JSON:
>
> ```
> {
> 	"alg": "RS256",
> 	"kid": "81693565968962154"
> }
> ```

Was this page helpful?

[OpenID Connect Endpoints\\
\\
The standard OIDC and OAuth 2.0 endpoints for ZITADEL, adhering to the OpenID Connect 1.0 standard.](https://zitadel.com/docs/apis/openidoauth/endpoints) [Scopes\\
\\
The standard and ZITADEL-specific OIDC scopes available for identity and authentication requests.](https://zitadel.com/docs/apis/openidoauth/scopes)

[ZITADEL Docs](https://zitadel.com/docs)

[ZITADEL Docs](https://zitadel.com/docs)

Search
`⌘` `K`
ZITADEL Docs (Latest)v4.12v4.11v4.10

Get Started

[Quick Start Guide](https://zitadel.com/docs/guides/start/quickstart)

Key Concepts

Authenticate Users

Example Applications

Use Cases

Onboard Customers and Users

Branding & Customization

Integrate & Authenticate

OIDC & OAuth Flows

[Recommended authorization flows](https://zitadel.com/docs/guides/integrate/login/oidc/oauth-recommended-flows) [OIDC Code Flow + PKCE](https://zitadel.com/docs/guides/integrate/login/oidc/login-users) [Device Authorization Flow](https://zitadel.com/docs/guides/integrate/login/oidc/device-authorization) [OpenID Connect Endpoints](https://zitadel.com/docs/apis/openidoauth/endpoints) [Authentication Methods](https://zitadel.com/docs/apis/openidoauth/authn-methods) [Scopes](https://zitadel.com/docs/apis/openidoauth/scopes) [Claims](https://zitadel.com/docs/apis/openidoauth/claims) [Grant Types](https://zitadel.com/docs/apis/openidoauth/grant-types) [OIDC Playground](https://zitadel.com/docs/apis/openidoauth/authrequest) [Web Keys](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys) [Token Exchange](https://zitadel.com/docs/guides/integrate/token-exchange)

SAML

API Access

SDKs & Integrations

[SCIM](https://zitadel.com/docs/guides/manage/user/scim2)

[Token Introspection](https://zitadel.com/docs/guides/integrate/token-introspection)

[Back-Channel Logout](https://zitadel.com/docs/guides/integrate/back-channel-logout)

External Integrations

Build your own Login UI

Actions

Migrate

Configure Identity & Policies

Test & Debug

Deploy & Operate

Architecture & Concepts

Product, Releases & Support

APIs

Legal Agreements

ScopesStandard Scopes

Integrate & AuthenticateOIDC & OAuth Flows

# Scopes in ZITADEL

ZITADEL supports the usage of scopes as way of requesting information from the instance and also instruct ZITADEL to do certain operations.

## [Standard Scopes](https://zitadel.com/docs/apis/openidoauth/scopes#standard-scopes)

| Scopes         | Description                                                                    |
| -------------- | ------------------------------------------------------------------------------ |
| openid         | When using openid connect this is a mandatory scope                            |
| profile        | Optional scope to request the profile of the subject                           |
| email          | Optional scope to request the email of the subject                             |
| address        | Optional scope to request the address of the subject                           |
| phone          | Optional scope to request the phone of the subject                             |
| offline_access | Optional scope to request a refresh_token (only possible when using code flow) |

## [Reserved Scopes](https://zitadel.com/docs/apis/openidoauth/scopes#reserved-scopes)

In addition to the standard compliant scopes, we use the following scopes.

| Scopes                                            | Example                                                | Description                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `urn:zitadel:iam:org:project:role:{rolekey}`      | `urn:zitadel:iam:org:project:role:user`                | By using this scope a client can request the claim `urn:zitadel:iam:org:project:roles` to be asserted when possible. As an alternative approach you can enable all roles to be asserted from the [project](https://zitadel.com/docs/guides/manage/console/roles#role-assignments) a client belongs to. |
| `urn:zitadel:iam:org:projects:roles`              | `urn:zitadel:iam:org:projects:roles`                   | By using this scope a client can request the claim `urn:zitadel:iam:org:project:{projectid}:roles` to be asserted for each requested project. All projects of the token audience, requested by the `urn:zitadel:iam:org:project:id:{projectid}:aud` scopes will be used.                               |
| `urn:zitadel:iam:org:id:{id}`                     | `urn:zitadel:iam:org:id:178204173316174381`            | When requesting this scope **ZITADEL** will enforce that the user is a member of the selected organization. If the organization does not exist a failure is displayed. It will assert the `urn:zitadel:iam:user:resourceowner` claims.                                                                 |
| `urn:zitadel:iam:org:domain:primary:{domainname}` | `urn:zitadel:iam:org:domain:primary:acme.ch`           | When requesting this scope **ZITADEL** will enforce that the user is a member of the selected organization and the username is suffixed by the provided domain. If the organization does not exist a failure is displayed                                                                              |
| `urn:zitadel:iam:org:roles:id:{orgID}`            | `urn:zitadel:iam:org:roles:id:178204173316174381`      | This scope can be used one or more times to limit the granted organization IDs in the returned roles. Unknown organization IDs are ignored. When this scope is not used, all granted organizations are returned inside the roles.                                                                      |
| `urn:zitadel:iam:org:project:id:{projectid}:aud`  | `urn:zitadel:iam:org:project:id:69234237810729019:aud` | By adding this scope, the requested project id will be added to the audience of the access token                                                                                                                                                                                                       |
| `urn:zitadel:iam:org:project:id:zitadel:aud`      | `urn:zitadel:iam:org:project:id:zitadel:aud`           | By adding this scope, the ZITADEL project id will be added to the audience of the access token                                                                                                                                                                                                         |
| `urn:zitadel:iam:user:metadata`                   | `urn:zitadel:iam:user:metadata`                        | By adding this scope, the metadata of the user will be included in the token. The values are base64 encoded.                                                                                                                                                                                           |
| `urn:zitadel:iam:user:resourceowner`              | `urn:zitadel:iam:user:resourceowner`                   | By adding this scope: id, name and primary_domain of the user's organization will be included in the token.                                                                                                                                                                                            |
| `urn:zitadel:iam:org:idp:id:{idp_id}`             | `urn:zitadel:iam:org:idp:id:76625965177954913`         | By adding this scope the user will directly be redirected to the identity provider to authenticate. Make sure you also send the Organization Domain scope if a custom login policy is configured. Otherwise the system will not be able to identify the identity provider.                             |

Was this page helpful?

[Authentication Methods\\
\\
The supported client authentication methods in ZITADEL, including Client Secret and JWT.](https://zitadel.com/docs/apis/openidoauth/authn-methods) [Claims\\
\\
Standard OIDC and custom claims issued by ZITADEL in ID tokens, access tokens, and via the Userinfo endpoint.](https://zitadel.com/docs/apis/openidoauth/claims)

[ZITADEL Docs](https://zitadel.com/docs)

[ZITADEL Docs](https://zitadel.com/docs)

Search
`⌘` `K`
ZITADEL Docs (Latest)v4.12v4.11v4.10

Get Started

[Quick Start Guide](https://zitadel.com/docs/guides/start/quickstart)

Key Concepts

Authenticate Users

Example Applications

Use Cases

Onboard Customers and Users

Branding & Customization

Integrate & Authenticate

OIDC & OAuth Flows

[Recommended authorization flows](https://zitadel.com/docs/guides/integrate/login/oidc/oauth-recommended-flows) [OIDC Code Flow + PKCE](https://zitadel.com/docs/guides/integrate/login/oidc/login-users) [Device Authorization Flow](https://zitadel.com/docs/guides/integrate/login/oidc/device-authorization) [OpenID Connect Endpoints](https://zitadel.com/docs/apis/openidoauth/endpoints) [Authentication Methods](https://zitadel.com/docs/apis/openidoauth/authn-methods) [Scopes](https://zitadel.com/docs/apis/openidoauth/scopes) [Claims](https://zitadel.com/docs/apis/openidoauth/claims) [Grant Types](https://zitadel.com/docs/apis/openidoauth/grant-types) [OIDC Playground](https://zitadel.com/docs/apis/openidoauth/authrequest) [Web Keys](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys) [Token Exchange](https://zitadel.com/docs/guides/integrate/token-exchange)

SAML

API Access

SDKs & Integrations

[SCIM](https://zitadel.com/docs/guides/manage/user/scim2)

[Token Introspection](https://zitadel.com/docs/guides/integrate/token-introspection)

[Back-Channel Logout](https://zitadel.com/docs/guides/integrate/back-channel-logout)

External Integrations

Build your own Login UI

Actions

Migrate

Configure Identity & Policies

Test & Debug

Deploy & Operate

Architecture & Concepts

Product, Releases & Support

APIs

Legal Agreements

Claims

Integrate & AuthenticateOIDC & OAuth Flows

# Claims in ZITADEL

ZITADEL asserts claims on different places according to the corresponding specifications or project and applications settings.
Please check below the matrix for an overview where which scope is asserted.

| Claims                                            | Userinfo       | Introspection                           | ID Token                                                                                                           | Access Token                                         |
| ------------------------------------------------- | -------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| acr                                               | No             | No                                      | Yes                                                                                                                | No                                                   |
| act                                               | No             | After Token Exchange with `actor_token` | After Token Exchange with `actor_token`                                                                            | When JWT and after Token Exchange with `actor_token` |
| address                                           | When requested | When requested                          | When requested and response_type `id_token`                                                                        | No                                                   |
| amr                                               | No             | No                                      | Yes                                                                                                                | No                                                   |
| aud                                               | No             | Yes                                     | Yes                                                                                                                | When JWT                                             |
| auth_time                                         | No             | No                                      | Yes                                                                                                                | No                                                   |
| azp (client_id when Introspect)                   | No             | Yes                                     | Yes                                                                                                                | When JWT                                             |
| email                                             | When requested | When requested                          | When requested and response_type `id_token`                                                                        | No                                                   |
| email_verified                                    | When requested | When requested                          | When requested and response_type `id_token`                                                                        | No                                                   |
| exp                                               | No             | Yes                                     | Yes                                                                                                                | When JWT                                             |
| family_name                                       | When requested | When requested                          | When requested and response_type `id_token`                                                                        | No                                                   |
| gender                                            | When requested | When requested                          | When requested and response_type `id_token`                                                                        | No                                                   |
| given_name                                        | When requested | When requested                          | When requested and response_type `id_token`                                                                        | No                                                   |
| iat                                               | No             | Yes                                     | Yes                                                                                                                | When JWT                                             |
| iss                                               | No             | Yes                                     | Yes                                                                                                                | When JWT                                             |
| jti                                               | No             | Yes                                     | No                                                                                                                 | When JWT                                             |
| locale                                            | When requested | When requested                          | When requested and response_type `id_token`                                                                        | No                                                   |
| name                                              | When requested | When requested                          | When requested and response_type `id_token`                                                                        | No                                                   |
| nbf                                               | No             | Yes                                     | No                                                                                                                 | When JWT                                             |
| nonce                                             | No             | No                                      | When provided in the authorization request [1](https://zitadel.com/docs/apis/openidoauth/claims#user-content-fn-1) | No                                                   |
| phone                                             | When requested | When requested                          | When requested and response_type `id_token`                                                                        | No                                                   |
| phone_verified                                    | When requested | When requested                          | When requested and response_type `id_token`                                                                        | No                                                   |
| preferred_username (username when Introspect)     | When requested | When requested                          | Yes                                                                                                                | No                                                   |
| sid                                               | No             | No                                      | Yes                                                                                                                | No                                                   |
| sub                                               | Yes            | Yes                                     | Yes                                                                                                                | When JWT                                             |
| urn:zitadel:iam:org:domain:primary:{domainname}   | When requested | When requested                          | When requested                                                                                                     | When JWT and requested                               |
| urn:zitadel:iam:org:project:roles                 | When requested | When requested                          | When requested or configured                                                                                       | When JWT and requested or configured                 |
| urn:zitadel:iam:user:metadata                     | When requested | When requested                          | When requested                                                                                                     | When JWT and requested                               |
| urn:zitadel:iam:user:resourceowner:id             | When requested | When requested                          | When requested                                                                                                     | When JWT and requested                               |
| urn:zitadel:iam:user:resourceowner:name           | When requested | When requested                          | When requested                                                                                                     | When JWT and requested                               |
| urn:zitadel:iam:user:resourceowner:primary_domain | When requested | When requested                          | When requested                                                                                                     | When JWT and requested                               |

## [Standard Claims](https://zitadel.com/docs/apis/openidoauth/claims#standard-claims)

| Claims             | Example                                                        | Description                                                                                                                                                                |
| ------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| acr                | TBA                                                            | TBA                                                                                                                                                                        |
| act                | `{"iss": "${CUSTOM_DOMAIN}","sub": "259241944654282754"}`      | JSON object describing the actor from the `actor_token` after [token exchange](https://zitadel.com/docs/guides/integrate/token-exchange#actor-token)                       |
| address            | `Lerchenfeldstrasse 3, 9014 St. Gallen`                        | TBA                                                                                                                                                                        |
| amr                | `pwd mfa`                                                      | Authentication Method References as defined in [RFC8176](https://tools.ietf.org/html/rfc8176)<br>`password` value is deprecated, please check `pwd`                        |
| aud                | `69234237810729019`                                            | The audience of the token, by default all client id's and the project id are included                                                                                      |
| auth_time          | `1311280969`                                                   | Unix time of the authentication                                                                                                                                            |
| azp                | `69234237810729234`                                            | Client id of the client who requested the token                                                                                                                            |
| email              | `road.runner@acme.ch`                                          | Email Address of the subject                                                                                                                                               |
| email_verified     | `true`                                                         | Boolean if the email was verified by ZITADEL                                                                                                                               |
| events             | `{ "http://schemas.openid.net/event/backchannel-logout": {} }` | Security Events such as Back-Channel Logout                                                                                                                                |
| exp                | `1311281970`                                                   | Time the token expires (as unix time)                                                                                                                                      |
| family_name        | `Runner`                                                       | Last name of the subject                                                                                                                                                   |
| family_name        | `Runner`                                                       | Last name of the subject                                                                                                                                                   |
| gender             | `other`                                                        | Gender of the subject                                                                                                                                                      |
| given_name         | `Road`                                                         | First name of the subject                                                                                                                                                  |
| given_name         | `Road`                                                         | First name of the subject                                                                                                                                                  |
| iat                | `1311280970`                                                   | Time of the token was issued at (as unix time)                                                                                                                             |
| iss                | `${CUSTOM_DOMAIN}`                                             | Issuing domain of a token                                                                                                                                                  |
| jti                | `69234237813329048`                                            | Unique id of the token                                                                                                                                                     |
| locale             | `en`                                                           | Language from the subject                                                                                                                                                  |
| name               | `Road Runner`                                                  | The subjects full name                                                                                                                                                     |
| nbf                | `1311280970`                                                   | Time the token must not be used before (as unix time)                                                                                                                      |
| nonce              | `blQtVEJHNTF0WHhFQmhqZ0RqeHJsdzdkd2d...`                       | The nonce provided by the client                                                                                                                                           |
| phone              | `+41 79 XXX XX XX`                                             | Phone number provided by the user                                                                                                                                          |
| phone_verified     | `true`                                                         | Boolean if the phone was verified by ZITADEL                                                                                                                               |
| preferred_username | `road.runner@acme.caos.ch`                                     | ZITADEL's login name of the user. Consist of `username@primarydomain`                                                                                                      |
| sid                | `291693710356251044`                                           | String identifier for a session. This represents a session of a user agent for a logged-in end-User. Different sid values are used to identify distinct sessions at an OP. |
| sub                | `77776025198584418`                                            | Subject ID of the user                                                                                                                                                     |

## [Custom Claims](https://zitadel.com/docs/apis/openidoauth/claims#custom-claims)

Custom claims are being inserted into user tokens in addition to the standard claims.
Your app can use custom claims to handle more complex scenarios, such as restricting access based on these claims.

You can add custom claims using the [complement token flow](https://zitadel.com/docs/apis/actions/complement-token) of the [actions feature](https://zitadel.com/docs/guides/manage/console/actions-overview).

Multiple examples of Actions that result in custom claims can be found in our [Marketplace for ZITADEL Actions](https://github.com/zitadel/actions).

### [Static values as custom claim](https://zitadel.com/docs/apis/openidoauth/claims#static-values-as-custom-claim)

```
https://github.com/zitadel/actions/blob/de69b56f6d0463817953b59a52ffd6afc6a366fb/examples/add_claim.js#L9-L11
```

### [Metadata as custom claim](https://zitadel.com/docs/apis/openidoauth/claims#metadata-as-custom-claim)

```
https://github.com/zitadel/actions/blob/main/examples/add_metadata.js#L9-L15
```

### [Format roles claims](https://zitadel.com/docs/apis/openidoauth/claims#format-roles-claims)

```
https://github.com/zitadel/actions/blob/main/examples/custom_roles.js#L20-L33
```

## [Reserved Claims](https://zitadel.com/docs/apis/openidoauth/claims#reserved-claims)

ZITADEL reserves some claims to assert certain data. Please check out the [reserved scopes](https://zitadel.com/docs/apis/openidoauth/scopes#reserved-scopes).

| Claims                                            | Example                                                                                                  | Description                                                                                                                                                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| urn:zitadel:iam:action:{actionname}:log           | `{"urn:zitadel:iam:action:appendCustomClaims:log": ["test log", "another test log"]}`                    | This claim is set during Actions as a log, e.g. if two custom claims with the same keys are set.                                                                                                                                              |
| urn:zitadel:iam:org:domain:primary:{domainname}   | `{"urn:zitadel:iam:org:domain:primary": "acme.ch"}`                                                      | This claim represents the Organization Domain the user belongs to.                                                                                                                                                                            |
| urn:zitadel:iam:org:project:roles                 | `{"urn:zitadel:iam:org:project:roles": [ {"user": {"id1": "acme.zitade.ch", "id2": "caos.ch"} } ] }`     | When roles are asserted, ZITADEL does this by providing the `id` and `primaryDomain` below the role. This gives you the option to check in which organization a user has the role on the current project (where your application belongs to). |
| urn:zitadel:iam:org:project:{projectid}:roles     | `{"urn:zitadel:iam:org:project:id3:roles": [ {"user": {"id1": "acme.zitade.ch", "id2": "caos.ch"} } ] }` | When roles are asserted, ZITADEL does this by providing the `id` and `primaryDomain` below the role. This gives you the option to check in which organization a user has the role on a specific project.                                      |
| urn:zitadel:iam:user:metadata                     | `{"urn:zitadel:iam:user:metadata": [ {"key": "VmFsdWU=" } ] }`                                           | The metadata claim will include all metadata of a user. The values are base64 encoded.                                                                                                                                                        |
| urn:zitadel:iam:user:resourceowner:id             | `{"urn:zitadel:iam:user:resourceowner:id": "orgid"}`                                                     | This claim represents the user's organization ID.                                                                                                                                                                                             |
| urn:zitadel:iam:user:resourceowner:name           | `{"urn:zitadel:iam:user:resourceowner:name": "ACME"}`                                                    | This claim represents the user's organization's name.                                                                                                                                                                                         |
| urn:zitadel:iam:user:resourceowner:primary_domain | `{"urn:zitadel:iam:user:resourceowner:primary_domain": "acme.ch"}`                                       | This claim represents the user's Organization Domain.                                                                                                                                                                                         |

## [Footnotes](https://zitadel.com/docs/apis/openidoauth/claims#footnote-label)

1. The nonce can also be used to distinguish between an id_token and a logout_token as latter must never include a nonce. [↩](https://zitadel.com/docs/apis/openidoauth/claims#user-content-fnref-1)

Was this page helpful?

[Scopes\\
\\
The standard and ZITADEL-specific OIDC scopes available for identity and authentication requests.](https://zitadel.com/docs/apis/openidoauth/scopes) [Grant Types\\
\\
The OAuth 2.0 grant types supported by ZITADEL, such as Authorization Code and Client Credentials.](https://zitadel.com/docs/apis/openidoauth/grant-types)

[ZITADEL Docs](https://zitadel.com/docs)

[ZITADEL Docs](https://zitadel.com/docs)

Search
`⌘` `K`
ZITADEL Docs (Latest)v4.12v4.11v4.10

Get Started

[Quick Start Guide](https://zitadel.com/docs/guides/start/quickstart)

Key Concepts

Authenticate Users

Example Applications

Use Cases

Onboard Customers and Users

Branding & Customization

Integrate & Authenticate

OIDC & OAuth Flows

[Recommended authorization flows](https://zitadel.com/docs/guides/integrate/login/oidc/oauth-recommended-flows) [OIDC Code Flow + PKCE](https://zitadel.com/docs/guides/integrate/login/oidc/login-users) [Device Authorization Flow](https://zitadel.com/docs/guides/integrate/login/oidc/device-authorization) [OpenID Connect Endpoints](https://zitadel.com/docs/apis/openidoauth/endpoints) [Authentication Methods](https://zitadel.com/docs/apis/openidoauth/authn-methods) [Scopes](https://zitadel.com/docs/apis/openidoauth/scopes) [Claims](https://zitadel.com/docs/apis/openidoauth/claims) [Grant Types](https://zitadel.com/docs/apis/openidoauth/grant-types) [OIDC Playground](https://zitadel.com/docs/apis/openidoauth/authrequest) [Web Keys](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys) [Token Exchange](https://zitadel.com/docs/guides/integrate/token-exchange)

SAML

API Access

SDKs & Integrations

[SCIM](https://zitadel.com/docs/guides/manage/user/scim2)

[Token Introspection](https://zitadel.com/docs/guides/integrate/token-introspection)

[Back-Channel Logout](https://zitadel.com/docs/guides/integrate/back-channel-logout)

External Integrations

Build your own Login UI

Actions

Migrate

Configure Identity & Policies

Test & Debug

Deploy & Operate

Architecture & Concepts

Product, Releases & Support

APIs

Legal Agreements

Grant TypesAuthorization Code

Integrate & AuthenticateOIDC & OAuth Flows

# Grant Types in ZITADEL

For a list of supported or unsupported `Grant Types` please have a look at the table below.

| Grant Type                                            | Supported |
| ----------------------------------------------------- | --------- |
| Authorization Code                                    | yes       |
| Authorization Code with PKCE                          | yes       |
| Client Credentials                                    | yes       |
| Device Authorization                                  | yes       |
| Implicit                                              | yes       |
| JSON Web Token (JWT) Profile                          | yes       |
| Refresh Token                                         | yes       |
| Resource Owner Password Credentials                   | no        |
| Security Assertion Markup Language (SAML) 2.0 Profile | no        |
| Token Exchange                                        | yes       |

## [Authorization Code](https://zitadel.com/docs/apis/openidoauth/grant-types#authorization-code)

**Link to spec.** [The OAuth 2.0 Authorization Framework Section 1.3.1](https://tools.ietf.org/html/rfc6749#section-1.3.1)

## [Proof Key for Code Exchange](https://zitadel.com/docs/apis/openidoauth/grant-types#proof-key-for-code-exchange)

**Link to spec.** [Proof Key for Code Exchange by OAuth Public Clients](https://tools.ietf.org/html/rfc7636)

## [Implicit](https://zitadel.com/docs/apis/openidoauth/grant-types#implicit)

**Link to spec.** [The OAuth 2.0 Authorization Framework Section 1.3.2](https://tools.ietf.org/html/rfc6749#section-1.3.2)

## [Client Credentials](https://zitadel.com/docs/apis/openidoauth/grant-types#client-credentials)

**Link to spec.** [The OAuth 2.0 Authorization Framework Section 1.3.4](https://tools.ietf.org/html/rfc6749#section-1.3.4)

## [Refresh Token](https://zitadel.com/docs/apis/openidoauth/grant-types#refresh-token)

**Link to spec.** [The OAuth 2.0 Authorization Framework Section 1.5](https://tools.ietf.org/html/rfc6749#section-1.5)

## [JSON Web Token (JWT) Profile](https://zitadel.com/docs/apis/openidoauth/grant-types#json-web-token-jwt-profile)

**Link to spec.** [JSON Web Token (JWT) Profile for OAuth 2.0 Client Authentication and Authorization Grants](https://tools.ietf.org/html/rfc7523)

### [Using JWTs as Authorization Grants](https://zitadel.com/docs/apis/openidoauth/grant-types#using-jw-ts-as-authorization-grants)

Our service account works with the JWT profile to authenticate them against ZITADEL.

1. Create or use an existing service account
2. Create a new key and download it
3. Generate a JWT with the structure below and sign it with the downloaded key
4. Send the JWT Base64 encoded to ZITADEL's token endpoint
5. Use the received access token

---

Key JSON

| Key    | Example                                                             | Description                                                          |
| ------ | ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| type   | `"serviceaccount"`                                                  | The type of account, right now only serviceaccount is valid          |
| keyId  | `"81693565968772648"`                                               | This is unique ID of the key                                         |
| key    | `"-----BEGIN RSA PRIVATE KEY-----...-----END RSA PRIVATE KEY-----"` | The private key generated by ZITADEL, this can not be regenerated!   |
| userId | `78366401571647008`                                                 | The service accounts ID, this is the same as the subject from tokens |

```
{
	"type": "serviceaccount",
	"keyId": "81693565968772648",
	"key": "-----BEGIN RSA PRIVATE KEY-----...-----END RSA PRIVATE KEY-----",
	"userId": "78366401571647008"
}
```

---

JWT

| Claim | Example                      | Description                                                                                                   |
| ----- | ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| aud   | `"https://${CUSTOM_DOMAIN}"` | String or Array of intended audiences MUST include ZITADEL's issuing domain                                   |
| exp   | `1605183582`                 | Unix timestamp of the expiry                                                                                  |
| iat   | `1605179982`                 | Unix timestamp of the creation singing time of the JWT, MUST NOT be older than 1h                             |
| iss   | `"77479219772321307"`        | String which represents the requesting party (owner of the key), normally the `userId` from the json key file |
| sub   | `"77479219772321307"`        | The subject ID of the service account, normally the `userId` from the json key file                           |

```
{
	"iss": "77479219772321307",
	"sub": "77479219772321307",
	"aud": "https://${CUSTOM_DOMAIN}",
	"exp": 1605183582,
	"iat": 1605179982
}
```

> To identify your key, it is necessary that you provide a JWT with a `kid` header claim representing your keyId from the Key JSON:
>
> ```
> {
>   "alg": "RS256",
>   "kid": "81693565968772648"
> }
> ```

---

See [JWT Profile Grant on Token Endpoint](https://zitadel.com/docs/apis/openidoauth/endpoints#token-endpoint) for usage.

### [Using JWTs for Client Authentication](https://zitadel.com/docs/apis/openidoauth/grant-types#using-jw-ts-for-client-authentication)

See how to build a [JWT for client authentication](https://zitadel.com/docs/apis/openidoauth/authn-methods#jwt-with-private-key) from the downloaded key.

Find out how to use it on the [token endpoint](https://zitadel.com/docs/apis/openidoauth/endpoints#token-endpoint) or the [introspection endpoint](https://zitadel.com/docs/apis/openidoauth/endpoints#introspection-endpoint).

## [Token Exchange](https://zitadel.com/docs/apis/openidoauth/grant-types#token-exchange)

**Link to spec.** [OAuth 2.0 Token Exchange](https://tools.ietf.org/html/rfc8693)

## [Device Authorization](https://zitadel.com/docs/apis/openidoauth/grant-types#device-authorization)

**Link to spec.** [OAuth 2.0 Device Authorization Grant](https://tools.ietf.org/html/rfc8628)

## [Security Assertion Markup Language (SAML) 2.0 Profile](https://zitadel.com/docs/apis/openidoauth/grant-types#security-assertion-markup-language-saml-2-0-profile)

**Link to spec.** [Security Assertion Markup Language (SAML) 2.0 Profile for OAuth 2.0 Client Authentication and Authorization Grants](https://tools.ietf.org/html/rfc7522)

## [Not Supported Grant Types](https://zitadel.com/docs/apis/openidoauth/grant-types#not-supported-grant-types)

### [Resource Owner Password Credentials](https://zitadel.com/docs/apis/openidoauth/grant-types#resource-owner-password-credentials)

> Due to growing security concerns we do not support this grant type. With OAuth 2.1 it looks like this grant will be removed.

**Link to spec.** [The OAuth 2.0 Authorization Framework Section 1.3.3](https://tools.ietf.org/html/rfc6749#section-1.3.3)

Was this page helpful?

[Claims\\
\\
Standard OIDC and custom claims issued by ZITADEL in ID tokens, access tokens, and via the Userinfo endpoint.](https://zitadel.com/docs/apis/openidoauth/claims) [OIDC Playground\\
\\
The OIDC playground for testing and constructing authentication requests.](https://zitadel.com/docs/apis/openidoauth/authrequest)

[ZITADEL Docs](https://zitadel.com/docs)

[ZITADEL Docs](https://zitadel.com/docs)

Search
`⌘` `K`
ZITADEL Docs (Latest)v4.12v4.11v4.10

Get Started

[Quick Start Guide](https://zitadel.com/docs/guides/start/quickstart)

Key Concepts

Authenticate Users

Example Applications

Use Cases

Onboard Customers and Users

Branding & Customization

Integrate & Authenticate

OIDC & OAuth Flows

[Recommended authorization flows](https://zitadel.com/docs/guides/integrate/login/oidc/oauth-recommended-flows) [OIDC Code Flow + PKCE](https://zitadel.com/docs/guides/integrate/login/oidc/login-users) [Device Authorization Flow](https://zitadel.com/docs/guides/integrate/login/oidc/device-authorization) [OpenID Connect Endpoints](https://zitadel.com/docs/apis/openidoauth/endpoints) [Authentication Methods](https://zitadel.com/docs/apis/openidoauth/authn-methods) [Scopes](https://zitadel.com/docs/apis/openidoauth/scopes) [Claims](https://zitadel.com/docs/apis/openidoauth/claims) [Grant Types](https://zitadel.com/docs/apis/openidoauth/grant-types) [OIDC Playground](https://zitadel.com/docs/apis/openidoauth/authrequest) [Web Keys](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys) [Token Exchange](https://zitadel.com/docs/guides/integrate/token-exchange)

SAML

API Access

SDKs & Integrations

[SCIM](https://zitadel.com/docs/guides/manage/user/scim2)

[Token Introspection](https://zitadel.com/docs/guides/integrate/token-introspection)

[Back-Channel Logout](https://zitadel.com/docs/guides/integrate/back-channel-logout)

External Integrations

Build your own Login UI

Actions

Migrate

Configure Identity & Policies

Test & Debug

Deploy & Operate

Architecture & Concepts

Product, Releases & Support

APIs

Legal Agreements

Web KeysIntroduction

Integrate & AuthenticateOIDC & OAuth Flows

# OpenID Connect and OAuth2 web keys

Web Keys in ZITADEL are used to sign and verify JSON Web Tokens (JWT).
ID tokens are created, signed and returned by ZITADEL when a OpenID connect (OIDC) or OAuth2
authorization flow completes and a user is authenticated.
Optionally, ZITADEL can return JWTs for access tokens if the OIDC Application is configured for it.

## [Introduction](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#introduction)

ZITADEL uses asymmetric cryptography to sign and validate JWTs.
Keys are generated in pairs resulting in a private and public key.
Private keys are used to sign tokens.
Public keys are used to verify tokens.
OIDC clients need the public key to verify ID tokens.
OAuth2 API apps might need the public key if they want to client-side verification of a
JWT access tokens, instead of [introspection](https://zitadel.com/docs/apis/openidoauth/endpoints#introspection-endpoint).
ZITADEL uses public key verification when API calls are made or when the userInfo or introspection
endpoints are called with a JWT access token.

### [JSON Web Key](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#json-web-key)

ZITADEL implements the [RFC7517 - JSON Web Key (JWK)](https://www.rfc-editor.org/rfc/rfc7517) format for storage and distribution of public keys.
Web keys in ZITADEL support a number of [JSON Web Algorithms (JWA)](https://www.rfc-editor.org/rfc/rfc7518) for digital signatures:

| Identifier | Description                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| RS256      | RSASSA-PKCS1-v1_5 using SHA-256                                                                               |
| RS384      | RSASSA-PKCS1-v1_5 using SHA-384                                                                               |
| RS512      | RSASSA-PKCS1-v1_5 using SHA-512                                                                               |
| ES256      | ECDSA using P-256 and SHA-256                                                                                 |
| ES384      | ECDSA using P-384 and SHA-384                                                                                 |
| ES512      | ECDSA using P-512 and SHA-512                                                                                 |
| EdDSA      | EdDSA signature algorithms[1](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#user-content-fn-1) |

### [Client Algorithm Support](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#client-algorithm-support)

Before customizing the algorithm the instance admin **MUST** make sure the complete app and API ecosystem
supports the chosen algorithm.

When all OIDC applications of an instance use opaque access tokens, and they call APIs which only use
introspection for token validation, only the OIDC applications will need to support the chosen algorithm.
If JWT access tokens are used and APIs do public key verification, those APIs need to support the chosen algorithm as well.

RS256 is widely considered the default algorithm and must be supported by all OIDC/Oauth2 providers, relying parties and resource servers.
This is also the default ZITADEL uses when [creating web keys](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#creation).
It might be reasonable to assume RS384 and RS512 are just as supported, because those are just variations on RSA based keys.
The ES256, ES384 and ES512 might have reasonable support as well,
ECDSA is part of the same [JSON Web Algorithms (JWA)](https://www.rfc-editor.org/rfc/rfc7518) as RSA.

EdDSA usage is defined in the supplemental [RFC8037](https://www.rfc-editor.org/rfc/rfc8037),
and therefore may be less supported than the others.
Also, the `at_hash` claim in the ID token is a hashed string of the access token.
The hasher is usually defined by the keys `alg` header. For example:

- RS256 defines an RSA key and a SHA256 hasher.
- ES512 defines an elliptic curve key with the P-512 and SHA512 hasher.

Unfortunately, there is no published standard for the `at_hash` hasher used for EdDSA.
In fact, EdDSA may use different curves and internally uses different hashers:

- ed25519 uses SHA512;
- ed448 uses SHAKE256;

This resulted in a [proposal](https://bitbucket.org/openid/connect/issues/1125/_hash-algorithm-for-eddsa-id-tokens) at
the Open ID workgroup to follow suit and use the same hashing algorithms for the `at_hash` claim.
This means both signers and verifiers can't know the hasher by the `alg` value alone and need to inspect `crv` value as well.
Since the decision in the proposal isn't published yet,
there is a big change some OIDC client libraries don't have proper support for EdDSA / ed25519.

The ZITADEL back-end is written in Go. The Go developers have denied ed448 curve implementations to be included.
Therefore, ZITADEL only uses ed25519 with a SHA512.
The same counts for [zitadel/oidc](https://github.com/zitadel/oidc) Go library.

## [Web Key management](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#web-key-management)

ZITADEL provides a resource based [web keys API](https://zitadel.com/docs/reference/api/webkey).
The API allows the creation, activation, deletion and listing of web keys.
All public keys that are stored for an instance are served on the [JWKS endpoint](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#json-web-key-set).
Applications need public keys for token verification and not all applications are capable of on-demand
key fetching when receiving a token with an unknown key ID (`kid` header claim).
Instead, those application may do a time-based refresh or only load keys at startup.

Using the web keys API, keys can be created first and activated for signing later.
This allows the keys to be distributed to the instance's apps and caches.
Once a key is deactivated, its public key will remain available for token verification until the web key is deleted.
Delayed deletion makes sure tokens that were signed before the key got deactivated remain valid.

When the `web_key` [feature](https://zitadel.com/docs/reference/api/feature/zitadel.feature.v2.FeatureService.SetInstanceFeatures) is enabled the first time,
two web key pairs are created with one activated.

### [Creation](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#creation)

The web key [create](https://zitadel.com/docs/apis/resources/webkey_service_v2/zitadel-webkey-v-2-web-key-service-create-web-key) endpoint generates a new web key pair,
using the passed generator settings from the request. This config is a one-of field of:

- RSA
- ECDSA
- ED25519

When the request does not contain any specific settings,
[RSA](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#rsa) is used as default with the default options as described below:

```
curl -L 'https://${CUSTOM_DOMAIN}/v2/web_keys' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
-H 'Authorization: Bearer <TOKEN>' \
-d '{}'
```

#### [RSA](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#rsa)

The RSA generator config takes two enum values.

- The `bits` fields determines the size of the RSA key:
  - `RSA_BITS_2048` ( **default**)
  - `RSA_BITS_3072`
  - `RSA_BITS_4096`
- The `hasher` field sets the hash mode and
  determines the `alg` header value of the web key:
  - `RSA_HASHER_SHA256` results in the RS256 algorithm header. ( **default**)
  - `RSA_HASHER_SHA384` results in the RS384 algorithm header.
  - `RSA_HASHER_SHA512` results in the RS512 algorithm header.

For example, to create an RSA web key with the size of 3072 bits and the SHA512 algorithm (RS512):

```
curl -L 'https://${CUSTOM_DOMAIN}/v2/web_keys' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
-H 'Authorization: Bearer <TOKEN>' \
-d '{
  "rsa": {
    "bits": "RSA_BITS_3072",
    "hasher": "RSA_HASHER_SHA512"
  }
}'
```

#### [ECDSA](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#ecdsa)

The ECDSA generator config takes a single `curve` enum value which determines both the key's curve parameters and hashing algorithm:

- `ECDSA_CURVE_P256` uses the NIST P-256 curve and sets the ES256 algorithm header.
- `ECDSA_CURVE_P384` uses the NIST P-384 curve and sets the ES384 algorithm header.
- `ECDSA_CURVE_P512` uses the NIST P-512 curve and sets the ES512 algorithm header.

For example, to create a ECDSA web key with a P-256 curve and the SHA256 algorithm:

```
curl -L 'https://${CUSTOM_DOMAIN}/v2/web_keys' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
-H 'Authorization: Bearer <TOKEN>' \
-d '{
  "ecdsa": {
    "curve": "ECDSA_CURVE_P256"
  }
}'
```

#### [ED25519](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#ed-25519)

ED25519 is an EdDSA curve and currently the only EdDSA curve supported by ZITADEL.[2](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#user-content-fn-2)
No config is needed for ed25519 as its specification already includes the curve parameters.
ed25519 always uses the SHA512 hasher.

Note that the `alg` header for ed25519 is `EdDSA` and refers to both ed25519 and ed448 curves.
Both curves specify different hashers.
Clients which support both curves must inspect `crv` header value to assert the difference.

For example, to create an ed25519 web key:

```
curl -L 'https://${CUSTOM_DOMAIN}/v2/web_keys' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
-H 'Authorization: Bearer <TOKEN>' \
-d '{
  "ed25519": {}
}'
```

### [Activation](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#activation)

When a generated web key is [activated](https://zitadel.com/docs/apis/resources/webkey_service_v2/zitadel-webkey-v-2-web-key-service-activate-web-key),
its private key will be used to sign new tokens.
There can be only one active key on an instance.
Activating a key implies deactivation of the previously active key.

Public keys on the [JWKS](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#json-web-key-set) endpoint may be [cached](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#caching).
Therefore, it is advised to delay activation after generating a key,
at least for the duration of the max-age setting plus any time it might take for client applications to refresh.

### [Deletion](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#deletion)

Non-active keys may be [deleted](https://zitadel.com/docs/apis/resources/webkey_service_v2/zitadel-webkey-v-2-web-key-service-delete-web-key).
Deletion also means tokens signed with this key become invalid.
Active keys can't be deleted.
As each public key is available on the [JWKS](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#json-web-key-set) endpoint,
it is important to clean up old web keys that are no longer needed.
Otherwise, the endpoint's response size will only grow over time, which might lead to performance issues.

Once a key was activated and deactivated (by activation of the next key) deletion should wait:

- Until access and ID tokens are expired. See [OIDC token lifetimes](https://zitadel.com/docs/guides/manage/console/default-settings#oidc-token-lifetimes-and-expiration).
- ID tokens may be used as `id_token_hint` in authentication and end-session requests. The hint typically doesn't expire, but becomes invalid once the key is deleted.
  It might be desirable to keep keys around long enough to minimize user impact.

### [Rotation example](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#rotation-example)

This section gives an example on a key rotation strategy.
This strategy aims to fulfill the following requirements:

1. Web keys are rotated monthly.
2. Applications have enough time to see the next activated web key on the [JWKS](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#json-web-key-set) endpoint.
3. Web keys are kept long enough to cover the access and ID token validity of 24 hours.
4. Web keys are kept long enough to allow usage of the `id_token_hint` for at least 3 months.
   Users that haven't logged in / refreshed tokens with the client application for that period,
   will need to re-enter their username.

When the instance was created, resp. the feature was rolled out, the instance got two keys with the first one activated. When this feature becomes generally available, instance creation will set up the first two keys in the same way. So the initial state always looks like this:

| id  | created    | changed    | state           |
| --- | ---------- | ---------- | --------------- |
| 1   | 2025-01-01 | 2025-01-01 | `STATE_ACTIVE`  |
| 2   | 2025-01-01 | 2025-01-01 | `STATE_INITIAL` |

For the sake of this example we will use simplified IDs and restrict timestamps to dates.

After one month, on 2025-02-01, we wish to activate the next available key and create a new key to be available for activation next month. This fulfills requirements 1 and 2.

```
curl -L -X POST 'https://${CUSTOM_DOMAIN}/v2/web_keys/2/_activate' \
-H 'Accept: application/json' \
-H 'Authorization: Bearer <TOKEN>'

curl -L 'https://${CUSTOM_DOMAIN}/v2/web_keys' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
-H 'Authorization: Bearer <TOKEN>' \
-d '{}'
```

Key ID 2 became active, Key ID 1 became inactive and a new key with ID 3 was created:

| id  | created    | changed    | state            |
| --- | ---------- | ---------- | ---------------- |
| 1   | 2025-01-01 | 2025-02-01 | `STATE_INACTIVE` |
| 2   | 2025-01-01 | 2025-02-01 | `STATE_ACTIVE`   |
| 3   | 2025-02-01 | 2025-02-01 | `STATE_INITIAL`  |

No keys are deleted yet.
We continue like this monthly.
At one point (on 2025-05-01) we will have a web key with `STATE_INACTIVE` with a changed date of 3 months ago:

| id  | created    | changed    | state            |
| --- | ---------- | ---------- | ---------------- |
| 1   | 2025-01-01 | 2025-02-01 | `STATE_INACTIVE` |
| 2   | 2025-01-01 | 2025-03-01 | `STATE_INACTIVE` |
| 3   | 2025-02-01 | 2025-04-01 | `STATE_INACTIVE` |
| 4   | 2025-03-01 | 2025-05-01 | `STATE_INACTIVE` |
| 5   | 2025-04-01 | 2025-05-01 | `STATE_ACTIVE`   |
| 6   | 2025-05-01 | 2025-05-01 | `STATE_INITIAL`  |

In addition to the activate and create calls we made on this iteration,
we can now safely delete the oldest key, as both requirement 3 and 4 are now fulfilled:

```
curl -L -X DELETE 'https://${CUSTOM_DOMAIN}/v2/web_keys/1' \
-H 'Accept: application/json' \
-H 'Authorization: Bearer <TOKEN>'
```

The final state:

| id  | created    | changed    | state            |
| --- | ---------- | ---------- | ---------------- |
| 2   | 2025-01-01 | 2025-03-01 | `STATE_INACTIVE` |
| 3   | 2025-02-01 | 2025-04-01 | `STATE_INACTIVE` |
| 4   | 2025-03-01 | 2025-05-01 | `STATE_INACTIVE` |
| 5   | 2025-04-01 | 2025-05-01 | `STATE_ACTIVE`   |
| 6   | 2025-05-01 | 2025-05-01 | `STATE_INITIAL`  |

Next month, Key ID 6 will be activated, a new key added and Key ID 2 can be deleted.

## [JSON web key set](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#json-web-key-set)

The JSON web key set (JWKS) endpoint serves all available public keys for the instance on
`${CUSTOM_DOMAIN}/oauth/v2/keys`. This includes activated, newly non-activated and deactivated web keys. The response format is defined in [RFC7517, section 5: JWK Set Format](https://www.rfc-editor.org/rfc/rfc7517#section-5).

And looks like:

```
{
  "keys": [\
    {\
      "use": "sig",\
      "kty": "RSA",\
      "kid": "280543383892525058",\
      "alg": "RS384",\
      "n": "0pVcbjTEr-awBmvztGLbBJB_-_YwjCKKXURJRpoXrChlaqtAvbkxby7mu9wSKAibxnvaobfuxnQydlB4CoKObUr00ARVBNeP5HLzeQUEx3CZh3s1LsjiuYov_yyvK9D12WH1LikP4ZPS68j-DVoEOEcFAE6cNikXTeDyCKa-ixROALieRXUQXTlvVyA_s0FhevmH0-M6rEN4YcfQuIZACEv2nQ4AJo0sNnugwrrqNn595ONKMSh2XTVngxxAD3TGHXg9bELB-WmgnZamVbO-ObpDBp5Ov73HL60_UoBTzBDECM6ovl52fHusLFw6Vkdt9_W3QhuRFljNqTPnna6rB-bLptQltBpnSBV3TxmklBcQ1EO3qeGvgOJsmDwSRlr28Du_1pyFMFANnG174eX5XrYASqTgJ1Wq7AfMBmv7YwGU7PbMce1V_CAV9u_hNkMJf0xQ4AIqrQ98f9hC5VCdCoKSOH1-1d8icEu7UmDyJohWqvY7xGOM_0Abx8ekMRT2O9PulmQ22me_GI5zXh7iv9yaoNq8EUNP5bdtr-ZG4PG8mqpLDSLpCpobYRK5AynyJkf-7_6neSy-ihu604ADKsNzB-uO58V8MPFdSPncyuUeTPX4dAVajbFyMtoAjtI1k_HYMU8nojRUrLSCJae9b0KtcPm9s7dCIL1Zpa4B-YM",\
      "e": "AQAB"\
    },\
    {\
      "use": "sig",\
      "kty": "OKP",\
      "kid": "280998627474669570",\
      "crv": "Ed25519",\
      "alg": "EdDSA",\
      "x": "B51hFhRUHMHpqO1f-OThtnk3PfnRFaPFJWCLXSM_kuI"\
    },\
    {\
      "use": "sig",\
      "kty": "EC",\
      "kid": "282465789963927554",\
      "crv": "P-256",\
      "alg": "ES256",\
      "x": "X5s3tNoIXd5odp_-IwQq5oaAgMSoAxj0hwQ1DgHihmI",\
      "y": "JqmTlRjoOv5bY5E9tAZXHaUHUamAAAFshO8zLhEZ9ZM"\
    }\
  ]
}
```

After the `web_key` feature is enabled, the response may still contain legacy keys, in order not to invalidate older sessions.
The legacy keys will disappear once they expire.

### [Caching](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#caching)

As web keys can be created and distributed ahead of time, it is safe for JWKS responses to be cached at intermediate proxies.
Once the `web_key` feature is enabled, ZITADEL will send a `Cache-Control` header which allows caching.

By default, and in ZITADEL, Cloud we allow 5 minutes of caching:

```
Cache-Control: max-age=300, must-revalidate
```

Self-hosters can modify this setting through the `ZITADEL_OIDC_JWKSCACHECONTROLMAXAGE`
environment variable or in the settings yaml:

```
OIDC:
  JWKSCacheControlMaxAge: 5m
```

Setting the value to `0` will result in a `no-store` value in the `Cache-Control` header.

## [Footnotes](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#footnote-label)

1. EdDSA refers to both Ed25519 and Ed448 curves. ZITADEL only supports Ed25519 with a SHA-512 hashing algorithm. EdDSA is for JSON Object Signing is defined in [RFC8037](https://www.rfc-editor.org/rfc/rfc8037). [↩](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#user-content-fnref-1)

2. The ZITADEL back-end is written in Go. The Go developers have denied ed448 curve implementations to be included.
   Therefore, ZITADEL won't support this either. [↩](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys#user-content-fnref-2)

Was this page helpful?

[OIDC Playground\\
\\
The OIDC playground for testing and constructing authentication requests.](https://zitadel.com/docs/apis/openidoauth/authrequest) [Token Exchange\\
\\
Exchange tokens with different scopes, audiences, or subjects using RFC 8693 OAuth 2.0 Token Exchange grant and ZITADEL](https://zitadel.com/docs/guides/integrate/token-exchange)

[ZITADEL Docs](https://zitadel.com/docs)

[ZITADEL Docs](https://zitadel.com/docs)

Search
`⌘` `K`
ZITADEL Docs (Latest)v4.12v4.11v4.10

Get Started

[Quick Start Guide](https://zitadel.com/docs/guides/start/quickstart)

Key Concepts

Authenticate Users

Example Applications

Use Cases

Onboard Customers and Users

Branding & Customization

Integrate & Authenticate

OIDC & OAuth Flows

[Recommended authorization flows](https://zitadel.com/docs/guides/integrate/login/oidc/oauth-recommended-flows) [OIDC Code Flow + PKCE](https://zitadel.com/docs/guides/integrate/login/oidc/login-users) [Device Authorization Flow](https://zitadel.com/docs/guides/integrate/login/oidc/device-authorization) [OpenID Connect Endpoints](https://zitadel.com/docs/apis/openidoauth/endpoints) [Authentication Methods](https://zitadel.com/docs/apis/openidoauth/authn-methods) [Scopes](https://zitadel.com/docs/apis/openidoauth/scopes) [Claims](https://zitadel.com/docs/apis/openidoauth/claims) [Grant Types](https://zitadel.com/docs/apis/openidoauth/grant-types) [OIDC Playground](https://zitadel.com/docs/apis/openidoauth/authrequest) [Web Keys](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys) [Token Exchange](https://zitadel.com/docs/guides/integrate/token-exchange)

SAML

API Access

SDKs & Integrations

[SCIM](https://zitadel.com/docs/guides/manage/user/scim2)

[Token Introspection](https://zitadel.com/docs/guides/integrate/token-introspection)

[Back-Channel Logout](https://zitadel.com/docs/guides/integrate/back-channel-logout)

External Integrations

Build your own Login UI

Actions

Migrate

Configure Identity & Policies

Test & Debug

Deploy & Operate

Architecture & Concepts

Product, Releases & Support

APIs

Legal Agreements

Token Exchange

Integrate & AuthenticateOIDC & OAuth Flows

# Impersonation and delegation using Token Exchange

The Token Exchange grant implements [RFC 8693, OAuth 2.0 Token Exchange](https://www.rfc-editor.org/rfc/rfc8693) and can be used to exchange tokens to a different scope, audience or subject. Changing the subject of an authenticated token is called impersonation or delegation. This guide will explain how token exchange is implemented inside ZITADEL and gives some usage examples.

In this guide we assume that the application performing the token exchange is already in possession of tokens. You should already have a good understanding on the following topics before starting with this guide:

- Integrate your app with the [OIDC flow](https://zitadel.com/docs/guides/integrate/login/oidc/login-users) to obtain tokens
- [Claims](https://zitadel.com/docs/apis/openidoauth/claims)
- [Scope](https://zitadel.com/docs/apis/openidoauth/scopes)
- Audience

## [The basics](https://zitadel.com/docs/guides/integrate/token-exchange#the-basics)

Token Exchange is a complex and broad subject. Before we get our hands dirty with the "how-to" part, lets first cover some basics.

### [Token types](https://zitadel.com/docs/guides/integrate/token-exchange#token-types)

Token Exchange offers a range of possibilities for providing and requesting different token types. The existence of the various `*_token_type` fields in the request and response data helps defining which tokens we are sending, which ones we wish to receive and finally which one(s) we did receive in the response.

The following table provides a matrix of supported token type parameter and responses for Token Exchange.

| Identifier                                       | subject_token                                                | actor_token   | requested_token_type |
| ------------------------------------------------ | ------------------------------------------------------------ | ------------- | -------------------- |
| `urn:ietf:params:oauth:token-type:access_token`  | JWT or Opaque                                                | JWT or Opaque | Opaque only          |
| `urn:ietf:params:oauth:token-type:refresh_token` | Not allowed                                                  | Not allowed   | Not allowed          |
| `urn:ietf:params:oauth:token-type:id_token`      | Allowed                                                      | Allowed       | Allowed              |
| `urn:ietf:params:oauth:token-type:jwt`           | JWT signed by client, only in combination with `actor_token` | Not allowed   | Access Token as JWT  |
| `urn:zitadel:params:oauth:token-type:user_id`    | user ID as string, only in combination with `actor_token`    | Not allowed   | Not allowed          |

#### [Access Token type](https://zitadel.com/docs/guides/integrate/token-exchange#access-token-type)

```
urn:ietf:params:oauth:token-type:access_token
```

Access tokens can be supplied in the request, or requested to be in the response. When supplied as `subject_token` or `actor_token` this may be an opaque token or JWT.
The client does not need to care about the difference between the access token types in this case, it can pass the `access_token` value previously obtained from the token endpoint as-is.

When requesting an access token, token exchange will always return an opaque token. If a JWT is required, use the `urn:ietf:params:oauth:token-type:jwt` identifier for `requested_token_type`.

#### [Refresh Token type](https://zitadel.com/docs/guides/integrate/token-exchange#refresh-token-type)

```
urn:ietf:params:oauth:token-type:refresh_token
```

At the moment we do not support sending refresh tokens as part of the Token Exchange grant. Instead, use the [`refresh_token` grant](https://zitadel.com/docs/apis/openidoauth/endpoints#refresh-token-grant).

#### [ID Token type](https://zitadel.com/docs/guides/integrate/token-exchange#id-token-type)

```
urn:ietf:params:oauth:token-type:id_token
```

ID Tokens can be supplied as `subject_token` and `actor_token`. We currently reject any expired ID Tokens, even as `subject_token`. This might change in future.

When requested as `requested_token_type`, the [response](https://zitadel.com/docs/guides/integrate/token-exchange#token-exchange-response) will carry the ID Token in the `access_token` field. The `token_type` will be set `N_A`, meaning that the returned `access_token` value cannot be used as Access Token. This is how the RFC specifies the behavior.

If you want both a "real" access token and ID token, request an access token or JWT token-type and set the `openid` scope. This will return both tokens similar to the other grand types.

#### [JWT Token type](https://zitadel.com/docs/guides/integrate/token-exchange#jwt-token-type)

```
urn:ietf:params:oauth:token-type:jwt
```

The JWT token type caries a double meaning.

When used as a `subject_token_type`, ZITADEL will try to verify the `subject_token` in a similar way as a JWT Profile. The `sub` field of the JWT is used to set the subject of the requested token. Currently we only allow self-signed JWT as `subject_token` in combination with a valid `actor_token` for impersonation. A self-signed JWT is not enough to obtain other token types from the Token Exchange Grant. You will need to use the [JWT Profile grant](https://zitadel.com/docs/apis/openidoauth/endpoints#jwt-profile-grant) instead.

When used as a `requested_token_type`, ZITADEL will return an access token as JWT.

#### [User ID Token type](https://zitadel.com/docs/guides/integrate/token-exchange#user-id-token-type)

```
urn:zitadel:params:oauth:token-type:user_id
```

Technically not a token and an addition to the standard. It is provided for impersonation cases where there is no token available yet for the impersonated user.
This allows setting the plain zitadel user ID in the `subject_token`, along with a valid `actor_token` from the impersonator. The existence of the user is checked.

Sending only the user ID in the `subject_token` is not allowed and will result in an error.

### [Token exchange request](https://zitadel.com/docs/guides/integrate/token-exchange#token-exchange-request)

The details supplied in the request changes how Token Exchange operates. While the standard is very permissive, we need to clarify how ZITADEL implements it.

| Parameter            | Description                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| grant_type           | Must be `urn:ietf:params:oauth:grant-type:token-exchange`                                                                                                                           |
| subject_token        | A token that represents the identity of the party on behalf of whom the request is being made.                                                                                      |
| subject_token_type   | An identifier that indicates the type of the token in the subject_token parameter.                                                                                                  |
| actor_token          | Optional. A token that represents the identity of the acting party. In ZITADEL this the impersonator.                                                                               |
| actor_token_type     | An identifier that indicates the type of the token in the actor_token parameter. Required when actor_token is provided                                                              |
| requested_token_type | Optional. An identifier that indicates the type of the token requested. Defaults to access token if not provided.                                                                   |
| scope                | [Scopes](https://zitadel.com/docs/apis/openidoauth/scopes) you would like to request from ZITADEL for the requested token. Scopes are space delimited, e.g. `openid email profile`. |
| audience             | Optional. Must be a subset of the combined audiences from both subject and actor tokens.                                                                                            |
| resource             | Currently not supported                                                                                                                                                             |

#### [Subject token](https://zitadel.com/docs/guides/integrate/token-exchange#subject-token)

The `subject_token` and `subject_token_type` fields come in a pair. The [token type](https://zitadel.com/docs/guides/integrate/token-exchange#token-types) describes the subject token that is passed. This tells ZITADEL how we can verify the token.

The subject token is the most basic input for the token exchange. It describes for _who_ we want to obtain a token. If only the `subject_token` with proper `subject_token_type` are supplied, a new access token is returned for the same user, with the same scope and the same audience.

We currently allow all token types, except refresh tokens, to be used as subject token. The JWT and User ID types depend on the presence of the [`actor_token`](https://zitadel.com/docs/guides/integrate/token-exchange#actor-token)

#### [Actor token](https://zitadel.com/docs/guides/integrate/token-exchange#actor-token)

The actor parameters are optional and enable impersonation and delegation. At ZITADEL we don't make any distinction between the two concepts, so we call both cases impersonation from this point.The `actor_token` and `actor_token_type` come in a pair. If the actor token is provided, the actor token type must also be specified.

Currently only a valid access token or ID token are allowed as actor token. The user represented by the actor token must have the [impersonation permission](https://zitadel.com/docs/guides/integrate/token-exchange#impersonation-permissions) set, or else the request will be rejected and an error returned.

#### [Requested token type](https://zitadel.com/docs/guides/integrate/token-exchange#requested-token-type)

The `requested_token_type` is an optional field that tells ZITADEL the type of token that is requested for the `access_token` response field. Note that the response can also contain ID and refresh tokens, based on [scope](https://zitadel.com/docs/guides/integrate/token-exchange#scope), even if the requested token type was an access token.

Currently ZITADEL supports requesting of:

- Opaque Access Token with the `urn:ietf:params:oauth:token-type:access_token` type;
- JWT Access Token with the `urn:ietf:params:oauth:token-type:jwt` type;
- ID Token with the `urn:ietf:params:oauth:token-type:id_token` type;

#### [Scope](https://zitadel.com/docs/guides/integrate/token-exchange#scope)

[Scope](https://zitadel.com/docs/apis/openidoauth/scopes) is an optional parameter that allows changing the scope of the supplied token, for the requested token. Scope can be entirely different from any of the supplied tokens. It can be used to extend or decrease the scope of the new token.

When scope is omitted in the request, it is taken from the `subject_token`. If the `subject_token` doesn't carry any scope (some types can't), it is taken from the `actor_token`. All allowed token types for the `actor_token` typically have a scope.

#### [Audience](https://zitadel.com/docs/guides/integrate/token-exchange#audience)

Audience is an optional parameter that allows to decrease the audience of the requested token. When supplied it may never contain an audience which was not already present in either the `subject_token` or `actor_token` combined.
This is to prevent applications from one project or organization authorizing themselves access to applications of another project or organization and circumventing current ZITADEL authorization schemas.

When audience is omitted in the request, it is taken from the `subject_token`. If the `subject_token` doesn't carry any audience (some types can't), it is taken from the `actor_token`. All allowed token types for the `actor_token` typically have an audience.

#### [Resource](https://zitadel.com/docs/guides/integrate/token-exchange#resource)

The resource parameter would allow mapping a URI to a target audience. This is further defined in [RFC 8707 Resource Indicators for OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc8707).

ZITADEL does not yet support Resource Indicators. Supplying this parameter will always result in a `invalid_target` error.

### [Token exchange response](https://zitadel.com/docs/guides/integrate/token-exchange#token-exchange-response)

The response schema looks very similar to the model of other token endpoint responses. The RFC attempts to reuse the same fields, however they might have different contents then they lead you to believe. This can lead to confusing situations, so be sure to read this section!

| Property          | Description                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| access_token      | An `access_token` as opaque token or JWT for the subject user                                                                                |
| token_type        | Type of the `access_token`. Value can be `Bearer` or `N_A`                                                                                   |
| issued_token_type | [Token type](https://zitadel.com/docs/guides/integrate/token-exchange#token-types) of the returned token, matches the `requested_token_type` |
| refresh_token     | A refresh token if the `offline_access` scope was requested                                                                                  |
| id_token          | An ID Token of the subject user, only with `openid` scope                                                                                    |
| expires_in        | Number of second until the expiration of the `access_token`                                                                                  |
| scope             | Scopes of the `access_token`. These might differ from the provided `scope` parameter                                                         |

#### [Access token](https://zitadel.com/docs/guides/integrate/token-exchange#access-token)

The `access_token` field contains the requested token, of the requested token type. **Even if the requested token is not an access token!** For example if the `requested_token_type` is an ID Token, the `access_token` field will actually contain an ID Token.
:exploding_head:

#### [Token Type](https://zitadel.com/docs/guides/integrate/token-exchange#token-type)

The `token_type` field gives us an idea of the token returned in the `access_token` field. It is not one of the `*_token_types` described above. It behaves almost like the other grand types. Normally this value is always `Bearer` but token exchange may also return `N_A` when a token cannot be used as a bearer token.

For example when the requested token type is an ID token, this value will be set to `N_A`, as an ID token cannot be send to an API as bearer token.

#### [Issued token type.](https://zitadel.com/docs/guides/integrate/token-exchange#issued-token-type)

The `issued_token_type` contains one of the [token types](https://zitadel.com/docs/guides/integrate/token-exchange#token-types) described above. It should match the `requested_token_type` from the request.

#### [Refresh token](https://zitadel.com/docs/guides/integrate/token-exchange#refresh-token)

The `refresh_token` may contain a new refresh token that can be used to refresh the `access_token` at a later moment. ZITADEL does not allow using refresh tokens in the Token Exchange grant. Refresh tokens can be used for the [`refresh_token` grant](https://zitadel.com/docs/apis/openidoauth/endpoints#refresh-token-grant) instead, including ones obtained through Token Exchange.

A refresh token can be obtained by setting the `offline_access` [scope](https://zitadel.com/docs/guides/integrate/token-exchange#scope) in the request or applicable token.

#### [ID Token](https://zitadel.com/docs/guides/integrate/token-exchange#id-token)

The `id_token` may contain an ID token. This is a non-standard field added by ZITADEL in order to match OpenID token responses. An ID Token may be obtained together with an access token or JWT token-type when the `openid` [scope](https://zitadel.com/docs/guides/integrate/token-exchange#scope) is set in the request or applicable token.

#### [Expires in](https://zitadel.com/docs/guides/integrate/token-exchange#expires-in)

The `expires_in` returns the time in seconds the new `access_token` is valid. This value is given for all token types, even non-access tokens.

#### [Scope](https://zitadel.com/docs/guides/integrate/token-exchange#scope)

The `scope` field contains the final scope of the obtained token. Scope might be different as the one requested, as ZITADEL validates the input. In the RFC the scope field is optional, but ZITADEL always send the value.

Now that we have the basics covered, we can get started with using the Token Exchange.

## [Simple Token Exchange examples](https://zitadel.com/docs/guides/integrate/token-exchange#simple-token-exchange-examples)

First we will cover "simple" Token Exchange which only involves exchanging the `subject_token` for a new token.

### [Preparation](https://zitadel.com/docs/guides/integrate/token-exchange#preparation)

These preparation steps are needed for all Token Exchange interaction, including impersonation.

#### [Application](https://zitadel.com/docs/guides/integrate/token-exchange#application)

Next we need to select an application that is allowed to perform Token Exchange. As with the other grant types, we need to enable the `urn:ietf:params:oauth:grant-type:token-exchange` grant type.

ZITADEL allows any application to use Token Exchange, however we strongly recommend to only configure confidential clients (using either client credentials or JWT assertion) with the Token Exchange grant type. This is because there is some trust placed in the application when it comes to defining scope and that it obtained tokens in a legitimate way. For example, if the app possesses a token of an admin user with impersonation permissions it can obtain tokens for any other user in your instance. It is your responsibility to make sure the application can be trusted with this kind of powers. If you configure a public client with the Token Exchange grant, you risk a leaked token can be used by an attacker who knows the client ID of a granted public client.

![](https://zitadel.com/docs/_next/image?url=%2Fdocs%2F_next%2Fstatic%2Fmedia%2Fapp-token-exchange-grant.222d95fa.png&w=3840&q=75&dpl=dpl_3nc5LtmCr2QiwpWi26HiLthvWsk5)

#### [Organization layout](https://zitadel.com/docs/guides/integrate/token-exchange#organization-layout)

For this example we have the following projects in our organization:

- **portal** contains the end user interfaces. In this case a web-app that initiated user login and performs operations on other APIs. The web-app has the token exchange grant type enabled;
- **aggregates** a project that contains APIs of low privilege which aggregate public data to return to the user;
- **settings** a project that contains APIs for settings and other privileged operations;
- **ZITADEL** the build-in project used for the zitadel management console and APIs;

#### [Authenticated user tokens](https://zitadel.com/docs/guides/integrate/token-exchange#authenticated-user-tokens)

The _portal_ web-app has been configured to include user info in the ID Token and completed a code-flow login for an user with the following scope:

```
openid profile email urn:zitadel:iam:org:project:id:259254020357488642:aud urn:zitadel:iam:org:project:id:259256588127174658:aud urn:zitadel:iam:org:project:id:zitadel:aud
```

The scope requested an access token and ID Token. The reserved scopes are used to add all of our defined projects to the audience of the token.
The resulting ID Token, user info and introspection responses will provide user profile information, user email and the token audience.
At the end of the code flow we have the following tokens:

Opaque Access token:

```
NaUAPHy5mLFQlwUCeUGYeDyhcQYuNhzTiYgwMor9BxP_bfMy2iDdLxJ87nntUc85vNyeHOY
```

ID token:

```
eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1OTM3OTQwMTIwNzA1NDMzOCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjkwMDAiLCJzdWIiOiIyNTkyNDIwMzkzNzg0NDQyOTAiLCJhdWQiOlsiMjU5MjU0NDA5MzIwNTI5OTIyQHBvcnRhbCIsIjI1OTI5Nzc3MzUwODE2NTYzNEBwb3J0YWwiLCIyNTkyNTQzMTcwNzkzMzA4MTgiLCIyNTkyNTQwMjAzNTc0ODg2NDIiLCIyNTkyNTY1ODgxMjcxNzQ2NTgiLCIyNTc3ODY5OTEyNDcyOTQ0NjgiXSwiZXhwIjoxNzExMTQxNjcwLCJpYXQiOjE3MTEwOTg0NzAsImF1dGhfdGltZSI6MTcxMTA5ODQ2OCwiYW1yIjpbInBhc3N3b3JkIiwicHdkIl0sImF6cCI6IjI1OTI1NDQwOTMyMDUyOTkyMkBwb3J0YWwiLCJjbGllbnRfaWQiOiIyNTkyNTQ0MDkzMjA1Mjk5MjJAcG9ydGFsIiwiYXRfaGFzaCI6InQxVDc4czhSVFZrdTJzeEJnMDNSQ1EiLCJjX2hhc2giOiJQdXBDMmNyak9aQXI2X08xdVRsR2R3IiwibmFtZSI6ImVuZCB1c2VyIiwiZ2l2ZW5fbmFtZSI6ImVuZCIsImZhbWlseV9uYW1lIjoidXNlciIsIm5pY2tuYW1lIjoiZW5kLXVzZXIiLCJnZW5kZXIiOiJmZW1hbGUiLCJsb2NhbGUiOiJlbiIsInVwZGF0ZWRfYXQiOjE3MTEwMTYyOTYsInByZWZlcnJlZF91c2VybmFtZSI6ImVuZC11c2VyIiwiZW1haWwiOiJ0aW0rZW5kLXVzZXJAeml0YWRlbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0.Dw8lfQwJTksCOr9dHLfWqpSf4gJwkcTdKMZGCkLueBMDdyqzL-qR_KcYCcp-NKDkY-o9e8SxJtIBkPlWzI2x0WutIg67SqzJbwS_Be88MkDKv-sRqKy_bVnyNTcYjuUReGzu4ycufjMu6aKtqYFEivdZsB2-2Pxnj5WSs_CY7jvBe_YQtfThSU88i1LPQDucQdSZZpOpOhEV4AI5C3XXbnv2nw0PMZ-Beq6svpCYqs_3Azeg0-UgxipuRgJfnqnqEqH0zlFNCndnkRuknUoda6-peuEI2KnRg9WkX7DoYrTToPde8Ay8NI48cWipm9dhxNxQbIr4ZDWQEazmsz9SpQ
```

The ID token is a JWT and contains the following claims:

```
{
  "iss": "http://localhost:9000",
  "sub": "259242039378444290",
  "aud": [\
    "259254409320529922@portal",\
    "259297773508165634@portal",\
    "259254317079330818",\
    "259254020357488642",\
    "259256588127174658",\
    "257786991247294468"\
  ],
  "exp": 1711141670,
  "iat": 1711098470,
  "auth_time": 1711098468,
  "amr": ["password", "pwd"],
  "azp": "259254409320529922@portal",
  "client_id": "259254409320529922@portal",
  "at_hash": "t1T78s8RTVku2sxBg03RCQ",
  "c_hash": "PupC2crjOZAr6_O1uTlGdw",
  "name": "end user",
  "given_name": "end",
  "family_name": "user",
  "nickname": "end-user",
  "gender": "female",
  "locale": "en",
  "updated_at": 1711016296,
  "preferred_username": "end-user",
  "email": "tim+end-user@zitadel.com",
  "email_verified": true
}
```

The audience contains 2 client IDs from the current project ( _portal_) and the IDs of the projects we described earlier, including the ZITADEL project ID.

### [Reduce audience and scope example](https://zitadel.com/docs/guides/integrate/token-exchange#reduce-audience-and-scope-example)

Now imagine that the portal web-app needs to call an aggregate API. The API is externally developed and configured to use ZITADEL's introspection endpoint to validate access tokens.
Besides that, we do not trust the API. If we were to forward the current access token in an `Authorization: Bearer` header, the untrusted API will get access to user information it might not need in order execute its business logic.
Another issue is that the API might start acting malicious and it would be able to call the **settings** and **ZITADEL** APIs with the same privilege as the passed token.

In this token exchange call we will reduce the scope and audience of the access token, so that we can forward the new token instead:

```
curl -L -X POST 'http://localhost:9000/oauth/v2/token' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-H 'Accept: application/json' \
-u '259254409320529922@portal:eNdXJzB5RK5CXSpa4HqEfbdDqlM7drpskEHq1RBYMby0tM1MaCidyWsWlp5mglbN' \
-d 'grant_type=urn:ietf:params:oauth:grant-type:token-exchange' \
-d 'subject_token=NaUAPHy5mLFQlwUCeUGYeDyhcQYuNhzTiYgwMor9BxP_bfMy2iDdLxJ87nntUc85vNyeHOY' \
-d 'subject_token_type=urn:ietf:params:oauth:token-type:access_token' \
-d 'scope=openid' \
-d 'audience=259254020357488642' | jq
```

This gives the following response:

```
{
  "access_token": "CV3iikwgHfBqeGmzFebMIlbdoo3EHEz30LbOKWa-19FL0irJxcbITiLtOvUxouG0xuqECd0",
  "issued_token_type": "urn:ietf:params:oauth:token-type:access_token",
  "token_type": "Bearer",
  "expires_in": 43199,
  "scope": "openid",
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1OTM3OTQwMTIwNzA1NDMzOCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjkwMDAiLCJzdWIiOiIyNTkyNDIwMzkzNzg0NDQyOTAiLCJhdWQiOlsiMjU5MjU0MDIwMzU3NDg4NjQyIiwiMjU5MjU0NDA5MzIwNTI5OTIyQHBvcnRhbCJdLCJleHAiOjE3MTExNDE4NDksImlhdCI6MTcxMTA5ODY0OSwiYXpwIjoiMjU5MjU0NDA5MzIwNTI5OTIyQHBvcnRhbCIsImNsaWVudF9pZCI6IjI1OTI1NDQwOTMyMDUyOTkyMkBwb3J0YWwiLCJhdF9oYXNoIjoiMGhqckJDcEhyLS1iYjg2ZlZtQmFjdyJ9.D7_upLZ3fEXRvdlX-EfK2x9FLgppDJZZ3QPvFHgw11rfRFgmMoZAgGmh3rNBbvBuDM8UYPw5FEcIlaEMMVaorKhTFbKQB-t0M0krZ81_uIrDa8J7svW5iPACg36Ge77PQz_aGUfbwoRcqSm26OG1Bw0Grmu3mxm7blnhqUHBFtZi5DLWmdK-EfKID6D4s7JR1JEH11nZyFT3LUY87wQ_9FQFWVcqtmvELmseVQsvENJkwifPRkzphgyABpiixMWZEh0HcoMVw7uYQBQS9-6yVyf0I4ScnTR7GtUUL650xw3yerxMTJVo3TfwDchVy7BzSXyWF9RSr46xgHY-48b1Tw"
}
```

As indicated by the `token_type` the new access token can be used as Bearer. Once the web-app will make a call to one of the aggregate APIs, that API can make an [introspection](https://zitadel.com/docs/apis/openidoauth/endpoints#introspection-endpoint) call with the access token. Note we use the credentials of the API here:

```
curl -L -X POST 'http://localhost:9000/oauth/v2/introspect' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -u '259284000017809410@aggregates:ES1i1JWgGiHNW6bBljyynZyvQIlotEpVwzbgrTIYZzndOo2KxDkwap1WvdSdBjtk' \
  -d token=CV3iikwgHfBqeGmzFebMIlbdoo3EHEz30LbOKWa-19FL0irJxcbITiLtOvUxouG0xuqECd0 | jq
```

The introspection response would look like:

```
{
  "active": true,
  "scope": "openid",
  "client_id": "259254409320529922@portal",
  "token_type": "Bearer",
  "exp": 1711141849,
  "iat": 1711098649,
  "nbf": 1711098649,
  "sub": "259242039378444290",
  "aud": ["259254020357488642"],
  "iss": "http://localhost:9000",
  "jti": "259380204902809602"
}
```

We can see that the audience and scope are reduced and we are not sharing any sensitive user information with the API. If the API tries to use the token on any API outside the aggregate project, it would be useless:

```
curl -L -X GET 'http://localhost:9000/auth/v1/users/me' \
-H 'Accept: application/json' \
-H 'Authorization: Bearer CV3iikwgHfBqeGmzFebMIlbdoo3EHEz30LbOKWa-19FL0irJxcbITiLtOvUxouG0xuqECd0' | jq
```

```
{
  "code": 16,
  "message": "Errors.Token.Invalid (AUTH-7fs1e)",
  "details": [\
    {\
      "@type": "type.googleapis.com/zitadel.v1.ErrorDetail",\
      "id": "AUTH-7fs1e",\
      "message": "Errors.Token.Invalid"\
    }\
  ]
}
```

### [Change token-type example](https://zitadel.com/docs/guides/integrate/token-exchange#change-token-type-example)

We can also use Token Exchange to change the type of token we are dealing with. For example, the first opaque token after user login can be exchanged for a JWT access token, while maintaining the same scope and audience:

```
curl -L -X POST 'http://localhost:9000/oauth/v2/token' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-H 'Accept: application/json' \
-u '259254409320529922@portal:eNdXJzB5RK5CXSpa4HqEfbdDqlM7drpskEHq1RBYMby0tM1MaCidyWsWlp5mglbN' \
-d 'grant_type=urn:ietf:params:oauth:grant-type:token-exchange' \
-d 'subject_token=NaUAPHy5mLFQlwUCeUGYeDyhcQYuNhzTiYgwMor9BxP_bfMy2iDdLxJ87nntUc85vNyeHOY' \
-d 'subject_token_type=urn:ietf:params:oauth:token-type:access_token' \
-d 'requested_token_type=urn:ietf:params:oauth:token-type:jwt' | jq
```

Will give the following response:

```
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1OTM3OTQwMTIwNzA1NDMzOCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjkwMDAiLCJzdWIiOiIyNTkyNDIwMzkzNzg0NDQyOTAiLCJhdWQiOlsiMjU5MjU0NDA5MzIwNTI5OTIyQHBvcnRhbCIsIjI1OTI5Nzc3MzUwODE2NTYzNEBwb3J0YWwiLCIyNTkyNTQzMTcwNzkzMzA4MTgiLCIyNTkyNTQwMjAzNTc0ODg2NDIiLCIyNTkyNTY1ODgxMjcxNzQ2NTgiLCIyNTc3ODY5OTEyNDcyOTQ0NjgiXSwiZXhwIjoxNzExMTQyMjc0LCJpYXQiOjE3MTEwOTkwNzQsIm5iZiI6MTcxMTA5OTA3NCwianRpIjoiMjU5MzgwOTE2ODQzOTcwNTYyIn0.dsX-8bXTGaZL4d3FJ7Fmrhty4oIvSIOg5suZ16MIVXdogOZHWNpTvP3bXeyHL7zHX2prUjSxTg9EX_U9XcSnX4VeAzt4sG6_vH20pJLeXMivVbCDJBp9rv8rG2gVdEwVkfxhpK_2KHhtRzCpMj_xyjlM1eh7VbRBvEuH0m1Kqv96Gspc4w0jahl8hkDuV3v0PjTo7lB72emghVEwHyXhj6a53AKzPWzrZYOJnVSEKz0MgZeHcjT93D-nN3fYWulDw9VvTs6L65G3KnoRbB29plZtLrO5F-c0AJkVKi1W9dhd-_Yj-f8o5benxymAUxUAhWsROO2syWu89M9cdnjh9A",
  "issued_token_type": "urn:ietf:params:oauth:token-type:jwt",
  "token_type": "Bearer",
  "expires_in": 43199,
  "scope": "openid email profile urn:zitadel:iam:org:project:id:259254020357488642:aud urn:zitadel:iam:org:project:id:259256588127174658:aud urn:zitadel:iam:org:project:id:zitadel:aud",
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1OTM3OTQwMTIwNzA1NDMzOCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjkwMDAiLCJzdWIiOiIyNTkyNDIwMzkzNzg0NDQyOTAiLCJhdWQiOlsiMjU5MjU0NDA5MzIwNTI5OTIyQHBvcnRhbCIsIjI1OTI5Nzc3MzUwODE2NTYzNEBwb3J0YWwiLCIyNTkyNTQzMTcwNzkzMzA4MTgiLCIyNTkyNTQwMjAzNTc0ODg2NDIiLCIyNTkyNTY1ODgxMjcxNzQ2NTgiLCIyNTc3ODY5OTEyNDcyOTQ0NjgiXSwiZXhwIjoxNzExMTQyMjc0LCJpYXQiOjE3MTEwOTkwNzQsImF6cCI6IjI1OTI1NDQwOTMyMDUyOTkyMkBwb3J0YWwiLCJjbGllbnRfaWQiOiIyNTkyNTQ0MDkzMjA1Mjk5MjJAcG9ydGFsIiwiYXRfaGFzaCI6IjVVeUJ1el9rMVd3VTVPbUVNa21zSFEiLCJuYW1lIjoiZW5kIHVzZXIiLCJnaXZlbl9uYW1lIjoiZW5kIiwiZmFtaWx5X25hbWUiOiJ1c2VyIiwibmlja25hbWUiOiJlbmQtdXNlciIsImdlbmRlciI6ImZlbWFsZSIsImxvY2FsZSI6ImVuIiwidXBkYXRlZF9hdCI6MTcxMTAxNjI5NiwicHJlZmVycmVkX3VzZXJuYW1lIjoiZW5kLXVzZXIiLCJlbWFpbCI6InRpbStlbmQtdXNlckB6aXRhZGVsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlfQ.eXxM3hGM5_hn9Vieg-BGlt67KWNfeL3NjKkOiHyZKJNkWMYUmIO2bdk6eZC4_eEWgIMUv093UvTZ1t-xF01evrNaCQ68KROUCWVe6SW85XAaLFb2wtKCJwNAQYWYHl8IzCJdEs5JLlZ7BlU6qgTxdw5MN0npLJbjM4osI_R-9152QfDLjivJlM7F9DWOnA5DdnwBzrHHtOUU-JWvsR6BBXY9eaCZmTjNt2v9yNh6rR4FazlBOYQN-EcYc90Ybckm2Vyow0vRsAnj7moKDQlUdOSyBSwxnSs9sSMr_Nm7uPxcolJ5raIRonGD5FndYYaSc8vuKkkDzQ8yr1v2GVJMyQ"
}
```

You can now inspect the access token JWT and see the following claims:

```
{
  "iss": "http://localhost:9000",
  "sub": "259242039378444290",
  "aud": [\
    "259254409320529922@portal",\
    "259297773508165634@portal",\
    "259254317079330818",\
    "259254020357488642",\
    "259256588127174658",\
    "257786991247294468"\
  ],
  "exp": 1711142274,
  "iat": 1711099074,
  "nbf": 1711099074,
  "jti": "259380916843970562"
}
```

Doing similar request you can:

- Exchange an ID token to opaque or JWT access token
- Exchange an opaque access token to a JWT access token
- Exchange a JWT access token to an opaque access token
- Exchange any access token to an ID token

### [Request an ID token example](https://zitadel.com/docs/guides/integrate/token-exchange#request-an-id-token-example)

In the following example we exchange the initial opaque access token to a new ID token. The usefulness of this is up to the imagination of the reader, but it demonstrates the weird behavior of requesting an ID token, as defined by the RFC.

You can also obtain an ID token in the `id_token` response field by requesting an access token and the `openid` scope.

```
curl -L -X POST 'http://localhost:9000/oauth/v2/token' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-H 'Accept: application/json' \
-d 'client_id=259254409320529922@portal' \
-d 'client_secret=eNdXJzB5RK5CXSpa4HqEfbdDqlM7drpskEHq1RBYMby0tM1MaCidyWsWlp5mglbN' \
-d 'grant_type=urn:ietf:params:oauth:grant-type:token-exchange' \
-d 'subject_token=eZCZcbA-lpS1UnbyLvG2Mw2p6ix7CiES3HCDKBn6KMebhMu34hwu9p86N6EgOmkN6estous' \
-d 'subject_token_type=urn:ietf:params:oauth:token-type:access_token' \
-d 'requested_token_type=urn:ietf:params:oauth:token-type:id_token' | jq
```

This gives us a response with the ID token in the `access_token` field and the `token_type` set to `N_A`:

```
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1OTIzOTc0MDQxMzMxMzAyNiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjkwMDAiLCJzdWIiOiIyNTkyNDIwMzkzNzg0NDQyOTAiLCJhdWQiOlsiMjU5MjU0NDA5MzIwNTI5OTIyQHBvcnRhbCIsIjI1OTI1NDMxNzA3OTMzMDgxOCIsIjI1OTI1NDAyMDM1NzQ4ODY0MiIsIjI1OTI1NjU4ODEyNzE3NDY1OCIsIjI1Nzc4Njk5MTI0NzI5NDQ2OCJdLCJleHAiOjE3MTEwODk2MzcsImlhdCI6MTcxMTA0NjQzNywiYXpwIjoiMjU5MjU0NDA5MzIwNTI5OTIyQHBvcnRhbCIsImNsaWVudF9pZCI6IjI1OTI1NDQwOTMyMDUyOTkyMkBwb3J0YWwiLCJuYW1lIjoiZW5kIHVzZXIiLCJnaXZlbl9uYW1lIjoiZW5kIiwiZmFtaWx5X25hbWUiOiJ1c2VyIiwibmlja25hbWUiOiJlbmQtdXNlciIsImdlbmRlciI6ImZlbWFsZSIsImxvY2FsZSI6ImVuIiwidXBkYXRlZF9hdCI6MTcxMTAxNjI5NiwicHJlZmVycmVkX3VzZXJuYW1lIjoiZW5kLXVzZXIiLCJlbWFpbCI6InRpbStlbmQtdXNlckB6aXRhZGVsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlfQ.N2MfKznzdH-LaEV3qWPeqHW9dxlsgEoEm-ivU3uakVbtOe7AnpNTF56aPMlt3macNizixusm1vZWFHhHc-kBczMDqlzgFvEbwzSBi1ETmF0OIfazlbzGIJL0G1PCzD3883vR1oh80mwPUvoPqLkjHvQa3UaYIZ-Z08i8Oq-Cut8D3e2PhIfn9YCK9htq65GOJCHaWfWMPJrb65M5nTm6TyM4VfYe4iQgJ1D8Kuol_UQEpIeVnb7agu6mk9h1BdjhMGwBFPJjRbxSh9Mb7glFuRvgI1LWcbmr70HMMh0n0UVxPlIQUGJbrT0Wu97aJjFBdzEq5Rof4oJ2COAmvKvwVw",
  "issued_token_type": "urn:ietf:params:oauth:token-type:id_token",
  "token_type": "N_A",
  "expires_in": 43199,
  "scope": "openid profile email urn:zitadel:iam:org:project:id:259254020357488642:aud urn:zitadel:iam:org:project:id:259256588127174658:aud urn:zitadel:iam:org:project:id:zitadel:aud"
}
```

## [Impersonation examples](https://zitadel.com/docs/guides/integrate/token-exchange#impersonation-examples)

With impersonation we can let one user assume the role of another user.

Currently impersonated tokens cannot be used for the ZITADEL API. This is to prevent privilege escalation where a impersonator could become an instance owner, for example. We might enable the use of impersonated tokens in the future.

### [Preparation](https://zitadel.com/docs/guides/integrate/token-exchange#preparation)

We continue with the same application and project layout from the above examples. We will introduce a new user, the impersonator, which will assume the identity of the end user from the previous example.

#### [Impersonation security settings](https://zitadel.com/docs/guides/integrate/token-exchange#impersonation-security-settings)

If you want to impersonate users by Token Exchange, the security settings of the instance must be configured to allow this. Go to "Default settings" and in the sidebar select "Security Settings". Enable the "Allow Impersonation" setting.

![](https://zitadel.com/docs/_next/image?url=%2Fdocs%2F_next%2Fstatic%2Fmedia%2Finstance-security-impersonation.9666d12d.png&w=3840&q=75&dpl=dpl_3nc5LtmCr2QiwpWi26HiLthvWsk5)

#### [Impersonation permissions](https://zitadel.com/docs/guides/integrate/token-exchange#impersonation-permissions)

Next, we need to configure which users are allowed to impersonate other users. ZITADEL provides 4 [management roles](https://zitadel.com/docs/guides/manage/console/administrators):

| Name                        | Role                      | Description                                                       |
| --------------------------- | ------------------------- | ----------------------------------------------------------------- |
| Instance Admin Impersonator | IAM_ADMIN_IMPERSONATOR    | Allow impersonation of admin and end users from all organizations |
| Instance Impersonator       | IAM_END_USER_IMPERSONATOR | Allow impersonation of end users from all organizations           |
| Org Admin Impersonator      | ORG_ADMIN_IMPERSONATOR    | Allow impersonation of admin and end users from the organization  |
| Org Impersonator            | ORG_END_USER_IMPERSONATOR | Allow impersonation of end users from the organization            |

In this example we will assign the `ORG_END_USER_IMPERSONATOR` role to a user:

![](https://zitadel.com/docs/_next/image?url=%2Fdocs%2F_next%2Fstatic%2Fmedia%2Forg-role-end-user-impersonator.f5cc4caf.png&w=3840&q=75&dpl=dpl_3nc5LtmCr2QiwpWi26HiLthvWsk5)

#### [Authenticated impersonator tokens](https://zitadel.com/docs/guides/integrate/token-exchange#authenticated-impersonator-tokens)

At this point the _portal_ web-app must have completed a code-flow login for a user with the `ORG_END_USER_IMPERSONATOR` ZITADEL role. The impersonator does not have a profile. In this case we only need the `openid` scope.
However, as we cannot extend the audience during token exchange, it is important that the project scopes are requested for the impersonator during login.

```
openid urn:zitadel:iam:org:project:id:259254020357488642:aud urn:zitadel:iam:org:project:id:259256588127174658:aud urn:zitadel:iam:org:project:id:zitadel:aud
```

At the end of the code flow we have the following tokens:

Opaque access token:

```
_oFT8JOKtqpS_5M5ml03P4TEQpCj8AT1XFq2jT_iKvgIB9lzjbrOl4MHJ3o3G-RSO_y0FR4
```

ID token:

```
eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1OTM3OTQwMTIwNzA1NDMzOCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjkwMDAiLCJzdWIiOiIyNTkyNDE5NDQ2NTQyODI3NTQiLCJhdWQiOlsiMjU5MjU0NDA5MzIwNTI5OTIyQHBvcnRhbCIsIjI1OTI5Nzc3MzUwODE2NTYzNEBwb3J0YWwiLCIyNTkyNTQzMTcwNzkzMzA4MTgiLCIyNTkyNTQwMjAzNTc0ODg2NDIiLCIyNTkyNTY1ODgxMjcxNzQ2NTgiLCIyNTc3ODY5OTEyNDcyOTQ0NjgiXSwiZXhwIjoxNzExMTQxMzcwLCJpYXQiOjE3MTEwOTgxNzAsImF1dGhfdGltZSI6MTcxMTA5ODE2OSwiYW1yIjpbInBhc3N3b3JkIiwicHdkIl0sImF6cCI6IjI1OTI1NDQwOTMyMDUyOTkyMkBwb3J0YWwiLCJjbGllbnRfaWQiOiIyNTkyNTQ0MDkzMjA1Mjk5MjJAcG9ydGFsIiwiYXRfaGFzaCI6InQ1X2dqR2k5TVNPYTNlNTBkUEdDVEEiLCJjX2hhc2giOiJnb3IzQ0tWN0ljVW8wNUpxTnd6aFp3In0.iN8LNj9VV-Kmb68frPesMM8L7PYWvwqcqlvvU4EsfNM_Q8_Upec8_8bXFk1EG7Ecg65JfrGdceQjYamldaMJyV2X9n-aZ9Db4CpyHUduJOIvWkeBQBxWDytiTFBiAaS-YhQ9L5UmDoz6b2HNrHGNlqGd_F0_rMdMZ0P4A8RQck-akNz8IntTpvQlbN6vWPC7_4Cy0xYqgWlqsCVWJkJ8v97XYLJlKPnu-tvoHQ48eZRXBgqUdrQAV8nAyp-1oglGQwJFGNzWBE-cRIkFJ5uMum7jRfuFPQGTSL8XNMQfAzRHCLOMLyFxttsL5ynMpcp2_w35DssmSY9r1J91tGdydg
```

The ID token has the following claims:

```
{
  "iss": "http://localhost:9000",
  "sub": "259241944654282754",
  "aud": [\
    "259254409320529922@portal",\
    "259297773508165634@portal",\
    "259254317079330818",\
    "259254020357488642",\
    "259256588127174658",\
    "257786991247294468"\
  ],
  "exp": 1711141370,
  "iat": 1711098170,
  "auth_time": 1711098169,
  "amr": [\
    "password",\
    "pwd"\
  ],
  "azp": "259254409320529922@portal",
  "client_id": "259254409320529922@portal",
  "at_hash": "t5_gjGi9MSOa3e50dPGCTA",
  "c_hash": "gor3CKV7IcUo05JqNwzhZw"
}
```

### [Delegation by token example](https://zitadel.com/docs/guides/integrate/token-exchange#delegation-by-token-example)

Let's assume that the web-app has the ability for an end-user to enable delegation. That option would make the end-user's token available to a user with impersonation permissions. The web-app will send a token exchange request with the `subject_token` of the end-user and the `actor_token` of the impersonator.

In this example we will also request a JWT access token, so we can inspect it later. Any other allowed type could be used.

```
curl -L -X POST 'http://localhost:9000/oauth/v2/token' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-H 'Accept: application/json' \
-u '259254409320529922@portal:eNdXJzB5RK5CXSpa4HqEfbdDqlM7drpskEHq1RBYMby0tM1MaCidyWsWlp5mglbN' \
-d 'grant_type=urn:ietf:params:oauth:grant-type:token-exchange' \
-d 'subject_token=NaUAPHy5mLFQlwUCeUGYeDyhcQYuNhzTiYgwMor9BxP_bfMy2iDdLxJ87nntUc85vNyeHOY' \
-d 'subject_token_type=urn:ietf:params:oauth:token-type:access_token' \
-d 'actor_token=_oFT8JOKtqpS_5M5ml03P4TEQpCj8AT1XFq2jT_iKvgIB9lzjbrOl4MHJ3o3G-RSO_y0FR4' \
-d 'actor_token_type=urn:ietf:params:oauth:token-type:access_token' \
-d 'requested_token_type=urn:ietf:params:oauth:token-type:jwt' | jq
```

Will give the following response:

```
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1OTM3OTQwMTIwNzA1NDMzOCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjkwMDAiLCJzdWIiOiIyNTkyNDIwMzkzNzg0NDQyOTAiLCJhdWQiOlsiMjU5MjU0NDA5MzIwNTI5OTIyQHBvcnRhbCIsIjI1OTI5Nzc3MzUwODE2NTYzNEBwb3J0YWwiLCIyNTkyNTQzMTcwNzkzMzA4MTgiLCIyNTkyNTQwMjAzNTc0ODg2NDIiLCIyNTkyNTY1ODgxMjcxNzQ2NTgiLCIyNTc3ODY5OTEyNDcyOTQ0NjgiXSwiZXhwIjoxNzExMTQyODc1LCJpYXQiOjE3MTEwOTk2NzUsIm5iZiI6MTcxMTA5OTY3NSwianRpIjoiMjU5MzgxOTI2Mjk1NTAyODUwIiwiYWN0Ijp7ImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6OTAwMCIsInN1YiI6IjI1OTI0MTk0NDY1NDI4Mjc1NCJ9fQ.rz0M_r_rLN0OIf5UKOTi9Fz5-X3CFLMA4jBaZHDy1pdbBwfbnByL3LeB9UYtSjzMwaYmXJJJRlxAvO9I2bu2ReHYi97DzFo2gKX9p-rLoaEUYcAjg3HmJ0c9J1Ucvc05yXu2OXhNKDb7_qcX4IfaddpazPRvjNnpRk4NWFxKbTBLG4mpqxv5brM4iDPmzejUdoYKxSzlCH-ChZIf28vbE_ORf0HfxkptXAsZ3P9I9Fr-d_fenCmBFHAMP0u_tQ7z-IzgxDg9H54fWEm_LNrkFJf6PEPWLc1TFFOKMgU5nnGorSe0dLZGXOB_GJz6wTw6-ts8QKxJ_zajd4r3K4kKSg",
  "issued_token_type": "urn:ietf:params:oauth:token-type:jwt",
  "token_type": "Bearer",
  "expires_in": 43199,
  "scope": "openid email profile urn:zitadel:iam:org:project:id:259254020357488642:aud urn:zitadel:iam:org:project:id:259256588127174658:aud urn:zitadel:iam:org:project:id:zitadel:aud",
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1OTM3OTQwMTIwNzA1NDMzOCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjkwMDAiLCJzdWIiOiIyNTkyNDIwMzkzNzg0NDQyOTAiLCJhdWQiOlsiMjU5MjU0NDA5MzIwNTI5OTIyQHBvcnRhbCIsIjI1OTI5Nzc3MzUwODE2NTYzNEBwb3J0YWwiLCIyNTkyNTQzMTcwNzkzMzA4MTgiLCIyNTkyNTQwMjAzNTc0ODg2NDIiLCIyNTkyNTY1ODgxMjcxNzQ2NTgiLCIyNTc3ODY5OTEyNDcyOTQ0NjgiXSwiZXhwIjoxNzExMTQyODc1LCJpYXQiOjE3MTEwOTk2NzUsImF6cCI6IjI1OTI1NDQwOTMyMDUyOTkyMkBwb3J0YWwiLCJjbGllbnRfaWQiOiIyNTkyNTQ0MDkzMjA1Mjk5MjJAcG9ydGFsIiwiYWN0Ijp7ImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6OTAwMCIsInN1YiI6IjI1OTI0MTk0NDY1NDI4Mjc1NCJ9LCJhdF9oYXNoIjoiYnZPQVhzMUhkQmFZWTZqN1B6T3RqZyIsIm5hbWUiOiJlbmQgdXNlciIsImdpdmVuX25hbWUiOiJlbmQiLCJmYW1pbHlfbmFtZSI6InVzZXIiLCJuaWNrbmFtZSI6ImVuZC11c2VyIiwiZ2VuZGVyIjoiZmVtYWxlIiwibG9jYWxlIjoiZW4iLCJ1cGRhdGVkX2F0IjoxNzExMDE2Mjk2LCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJlbmQtdXNlciIsImVtYWlsIjoidGltK2VuZC11c2VyQHppdGFkZWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWV9.cza4Fgn73Jez29l9uzcCcG-QYGvsqjReAICGajWjFFIij7PohhSWYkJNpQuixXeyp_JD7qxLuG1yFUGcXS-IS8ui_yHpiWuXr7ik81OX00_iCwBr6Qn6Ae6Qc3LOLNieSo1jRY2vx6pTXn0ZPnXpL_AbtVU3bruyaxbBeQhhyVDZ0NOLOgB3r-0Vc43VDnziI4-7Ngl1lQpU6Jp-kRNmqar36S59Aj3upcUus77I8tCfS633T4E8PcIAlqPla8RYcpAan6Qpc3ge7ybqjdfmh_qLv672rY_rQvh3rbe3sHup0nK1XzZNr9Fl1_LeZtUiv5or7WB4c4cGpqc3SAuxow"
}
```

In the access token [claims](https://zitadel.com/docs/apis/openidoauth/claims) we can see that the subject and audience are taken from the `subject_token`. The `act` claim contains the subject and issuer of the `actor_token`, so we can always determine the impersonator that obtained the token.

```
{
  "iss": "http://localhost:9000",
  "sub": "259242039378444290",
  "aud": [\
    "259254409320529922@portal",\
    "259297773508165634@portal",\
    "259254317079330818",\
    "259254020357488642",\
    "259256588127174658",\
    "257786991247294468"\
  ],
  "exp": 1711142875,
  "iat": 1711099675,
  "nbf": 1711099675,
  "jti": "259381926295502850",
  "act": {
    "iss": "http://localhost:9000",
    "sub": "259241944654282754"
  }
}
```

### [Impersonation by user ID example](https://zitadel.com/docs/guides/integrate/token-exchange#impersonation-by-user-id-example)

The previous example required us to have an active token of the user we want to impersonate. There are situations where this requirement cannot be met. For example, the user does not have an active session and we still need to impersonate them.

ZITADEL allows passing a user ID as the `subject_token`, along with a valid `actor_token`. This is an addition to enable this specific use-case.

User ID as subject token is an experimental addition and is provided pending evaluation of our community. This method might be considered insecure and trust is fully placed into the app making the request. This might be removed in the future.

In the following example we are again requesting a JWT access token. Instead of a token, we use the user ID of the end-user in the `subject_token` field and adjust the `subject_token_type` accordingly. As the user ID does not carry any scope and the impersonator / actor does not have a profile, we need to add some scopes to the request in order to receive an ID token with profile and email information.

```
curl -L -X POST 'http://localhost:9000/oauth/v2/token' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-H 'Accept: application/json' \
-u '259254409320529922@portal:eNdXJzB5RK5CXSpa4HqEfbdDqlM7drpskEHq1RBYMby0tM1MaCidyWsWlp5mglbN' \
-d 'grant_type=urn:ietf:params:oauth:grant-type:token-exchange' \
-d 'subject_token=259242039378444290' \
-d 'subject_token_type=urn:zitadel:params:oauth:token-type:user_id' \
-d 'actor_token=_oFT8JOKtqpS_5M5ml03P4TEQpCj8AT1XFq2jT_iKvgIB9lzjbrOl4MHJ3o3G-RSO_y0FR4' \
-d 'actor_token_type=urn:ietf:params:oauth:token-type:access_token' \
-d 'requested_token_type=urn:ietf:params:oauth:token-type:jwt' \
-d 'scope=openid profile email' | jq
```

This gives us the following response:

```
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1OTM3OTQwMTIwNzA1NDMzOCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjkwMDAiLCJzdWIiOiIyNTkyNDIwMzkzNzg0NDQyOTAiLCJhdWQiOlsiMjU5MjU0NDA5MzIwNTI5OTIyQHBvcnRhbCIsIjI1OTI5Nzc3MzUwODE2NTYzNEBwb3J0YWwiLCIyNTkyNTQzMTcwNzkzMzA4MTgiLCIyNTkyNTQwMjAzNTc0ODg2NDIiLCIyNTkyNTY1ODgxMjcxNzQ2NTgiLCIyNTc3ODY5OTEyNDcyOTQ0NjgiXSwiZXhwIjoxNzExMTQzNTEyLCJpYXQiOjE3MTExMDAzMTIsIm5iZiI6MTcxMTEwMDMxMiwianRpIjoiMjU5MzgyOTk0NDMzNzM2NzA2IiwiYWN0Ijp7ImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6OTAwMCIsInN1YiI6IjI1OTI0MTk0NDY1NDI4Mjc1NCJ9fQ.amF1wF090KItNNErpv_PaEw1t-zIQNh54IWPo_ECk7neNaWoTQjiUDQwuOBDpe8rqukP7gUnKlq9s3GOB0C5dGWyETMrezVeTQGkGEtGOhyvP21KWG8mAJ9MWP4VZ0XNXyzscioHdDC1ICPeRZPenfsGltcVKk0jzISW_wCprnJWXbVECBY_oEzZaVdopqv8kYYM2oXC-5Yi8tMBcm_R-9demCPoUUpKPHXRp524bv1jDfEti5WSziM-VbkFVWOB5VjSR1vFu7mXWmP9foRr11206EUkOrRUMewluRLUNm_aprhKADEo1nZ8WY76V3LLDH7wQ7L8v0UxqUtdw9v_kw",
  "issued_token_type": "urn:ietf:params:oauth:token-type:jwt",
  "token_type": "Bearer",
  "expires_in": 43199,
  "scope": "openid profile email",
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1OTM3OTQwMTIwNzA1NDMzOCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjkwMDAiLCJzdWIiOiIyNTkyNDIwMzkzNzg0NDQyOTAiLCJhdWQiOlsiMjU5MjU0NDA5MzIwNTI5OTIyQHBvcnRhbCIsIjI1OTI5Nzc3MzUwODE2NTYzNEBwb3J0YWwiLCIyNTkyNTQzMTcwNzkzMzA4MTgiLCIyNTkyNTQwMjAzNTc0ODg2NDIiLCIyNTkyNTY1ODgxMjcxNzQ2NTgiLCIyNTc3ODY5OTEyNDcyOTQ0NjgiXSwiZXhwIjoxNzExMTQzNTEyLCJpYXQiOjE3MTExMDAzMTIsImF6cCI6IjI1OTI1NDQwOTMyMDUyOTkyMkBwb3J0YWwiLCJjbGllbnRfaWQiOiIyNTkyNTQ0MDkzMjA1Mjk5MjJAcG9ydGFsIiwiYWN0Ijp7ImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6OTAwMCIsInN1YiI6IjI1OTI0MTk0NDY1NDI4Mjc1NCJ9LCJhdF9oYXNoIjoicXVYS1JENWY0YmxOb3YxS3Y2bnB5ZyIsIm5hbWUiOiJlbmQgdXNlciIsImdpdmVuX25hbWUiOiJlbmQiLCJmYW1pbHlfbmFtZSI6InVzZXIiLCJuaWNrbmFtZSI6ImVuZC11c2VyIiwiZ2VuZGVyIjoiZmVtYWxlIiwibG9jYWxlIjoiZW4iLCJ1cGRhdGVkX2F0IjoxNzExMDE2Mjk2LCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJlbmQtdXNlciIsImVtYWlsIjoidGltK2VuZC11c2VyQHppdGFkZWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWV9.kMRBX6te4bPh9PWQrKeQu7hWr13p_ehvIbOigrTs5ods3klM6PpCPTmDLuj65Ssd8SA5i_YTuNHDuoDzRlZAdvHx4X06eytF1yQQd0eME187cOaf3ffzK90ZWvuFk34N--teW41LjM0nq15wbUXMO8UWk4AStkl901nWBxAWhRLmR356ksQWNs8TAGLsSLCaG4py0pw807yUXCFy1EGwG7z-eAeA58mRmIYSxFmycU-uRqsCPzDuDSu4JD1G3sh1G3GKRF_DqwmEm4ClBx-_gNUJnH52o-xvTOX57QM40Ai6vub_Ncy5nxVFETU-PnpAXpslvNIsOz4CHwz7yDVPYg"
}
```

The new access token looks similar to the last example. However, the audience is now taken from the `actor_token`. As both audiences were the same you will not see the difference here.

```
{
  "iss": "http://localhost:9000",
  "sub": "259242039378444290",
  "aud": [\
    "259254409320529922@portal",\
    "259297773508165634@portal",\
    "259254317079330818",\
    "259254020357488642",\
    "259256588127174658",\
    "257786991247294468"\
  ],
  "exp": 1711143512,
  "iat": 1711100312,
  "nbf": 1711100312,
  "jti": "259382994433736706",
  "act": {
    "iss": "http://localhost:9000",
    "sub": "259241944654282754"
  }
}
```

In the ID Token we see the profile and email information of the end-user:

```
{
  "iss": "http://localhost:9000",
  "sub": "259242039378444290",
  "aud": [\
    "259254409320529922@portal",\
    "259297773508165634@portal",\
    "259254317079330818",\
    "259254020357488642",\
    "259256588127174658",\
    "257786991247294468"\
  ],
  "exp": 1711143512,
  "iat": 1711100312,
  "azp": "259254409320529922@portal",
  "client_id": "259254409320529922@portal",
  "act": {
    "iss": "http://localhost:9000",
    "sub": "259241944654282754"
  },
  "at_hash": "quXKRD5f4blNov1Kv6npyg",
  "name": "end user",
  "given_name": "end",
  "family_name": "user",
  "nickname": "end-user",
  "gender": "female",
  "locale": "en",
  "updated_at": 1711016296,
  "preferred_username": "end-user",
  "email": "tim+end-user@zitadel.com",
  "email_verified": true
}
```

### [Refresh an impersonated token example](https://zitadel.com/docs/guides/integrate/token-exchange#refresh-an-impersonated-token-example)

If we use the previous example and append the `offline_access` scope, we will also receive a refresh token:

```
curl -L -X POST 'http://localhost:9000/oauth/v2/token' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-H 'Accept: application/json' \
-u '259254409320529922@portal:eNdXJzB5RK5CXSpa4HqEfbdDqlM7drpskEHq1RBYMby0tM1MaCidyWsWlp5mglbN' \
-d 'grant_type=urn:ietf:params:oauth:grant-type:token-exchange' \
-d 'subject_token=259242039378444290' \
-d 'subject_token_type=urn:zitadel:params:oauth:token-type:user_id' \
-d 'actor_token=_oFT8JOKtqpS_5M5ml03P4TEQpCj8AT1XFq2jT_iKvgIB9lzjbrOl4MHJ3o3G-RSO_y0FR4' \
-d 'actor_token_type=urn:ietf:params:oauth:token-type:access_token' \
-d 'requested_token_type=urn:ietf:params:oauth:token-type:jwt' \
-d 'scope=openid profile email offline_access' | jq
```

Response with a refresh token:

```
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1OTM3OTQwMTIwNzA1NDMzOCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjkwMDAiLCJzdWIiOiIyNTkyNDIwMzkzNzg0NDQyOTAiLCJhdWQiOlsiMjU5MjU0NDA5MzIwNTI5OTIyQHBvcnRhbCIsIjI1OTI5Nzc3MzUwODE2NTYzNEBwb3J0YWwiLCIyNTkyNTQzMTcwNzkzMzA4MTgiLCIyNTkyNTQwMjAzNTc0ODg2NDIiLCIyNTkyNTY1ODgxMjcxNzQ2NTgiLCIyNTc3ODY5OTEyNDcyOTQ0NjgiXSwiZXhwIjoxNzExMTU5Mzg1LCJpYXQiOjE3MTExMTYxODUsIm5iZiI6MTcxMTExNjE4NSwianRpIjoiMjU5NDA5NjI1NjYzNjY4MjI2IiwiYWN0Ijp7ImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6OTAwMCIsInN1YiI6IjI1OTI0MTk0NDY1NDI4Mjc1NCJ9fQ.QoPVZFOZUolPVOWwTYY1PZe7CKp2j8dqV8kt8a5Xz9ij1Y4TYZeKivDor68hfvlyulfT04gT8WNc3VLPtxJjNHQaydk9KrhzIN1liovh5Jy54KKvq4-jZpMPkBSy0Zkvv-lSuGEzM9wDurIOBUUy_JKmek3uySxH7bEQU4Jt6qQ_kQTT82rqFXAl3SWMQpaaVjvGMqEmzlmZacudSa1KETLyF2_UTCqoXXFWW-1mZtNGyy4EaMiU-k0h6MC1XBSyjr1aIVO2o4uWYmQYjIydmnKAoqJJEKkd-ZmSkCMEV9fFa8bKT816Agw1UNMDKMxF3tSW540oyAdGsLKSg39uIg",
  "issued_token_type": "urn:ietf:params:oauth:token-type:jwt",
  "token_type": "Bearer",
  "expires_in": 43199,
  "scope": "openid profile email offline_access",
  "refresh_token": "Rh1SRrRBGkBAmyK7KxrMcHtZ0_ewzStK5-l6IDOQG5S6EmZ42gHkP9KdMP3u-cV2cgFzxcnaRHbae9ZjPq9tD0ZbPdvjgyER",
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1OTM3OTQwMTIwNzA1NDMzOCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjkwMDAiLCJzdWIiOiIyNTkyNDIwMzkzNzg0NDQyOTAiLCJhdWQiOlsiMjU5MjU0NDA5MzIwNTI5OTIyQHBvcnRhbCIsIjI1OTI5Nzc3MzUwODE2NTYzNEBwb3J0YWwiLCIyNTkyNTQzMTcwNzkzMzA4MTgiLCIyNTkyNTQwMjAzNTc0ODg2NDIiLCIyNTkyNTY1ODgxMjcxNzQ2NTgiLCIyNTc3ODY5OTEyNDcyOTQ0NjgiXSwiZXhwIjoxNzExMTU5Mzg1LCJpYXQiOjE3MTExMTYxODUsImF6cCI6IjI1OTI1NDQwOTMyMDUyOTkyMkBwb3J0YWwiLCJjbGllbnRfaWQiOiIyNTkyNTQ0MDkzMjA1Mjk5MjJAcG9ydGFsIiwiYWN0Ijp7ImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6OTAwMCIsInN1YiI6IjI1OTI0MTk0NDY1NDI4Mjc1NCJ9LCJhdF9oYXNoIjoiSmtRZ1JTZHlqVzJ5ZnZ5M3hUQUc4USIsIm5hbWUiOiJlbmQgdXNlciIsImdpdmVuX25hbWUiOiJlbmQiLCJmYW1pbHlfbmFtZSI6InVzZXIiLCJuaWNrbmFtZSI6ImVuZC11c2VyIiwiZ2VuZGVyIjoiZmVtYWxlIiwibG9jYWxlIjoiZW4iLCJ1cGRhdGVkX2F0IjoxNzExMDE2Mjk2LCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJlbmQtdXNlciIsImVtYWlsIjoidGltK2VuZC11c2VyQHppdGFkZWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWV9.SvSD5hgR-MkabVV41Zta0jgtHmhlhSvAbP1BQNbr7Pjzia-f-3zVRodKkPU6OkjVvI2D4Yqk2bBPO7ZUW9w76oDoScnlJoqJvZsBQDPxO8z7Gtgtj7rQAPQKC-JKU7Aeb-V072tZhOt0NG-S0yWeiObS4stMXHGrBYQbwyarboyqMO69qjYey2MkGVFmhEOVGZ9w7Np6HZPfBgs2qFUXoQ51FbBVVOxxuCF5KSUkD_QRgmjK03KFDlLI8adtvC3TUsWLJeTaiaYAmXU2VouGtEqDXfOmDzxeZI69gUxj4_io2v3tHLn3SuslMi1ulihplTircsDk3H4oAp2clqj4TA"
}
```

The refresh token can be used for the `refresh_token` grant:

```
curl -L -X POST 'http://localhost:9000/oauth/v2/token' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-H 'Accept: application/json' \
-u '259254409320529922@portal:eNdXJzB5RK5CXSpa4HqEfbdDqlM7drpskEHq1RBYMby0tM1MaCidyWsWlp5mglbN' \
-d 'grant_type=refresh_token' \
-d 'refresh_token=Rh1SRrRBGkBAmyK7KxrMcHtZ0_ewzStK5-l6IDOQG5S6EmZ42gHkP9KdMP3u-cV2cgFzxcnaRHbae9ZjPq9tD0ZbPdvjgyER' | jq
```

The response now caries an opaque token again, because that is what is configured for the application:

```
{
  "access_token": "N4At8XdtlFySthaLzCSYX3GrEH_UmPgUzXjGF3WNLC_cl-Oy6s5G7ytZSV7zSClB3aSltYY",
  "token_type": "Bearer",
  "expires_in": 43199,
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1OTM3OTQwMTIwNzA1NDMzOCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjkwMDAiLCJzdWIiOiIyNTkyNDIwMzkzNzg0NDQyOTAiLCJhdWQiOlsiMjU5MjU0NDA5MzIwNTI5OTIyQHBvcnRhbCIsIjI1OTI5Nzc3MzUwODE2NTYzNEBwb3J0YWwiLCIyNTkyNTQzMTcwNzkzMzA4MTgiLCIyNTkyNTQwMjAzNTc0ODg2NDIiLCIyNTkyNTY1ODgxMjcxNzQ2NTgiLCIyNTc3ODY5OTEyNDcyOTQ0NjgiXSwiZXhwIjoxNzExMTU5NDI3LCJpYXQiOjE3MTExMTYyMjcsImF6cCI6IjI1OTI1NDQwOTMyMDUyOTkyMkBwb3J0YWwiLCJjbGllbnRfaWQiOiIyNTkyNTQ0MDkzMjA1Mjk5MjJAcG9ydGFsIiwiYWN0Ijp7ImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6OTAwMCIsInN1YiI6IjI1OTI0MTk0NDY1NDI4Mjc1NCJ9LCJhdF9oYXNoIjoiUVZRRm1RejFUS3hiOTgxM3Y2RUlMQSIsIm5hbWUiOiJlbmQgdXNlciIsImdpdmVuX25hbWUiOiJlbmQiLCJmYW1pbHlfbmFtZSI6InVzZXIiLCJuaWNrbmFtZSI6ImVuZC11c2VyIiwiZ2VuZGVyIjoiZmVtYWxlIiwibG9jYWxlIjoiZW4iLCJ1cGRhdGVkX2F0IjoxNzExMDE2Mjk2LCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJlbmQtdXNlciIsImVtYWlsIjoidGltK2VuZC11c2VyQHppdGFkZWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWV9.M-lZwJ2UKpsGARLtGVV0IMQWWeHGw--Q75XcnSIOQat3FZRswUVPpo7Ir2xqvOoi4RCaPdq2Wy8Zl34-RnLOJ0ZtgPhdjx3qLFfJxfZtm_KTCfAaeTRprlwCEjLvZ2RdDsnSZasawRb1Bg_oajtckkEj4MfPyIEhq_RYgERbSZFMNFkQ99WIWnpP6bXVekkYCx2dGpJU3ZHQKUcjt0ejYteGo0-qVRrJCRR994fQddVkB7yYk8fDP7PwNcB6be9db1plpkWJGP3tiOSC6DvBoP8LhMeda4TFM7hgh9iiCqhB-FDbhXuhDFLcGhTrF0XYrowd8LNEtHdAS_T9RNN8xw"
}
```

If we inspect the ID token, we can see that the actor claim is preserved, even after token refresh:

```
{
  "iss": "http://localhost:9000",
  "sub": "259242039378444290",
  "aud": [\
    "259254409320529922@portal",\
    "259297773508165634@portal",\
    "259254317079330818",\
    "259254020357488642",\
    "259256588127174658",\
    "257786991247294468"\
  ],
  "exp": 1711159427,
  "iat": 1711116227,
  "azp": "259254409320529922@portal",
  "client_id": "259254409320529922@portal",
  "act": {
    "iss": "http://localhost:9000",
    "sub": "259241944654282754"
  },
  "at_hash": "QVQFmQz1TKxb9813v6EILA",
  "name": "end user",
  "given_name": "end",
  "family_name": "user",
  "nickname": "end-user",
  "gender": "female",
  "locale": "en",
  "updated_at": 1711016296,
  "preferred_username": "end-user",
  "email": "tim+end-user@zitadel.com",
  "email_verified": true
}
```

### [Impersonation by JWT profile example](https://zitadel.com/docs/guides/integrate/token-exchange#impersonation-by-jwt-profile-example)

If the web-app uses client assertion with JWT, it is also possible to create a self-singed JWT as subject token.

```
curl -L -X POST 'http://localhost:9000/oauth/v2/token' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-H 'Accept: application/json' \
-d 'client_assertion=eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1OTI5Nzc5ODk0MjM1OTU1NCJ9.eyJpc3MiOiIyNTkyOTc3NzM1MDgxNjU2MzRAcG9ydGFsIiwic3ViIjoiMjU5Mjk3NzczNTA4MTY1NjM0QHBvcnRhbCIsImF1ZCI6WyJodHRwOi8vbG9jYWxob3N0OjkwMDAiXSwiaWF0IjoxNzExMTAyNjU3LCJleHAiOjE3MTExMDYyNTd9.QVyS01stBxEeoMsA6FGXrEcbZebGMkj9PzuMO8-Gq-4dkk94O2SkD9LFGOU2QCgQgdUUxYyK363mfO9ihQs01CgYybwsqv8ijcpa_koAK5K2qx6Vrjtiipyr-GTB5egyoETMlxxc9JrvrI4xhtrczXUJNMJ3a4XwxNL7h8pwQCzoJmgAvZXX7JyuWzp8qToN5R9opv-mIpezziDZA4Cm9R8Uo1ASK-pdQ-Fx_DIQgvFXerEfPWAG0tRWV8Usq_bpMPedjWrFB--XeOu3aSFp7YYmo0WLJshIoWI9dJwWrfVI5oG3lHgvvuWpFmzFhi_zkOz4VXdqrPEjs9IUzGwcgQ' \
-d 'client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer' \
-d 'grant_type=urn:ietf:params:oauth:grant-type:token-exchange' \
-d 'subject_token=eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1OTI5Nzc5ODk0MjM1OTU1NCJ9.eyJpc3MiOiIyNTkyOTc3NzM1MDgxNjU2MzRAcG9ydGFsIiwic3ViIjoiMjU5MjQyMDM5Mzc4NDQ0MjkwIiwiYXVkIjpbImh0dHA6Ly9sb2NhbGhvc3Q6OTAwMCJdLCJpYXQiOjE3MTExMDI1NjAsImV4cCI6MTcxMTEwNjE2MH0.d5B-hXi36QfoiBlLxzmUev32RtbD_tSBymPiaph10a6bRvwcwp6mTP9SMFWtYt4wUiITOXRYTaFADqga8xIfa5ZmfR28kES8bqlOtXNlnfQFUH4_yYy8bw02d9v0jArVIkdYpQTVl_Zi9VyRKGcGXmkChNdQXKsF1FIigJeG78jpPTKs0sqRrTIbeDiwvAsWhiUSWPmZ1UsZThsNPrVynUgswLpMADz-f0mbNkc3MT9psDJbTF0tCI7yNTzbGPQymThd5CDVusEHkPA7abiQb4yvhbJvl4yFZxJyodkmNr0CotER-LgzcAYBeLFD07EWmf5Cwsbu3ZMIzcibJNtN5Q' \
-d 'subject_token_type=urn:ietf:params:oauth:token-type:jwt' \
-d 'actor_token=_oFT8JOKtqpS_5M5ml03P4TEQpCj8AT1XFq2jT_iKvgIB9lzjbrOl4MHJ3o3G-RSO_y0FR4' \
-d 'actor_token_type=urn:ietf:params:oauth:token-type:access_token' \
-d 'requested_token_type=urn:ietf:params:oauth:token-type:jwt' \
-d 'scope=openid profile email' | jq
```

The `client_assertion` has the following claims:

```
{
  "iss": "259297773508165634@portal",
  "sub": "259297773508165634@portal",
  "aud": [\
    "http://localhost:9000"\
  ],
  "iat": 1711102657,
  "exp": 1711106257
}
```

And the `subject_token`:

```
{
  "iss": "259297773508165634@portal",
  "sub": "259242039378444290",
  "aud": [\
    "http://localhost:9000"\
  ],
  "iat": 1711102560,
  "exp": 1711106160
}
```

In both cases the issuer is the web application, the audience must be the Custom Domain. For the assertion the subject is the application and for the subject token the subject is the impersonated user.

Response:

```
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1OTM3OTQwMTIwNzA1NDMzOCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjkwMDAiLCJzdWIiOiIyNTkyNDIwMzkzNzg0NDQyOTAiLCJhdWQiOlsiMjU5MjU0NDA5MzIwNTI5OTIyQHBvcnRhbCIsIjI1OTI5Nzc3MzUwODE2NTYzNEBwb3J0YWwiLCIyNTkyNTQzMTcwNzkzMzA4MTgiLCIyNTkyNTQwMjAzNTc0ODg2NDIiLCIyNTkyNTY1ODgxMjcxNzQ2NTgiLCIyNTc3ODY5OTEyNDcyOTQ0NjgiXSwiZXhwIjoxNzExMTQ1OTUxLCJpYXQiOjE3MTExMDI3NTEsIm5iZiI6MTcxMTEwMjc1MSwianRpIjoiMjU5Mzg3MDg2NDYzODI3OTcwIiwiYWN0Ijp7ImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6OTAwMCIsInN1YiI6IjI1OTI0MTk0NDY1NDI4Mjc1NCJ9fQ.sq5lGzxcQ0YePXcl-HjfqlQ8XaDcKhgVR2NJ-t5eMcfMasBKRhAzDhTPPojS32F7RClXgcRbiW-Jgemr4SsUAeZ3abmIGQnjzTu3alDFp9vtOcN1OvWttMl6tgvhW6JzsyRUnPRbC3n4_nRX9rXFi3eg5I3mNYo-a6yOw-pKdLxC2vNBYurFn_1uUbEGG0Z1UTzSHx8PVPpAeJ2nNWd8EN-HskpjSmSpklVazknu6NJHolNvmic0WmlZz_SAQ8M4uvea4aVOw3Uw4QRaPczsUuO0nB0g_bSi8lDH9GIP7CFNuD0BeDwJ-lKdH0QV-cPMuadAgG4G9W_t4IjvXcQYYQ",
  "issued_token_type": "urn:ietf:params:oauth:token-type:jwt",
  "token_type": "Bearer",
  "expires_in": 43199,
  "scope": "openid profile email",
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1OTM3OTQwMTIwNzA1NDMzOCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjkwMDAiLCJzdWIiOiIyNTkyNDIwMzkzNzg0NDQyOTAiLCJhdWQiOlsiMjU5MjU0NDA5MzIwNTI5OTIyQHBvcnRhbCIsIjI1OTI5Nzc3MzUwODE2NTYzNEBwb3J0YWwiLCIyNTkyNTQzMTcwNzkzMzA4MTgiLCIyNTkyNTQwMjAzNTc0ODg2NDIiLCIyNTkyNTY1ODgxMjcxNzQ2NTgiLCIyNTc3ODY5OTEyNDcyOTQ0NjgiXSwiZXhwIjoxNzExMTQ1OTUxLCJpYXQiOjE3MTExMDI3NTEsImF6cCI6IjI1OTI5Nzc3MzUwODE2NTYzNEBwb3J0YWwiLCJjbGllbnRfaWQiOiIyNTkyOTc3NzM1MDgxNjU2MzRAcG9ydGFsIiwiYWN0Ijp7ImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6OTAwMCIsInN1YiI6IjI1OTI0MTk0NDY1NDI4Mjc1NCJ9LCJhdF9oYXNoIjoiMENlN0pUMExHYUVJTmxwQVRIYzFRQSIsIm5hbWUiOiJlbmQgdXNlciIsImdpdmVuX25hbWUiOiJlbmQiLCJmYW1pbHlfbmFtZSI6InVzZXIiLCJuaWNrbmFtZSI6ImVuZC11c2VyIiwiZ2VuZGVyIjoiZmVtYWxlIiwibG9jYWxlIjoiZW4iLCJ1cGRhdGVkX2F0IjoxNzExMDE2Mjk2LCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJlbmQtdXNlciIsImVtYWlsIjoidGltK2VuZC11c2VyQHppdGFkZWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWV9.cMWoJBIPeakjtXWzsW3SGOAjMl27E0q8iePXtUHGueSUMhPibpOn7JiKd7VaZhgMDqN6c5TCU0EErdVm-6bc4SkxqrnYFjX4YIOygoTSbNzqkiOss6ZpcAGHt_RAd-i6NGcEm2_Fqp-EUO45V7jBEWgo3O4XLHsCVV1LQFpCHaSPK0ZtmjmNw-s-UKKF-kdSLLBpYKEUNmWGSMp3MqMgKLwl0SKFOiMY_HmBb-zSDRGN6s68b9Ays6Edxt-EnQ0pfR0TYFbnVSBQCqi5VXt3AcdnV1LRFQWi8ux6YTOiU10fZ3jbOiDjfS85bEKl9Nq5mhxVn9VsO4IiynjA9ZmlLQ"
}
```

And again the access token claims:

```
{
  "iss": "http://localhost:9000",
  "sub": "259242039378444290",
  "aud": [\
    "259254409320529922@portal",\
    "259297773508165634@portal",\
    "259254317079330818",\
    "259254020357488642",\
    "259256588127174658",\
    "257786991247294468"\
  ],
  "exp": 1711145951,
  "iat": 1711102751,
  "nbf": 1711102751,
  "jti": "259387086463827970",
  "act": {
    "iss": "http://localhost:9000",
    "sub": "259241944654282754"
  }
}
```

### [Other usage examples](https://zitadel.com/docs/guides/integrate/token-exchange#other-usage-examples)

Above we gave some of the most straightforward use cases. Of course, you can combine these examples to:

- Impersonate and change the token type
- Impersonate and change scope
- Impersonate and reduce audience
- Impersonate, change the token type, scope and audience

## [Audit trail](https://zitadel.com/docs/guides/integrate/token-exchange#audit-trail)

In the user view of the management console, we can see whenever a new access token is created for a user.
The existing `Access Token created` event is also used in the case of a token exchange.
When there was an `actor_token` present during token exchange, we also log a `User impersonated` event.

![](https://zitadel.com/docs/_next/image?url=%2Fdocs%2F_next%2Fstatic%2Fmedia%2Fuser-audit-log.75d55bfe.png&w=3840&q=75&dpl=dpl_3nc5LtmCr2QiwpWi26HiLthvWsk5)

In the [instance event list](https://zitadel.com/docs/concepts/eventstore/overview) the `User impersonated` carries the actor in the payload:

```
{
  "actor": {
    "issuer": "http://localhost:9000",
    "user_id": "259241944654282754"
  },
  "applicationId": "259297773508165634@portal",
}
```

## [Finishing notes](https://zitadel.com/docs/guides/integrate/token-exchange#finishing-notes)

The current implementation of the Token Exchange grant was our first iteration on the subject.
We love to hear feedback from our users! This is a [GitHub discussion](https://github.com/zitadel/zitadel/discussions/7624) opened specifically for this purpose.

Was this page helpful?

[Web Keys\\
\\
Manage JSON Web Keys (JWKS) in ZITADEL to sign and verify tokens during OIDC and OAuth 2.0 authorization flows](https://zitadel.com/docs/guides/integrate/login/oidc/webkeys) [SAML\\
\\
Integrate SAML Single Sign-On (SSO) in your applications using ZITADEL as an Identity Provider (IdP).](https://zitadel.com/docs/guides/integrate/login/saml)
