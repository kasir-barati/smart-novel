## [`Host` Header](https://zitadel.com/docs/self-hosting/manage/custom-domain)

ZITADEL maps every request to an instance by host+proto:

- ZITADEL selects the instance by the HTTP `Host` it receives, or a configured forwarded host.
- If the incoming Host does **NOT** match one of the instance's known domains, ZITADEL returns `Instance not found`.
- That's by design for multi‑tenancy and is documented in their "External access" and reverse‑proxy guides.

> [!TIP]
>
> So the fix is not "set Host in every call" and also not "rewrite Host in Traefik.". The fix is:
>
> **Goal**: register your Docker service name (e.g. `zitadel`) as an additional instance domain.
