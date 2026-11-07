# Use your own Keycloak

By default Infrayard brings its own Keycloak with a ready realm. If your company already runs Keycloak, Infrayard can sign users in through a realm there instead, so people use their existing accounts and you manage access with roles or groups you already have.

This option is available for the [Kubernetes installation](/docs/install-kubernetes/). It is tested with Keycloak 22 and 26; use Keycloak 22 or newer.

## How sign-in works

1. The portal sends the user to your Keycloak login page (OpenID Connect, Authorization Code flow with PKCE).
2. Keycloak returns an access token to the portal client `infrayard-portal`. It is a public client: there is no client secret to store.
3. The Infrayard API checks the token's signature against the realm keys, its issuer and that it was issued to `infrayard-portal`.
4. On the first sign-in Infrayard creates its own user record from the token. There is no directory sync.

The token must contain `sub`, `preferred_username`, `email` and the roles or groups described below. Keycloak includes them by default.

## Roles

| Role | Default name | What it does |
| --- | --- | --- |
| Admin role | `admin` | Administration: all clusters, users, configuration, templates, requests and audit log |
| Access role | none | When set, only users with this role (or the admin role) may use Infrayard. Others see "Your account is not allowed to use Infrayard" and are signed out |
| Template roles | your choice, for example `testing`, `production` | Templates can require a role; only users holding it see the template |

In a shared company realm, choose names that cannot clash with existing roles, such as `infrayard-admin` and `infrayard-user`, and always set the access role. Without it, every account in the realm can sign in and create clusters within the default limits.

Infrayard can read these names from one of three places in the token:

| Source | `rolesClaim` value | You assign |
| --- | --- | --- |
| Realm roles (default) | `realm_access.roles` | Realm roles, directly or through a group |
| Client roles | `resource_access.infrayard-portal.roles` | Roles of the client `infrayard-portal` |
| Groups | `groups` | Group membership (the group name is compared) |

## 1. Set the Helm values

Add these values to your `values.yaml` from the [Kubernetes guide](/docs/install-kubernetes/#4-write-the-values-files):

```yaml
keycloak:
  enabled: false                 # do not install the bundled Keycloak

api:
  oidc:
    issuer: https://sso.example.com/realms/acme
    clientId: infrayard-portal
    rolesClaim: realm_access.roles
    adminRole: infrayard-admin
    requiredRole: infrayard-user
```

The `issuer` must be exactly the `iss` value of your tokens. Check it at `https://sso.example.com/realms/acme/.well-known/openid-configuration`. Keycloak versions before 17, and some installations, use the path `/auth/realms/acme`.

The `keycloak.admin.password` and `keycloak.realmImport` values are not needed in this mode.

## 2. Install and import the client

Install or upgrade with Helm as in the Kubernetes guide. The chart then prepares a Keycloak import file that matches your values: the client, the admin and access roles, and for `rolesClaim: groups` the groups and the group mapper. Export it:

```bash
kubectl get configmap infrayard-oidc-client -n infrayard \
  -o jsonpath='{.data.keycloak-partial-import\.json}' > infrayard-keycloak.json
```

In the Keycloak admin console, open your realm, then **Realm settings → Action (top right) → Partial import**. Select the file, choose **If a resource exists: Skip** and click **Import**.

The imported client `infrayard-portal` is public and uses the Standard flow with PKCE (S256). It accepts exactly `https://infrayard.example.com/` as redirect URL and `https://infrayard.example.com` and `https://infrayard.example.com/` as post-logout URLs; no other address of the domain is accepted.

A client imported for Infrayard `1.0.1` or earlier allows `https://infrayard.example.com/*`. Change it to the exact values in **Clients → infrayard-portal → Settings**: **Valid redirect URIs** `https://infrayard.example.com/`, **Valid post logout redirect URIs** `https://infrayard.example.com` and `https://infrayard.example.com/`. With a wildcard, a link to another page of the domain could receive the sign-in code.

Security settings of the realm are yours to choose in your Keycloak; Infrayard changes nothing there. We recommend what the bundled Keycloak uses: a password policy (**Authentication → Policies → Password policy**), brute force detection (**Realm settings → Security defenses → Brute force detection**) and event logging (**Realm settings → Events**). The values are listed under [hardening built in](/docs/security/#hardening-built-in).

`helm status infrayard -n infrayard` prints the same instructions with your values.

## 3. Give users access

Assign the admin role and the access role to the right people, preferably through groups. For example, in **Groups → platform-team → Role mapping → Assign role**, add `infrayard-admin`; in **Groups → engineering**, add `infrayard-user`.

Sign in at `https://infrayard.example.com` with an admin account and open **Admin**. A role change takes effect with the user's next token, at the latest after the access token lifetime of your realm (5 minutes by default). Users whose role was removed are signed out with a message; users whose Keycloak session ends are signed out as well.

## Keycloak with a private CA

If Keycloak's certificate comes from an internal company CA, browsers trust it through your device management, but the Infrayard API needs the CA explicitly to fetch the realm keys. Add the CA certificate:

```yaml
api:
  oidc:
    ca:
      cert: |
        -----BEGIN CERTIFICATE-----
        MIIDdzCCAl+gAwIBAgIU...
        -----END CERTIFICATE-----
```

Or reference an existing ConfigMap in the `infrayard` namespace, for example one managed by trust-manager:

```yaml
api:
  oidc:
    ca:
      existingConfigMap: company-ca
      key: ca.crt
```

Public CAs remain trusted in both cases.

## Keycloak under another address inside the cluster

Users reach Keycloak at the public issuer address. If the Infrayard API cannot use that address (split-horizon DNS, no route from the cluster to it), give it an internal address of the same realm:

```yaml
api:
  oidc:
    issuer: https://sso.example.com/realms/acme
    internalUrl: http://keycloak.sso.svc.cluster.local:8080/realms/acme
```

Only the signing keys are fetched there; tokens must still carry the public issuer.

## Changing the role source later

The import uses **Skip** for existing objects. If you later switch to `rolesClaim: groups`, the existing client does not get the group mapper. Add a **Group membership** mapper named `groups` (token claim name `groups`, full group path off) to the client's dedicated scope, or delete the client and import the new file.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| After the Keycloak login the portal does not load your data (API answers 401) | `issuer` differs from the token's `iss` (for example `/auth` in the path). Compare with the realm's `.well-known/openid-configuration` |
| "Your account is not allowed to use Infrayard" | The user lacks the access role, or `rolesClaim` points to the wrong place. Decode a token and check the claim |
| No **Admin** menu for an admin | The admin role is not in the claim named by `rolesClaim` |
| API log: `Cannot fetch OIDC signing keys` | The API cannot reach Keycloak or does not trust its certificate. Set `internalUrl` or `ca` |
| Keycloak error "Invalid parameter: redirect_uri" | The client's redirect URI does not match the Infrayard domain. Re-import, or fix the client's Valid redirect URIs |
