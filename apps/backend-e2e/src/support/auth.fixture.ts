import axios from 'axios';
import { isEmpty } from 'class-validator';
import { urlBuilder } from 'nestjs-backend-common';
import * as qs from 'node:querystring';

export class AuthorizationFixture {
  private async getActorAccessToken() {
    /**
     * @description Decode the keyContent from base64 to get the actual key data. keyContent is base64-encoded JSON.
     * @type {DecodedKeyContent}
     */
    const decodedKey = JSON.parse(
      Buffer.from(
        integrationTestBotKey.keyContent,
        'base64',
      ).toString('utf-8'),
    );
    const { keyId, key, userId } = decodedKey;

    // Convert RSA private key to PKCS8 format that jose can use
    const privateKey = createPrivateKey({ key, format: 'pem' });
    const pkcs8Key = privateKey
      .export({ type: 'pkcs8', format: 'pem' })
      .toString();
    const pk = await importPKCS8(pkcs8Key, 'RS256');

    const now = Math.floor(Date.now() / 1000);

    // aud must be the issuer base URL (Zitadel's external URL)
    const assertion = await new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: keyId })
      .setIssuedAt(now)
      .setExpirationTime(now + 60)
      .setIssuer(userId)
      .setSubject(userId)
      .setAudience(zitadelIssuer)
      .sign(pk);

    const body = new URLSearchParams();

    body.set(
      'grant_type',
      'urn:ietf:params:oauth:grant-type:jwt-bearer',
    );
    body.set('assertion', assertion);
    // Add client credentials for JWT Profile grant
    body.set('client_id', clientId);
    body.set('client_secret', clientSecret);
    // Ask for audiences + roles to ease later introspection, though not strictly needed for actor
    body.set('scope', scopes);

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const json = await response.json();

    if (!response.ok) {
      throw new Error(
        `JWT Profile token failed: ${response.status} ${JSON.stringify(json)}`,
      );
    }

    return json.access_token;
  }

  /**
   * Impersonate a human user via RFC 8693 token exchange.
   */
  private static async impersonateUser(
    userId: string,
  ): Promise<string> {
    const iss = process.env.ZITADEL_ISSUER_URL;
    if (isEmpty(iss)) {
      throw new Error(
        `ZITADEL_ISSUER_URL environment variable is required to impersonate users.`,
      );
    }

    const scopes = process.env.VITE_OIDC_SCOPE;
    if (isEmpty(scopes)) {
      throw new Error(
        `VITE_OIDC_SCOPE environment variable is required to impersonate users.`,
      );
    }

    const clientId = process.env.E2E_OIDC_CLIENT_ID;
    if (isEmpty(clientId)) {
      throw new Error(
        `E2E_OIDC_CLIENT_ID environment variable is required to impersonate users.`,
      );
    }

    const clientSecret = process.env.E2E_OIDC_CLIENT_SECRET;
    if (isEmpty(clientSecret)) {
      throw new Error(
        `E2E_OIDC_CLIENT_SECRET environment variable is required to impersonate users.`,
      );
    }

    const tokenEndpoint = urlBuilder(iss!, 'oauth', 'v2', 'token');
    const jwtBody = qs.stringify({
      grant_type: 'client_credentials',
      scope:
        'openid profile email urn:zitadel:iam:org:project:id:zitadel:aud',
    });
    const jwtResponse = await axios.post(tokenEndpoint, jwtBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      auth: { username: clientId!, password: clientSecret! },
    });
    const botJwt = jwtResponse.data.access_token;
    const exchangeBody = qs.stringify({
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token_type:
        'urn:zitadel:params:oauth:token-type:user_id',
      subject_token: userId,
      actor_token: botJwt,
      actor_token_type:
        'urn:ietf:params:oauth:token-type:access_token',
      requested_token_type: 'urn:ietf:params:oauth:token-type:jwt', // https://zitadel.com/docs/guides/integrate/token-exchange#requested-token-type
      scope: scopes,
    });
    const { data } = await axios.post(tokenEndpoint, exchangeBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      auth: { username: clientId!, password: clientSecret! },
    });

    return `Bearer ${data.access_token}`;
  }
}
