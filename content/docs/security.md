# Security and access

Infrayard runs entirely in your environment. OCI credentials, Terraform state, the database and logs stay with you; there is no Solvia Lab cloud service in the path, and Infrayard sends no data to Solvia Lab.

## Identity and roles

Sign-in uses OpenID Connect with the Authorization Code flow and PKCE, handled by Keycloak: the one bundled with Infrayard or a realm in your existing Keycloak. The portal is a public client, so no client secret is stored in the browser. The API checks the signature, issuer and audience of every token.

Infrayard creates a user record on the first sign-in. Access is controlled by Keycloak roles or groups:

- **Admin role**: the administration area, all clusters, users, configuration, templates, requests and audit log.
- **Access role** (optional): only users with it may sign in. Use it with a shared company realm.
- **Template roles**: a template can require a role, so only some users see it.

When a role is removed or the Keycloak session ends, the user is signed out within a few minutes. Details: [Use your own Keycloak](/docs/keycloak/#roles).

## OCI credentials

Infrayard acts in OCI as one service user with an API key. Its policies are scoped to the anchor compartment; read access covers the tenancy so that regions, shapes and networks can be listed. See [Prepare OCI](/docs/oci-setup/#3-add-the-policies).

Where the credentials are stored:

| Secret | Kubernetes | Single VM |
| --- | --- | --- |
| OCI API private key | Secret `infrayard-oci-key`, mounted read-only into the API | `oci_api_key.pem`, readable only by the API container user |
| S3 key for the state bucket, database and Keycloak passwords | Secrets created by the chart from your values | `.env` file, mode 600 |

Keep these in your secret manager. Never send them in support requests.

Rotating the API key: add a new key to the OCI user, update the secret (or file) and the fingerprint, roll out, then delete the old key in OCI.

## Kubernetes access

Users download a kubeconfig from a running cluster's detail page. It works with plain `kubectl`, without the OCI CLI:

```bash
export KUBECONFIG=~/Downloads/oke-my-cluster-kubeconfig.yaml
kubectl get nodes
```

How it works:

- Each Infrayard user gets their own ServiceAccount in the namespace `infrayard-system` of the cluster, so Kubernetes audit logs show the actual person.
- The ServiceAccount is bound to **`cluster-admin`**. Everyone who may download a kubeconfig for a cluster has full rights on it.
- The embedded token is valid for up to 30 days; the cluster may shorten that. Download a new kubeconfig when it expires.
- To revoke a user's access to a cluster at once, delete their ServiceAccount: `kubectl delete serviceaccount <user> -n infrayard-system`.

Users with an OCI CLI setup can download an alternative kubeconfig that authenticates through the OCI CLI.

Cluster owners download access for their clusters; administrators can download it for every cluster in **All Clusters → Details**. Include this in your access review.

The kubeconfig does not create a network path. Users need a route to the cluster's API endpoint; see [networking](/docs/networking/#kubernetes-api-endpoint-access).

## SSH access

Terraform generates an SSH key pair for each cluster's worker nodes. The private key is stored in the Infrayard database and can be downloaded from the cluster's detail page. Treat it as a credential, and treat database backups as sensitive for this reason.

## Audit and approvals

Every lifecycle operation records who did what, on which cluster, the result and the duration. Destroy requests and limit-increase requests record the submission and the decision. Administrators can force-destroy a cluster for incident response; this is recorded too.

The Activity inbox shows lifecycle events, request outcomes and limit changes. Optional e-mail notifications send event details to the configured recipients through your SMTP server.

## Network exposure

The portal is the only inbound endpoint. The Keycloak admin console is not exposed: on Kubernetes it is reached with `kubectl port-forward`, on the single VM through an SSH tunnel. We recommend making the portal reachable [only from your VPN](/docs/private-access/).

Outbound, Infrayard needs OCI APIs, the image registry and the cluster APIs; see [requirements](/docs/requirements/#network).

## Hardening built in

- On Kubernetes, the Infrayard, Keycloak and PostgreSQL containers run as non-root users and drop all Linux capabilities; the API and the portal also use read-only root file systems. On the single VM, the API runs as a non-root user and the portal container is read-only.
- The portal sends security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) and redirects HTTP to HTTPS.
- Configuration or secret changes roll the affected pods automatically on `helm upgrade`.

## Your security review

Before production, review TLS and exposure, OCI policy scope, who holds the admin role, kubeconfig rights, secret storage, database and state backups, and log access. Security questionnaires and additional evidence can be arranged through [Enterprise](/?enquiry=enterprise#demo).
