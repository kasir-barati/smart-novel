import axios from 'axios';
import { isEmpty } from 'class-validator';
import { urlBuilder } from 'nestjs-backend-common';
import * as qs from 'node:querystring';

export class AuthorizationFixture {
  static async getUserAuthorizationHeader(): Promise<string> {
    return AuthorizationFixture.impersonateUser(
      process.env.E2E_USER_USER_ID!,
    );
  }

  static async getAdminAuthorizationHeader(): Promise<string> {
    return AuthorizationFixture.impersonateUser(
      process.env.E2E_ADMIN_USER_ID!,
    );
  }

  static async getWriterAuthorizationHeader(): Promise<string> {
    return AuthorizationFixture.impersonateUser(
      process.env.E2E_WRITER_USER_ID!,
    );
  }

  /**
   * Impersonate a human user via RFC 8693 token exchange.
   *
   * The bot machine-user's PAT (E2E_OIDC_PAT) is used as the
   * `actor_token`. The bot must have the IAM_END_USER_IMPERSONATOR
   * role assigned at the instance level.
   *
   * The e2e confidential OIDC app (E2E_OIDC_CLIENT_ID) is used as
   * the `client_id` in the token-exchange request, and authenticates
   * via HTTP Basic with E2E_OIDC_CLIENT_SECRET.
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

    const botPat = process.env.E2E_OIDC_PAT;
    if (isEmpty(botPat)) {
      throw new Error(
        `E2E_OIDC_PAT environment variable is required to impersonate users (bot PAT as actor token).`,
      );
    }

    // Use the bot's PAT as the actor_token and the e2e confidential
    // app's credentials for HTTP Basic auth.
    const tokenEndpoint = urlBuilder(iss!, 'oauth', 'v2', 'token');
    const body = qs.stringify({
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token_type:
        'urn:zitadel:params:oauth:token-type:user_id',
      subject_token: userId,
      actor_token: botPat,
      actor_token_type:
        'urn:ietf:params:oauth:token-type:access_token',
      requested_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      scope: scopes,
    });
    const { data } = await axios.post(tokenEndpoint, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      auth: { username: clientId!, password: clientSecret! },
    });

    return `Bearer ${data.access_token}`;
  }
}
