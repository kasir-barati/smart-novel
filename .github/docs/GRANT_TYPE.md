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

### Flow

1. **User clicks "Login"** → Frontend redirects to Auth.js sign-in URL.
2. **Auth.js redirects** → ZITADEL login page.
3. **User authenticates** → ZITADEL redirects back to Auth.js callback.
4. **Auth.js processes callback** → Sets session cookie.
5. **Frontend callback page** → Verifies session and redirects to home.
6. **Subsequent requests** → Session cookie automatically sent with all GraphQL requests.
7. **Backend AuthGuard** → Validates session on every protected request.

#### 1. `useAuth` Hook (`apps/frontend/src/hooks/useAuth.ts`)

Custom hook that provides authentication functionality:

- `user`: Current user data (email, sub, orgId, roles)
- `isAuthenticated`: Boolean indicating if user is logged in
- `loading`: Loading state while checking session
- `login()`: Redirects to ZITADEL login page
- `logout()`: Logs out and clears session
- `checkSession()`: Manually refresh session status

###### 2. Updated Header (`apps/frontend/src/app/layout/Header.tsx`)

- Shows "Login" button when not authenticated
- Shows user email and "Logout" button when authenticated
- Automatically checks authentication status on mount

###### 3. Callback Page (`apps/frontend/src/pages/auth/CallbackPage.tsx`)

- Handles the redirect after ZITADEL authentication
- Waits for Auth.js to set the session cookie
- Verifies authentication and redirects to home page
- Shows a loading spinner during processing

###### 4. Updated Axios Instance (`apps/frontend/src/hooks/useApi.ts`)

- Configured with `withCredentials: true` to send cookies with every request
- Session cookie automatically included in all GraphQL requests

#### Backend Integration

The backend GraphQL API provides:

##### 1. `authUrls` Query

Returns Auth.js URLs for the OIDC flow:

```graphql
query GetAuthUrls {
  authUrls {
    signIn # URL to start login
    signOut # URL to logout
    session # URL to check session
    callback # OIDC callback URL
  }
}
```

##### 2. `whoAmI` Query

Returns current user information (requires authentication):

```graphql
query WhoAmI {
  whoAmI {
    sub
    email
    emailVerified
    orgId
    roles
  }
}
```

##### 3. `AuthGuard`

- Validates the session cookie on every protected GraphQL request
- Uses Auth.js session validation
- Returns 401 Unauthorized if session is invalid/expired

#### Usage

##### Check if User is Logged In

```tsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (isAuthenticated) {
    return <div>Welcome, {user.email}!</div>;
  }

  return <div>Please log in</div>;
}
```

##### Trigger Login

```tsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { login } = useAuth();

  return <button onClick={login}>Login with ZITADEL</button>;
}
```

##### Logout

```tsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { logout } = useAuth();

  return <button onClick={logout}>Logout</button>;
}
```

#### Configuration Requirements

##### Frontend Environment Variables

No additional environment variables needed. The frontend automatically uses the backend URL from `VITE_SERVICE_URL`.

##### Backend Requirements

The backend must have:

1. Auth.js configured with ZITADEL as provider
2. Callback URL registered: `<backend-url>/auth/callback/zitadel`
3. Session cookie configuration (httpOnly, secure in production)
4. CORS configuration allowing credentials from frontend domain

#### Security Considerations

1. **Session Cookies**: Automatically handled by the browser, httpOnly for security
2. **PKCE**: Authorization Code + PKCE flow prevents code interception attacks
3. **No Token Storage**: No access tokens stored in localStorage/sessionStorage
4. **Automatic Validation**: Backend validates session on every request
5. **Secure by Default**: Session cookies marked as secure in production

#### Troubleshooting

##### Login button doesn't work

- Check browser console for errors
- Verify backend is running and accessible
- Check that `authUrls` query returns valid URLs

##### Session not persisting

- Ensure `withCredentials: true` is set in axios config
- Check browser allows third-party cookies (if frontend/backend on different domains)
- Verify CORS configuration on backend allows credentials

##### Callback page stuck loading

- Check that Auth.js callback is processing correctly on backend
- Verify `/auth/callback/zitadel` route is accessible
- Check browser network tab for errors

##### 401 Unauthorized on GraphQL requests

- Session cookie may have expired
- Try logging out and logging back in
- Check that cookies are being sent with requests (Network tab)

#### Testing

To test the authentication flow:

1. Start backend: `npm run serve:backend`
2. Start frontend: `npm run serve:frontend`
3. Open browser to `http://localhost:4200`
4. Click "Login" button
5. Authenticate with ZITADEL
6. Verify redirect back to home page
7. Verify user email shown in header
8. Test that GraphQL requests include session cookie
9. Click "Logout" to test logout flow

### IdP Swappability

- Auth.js supports dozens of providers — changing from ZITADEL to Keycloak/Auth0/Okta is just swapping the provider config in `createAuthConfig()`.
- Your app never touches raw OIDC endpoints directly (except refresh, which is standard).
- The session management is abstracted by Auth.js.
