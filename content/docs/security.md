# Security and access

Infrayard's portal and API run in your environment. OCI credentials stay in your Kubernetes Secrets, Terraform state stays in your OCI Object Storage bucket and operational records and audit logs stay in your PostgreSQL database. Infrayard sends no operational data to Solvia Lab. Commercial onboarding and support run separately from your deployment.

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

| Secret | Where |
| --- | --- |
| OCI API private key | Secret `infrayard-oci-key`, mounted read-only into the API |
| S3 key for the state bucket, database and Keycloak passwords | Secrets created by the chart from your values |

Keep these in your secret manager. Never send them in support requests.

Rotating the API key: add a new key to the OCI user, update the secret and the fingerprint, roll out, then delete the old key in OCI.

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

The portal is the only inbound endpoint. Of the bundled Keycloak, only the sign-in pages of the `infrayard` realm are public; the master realm and the admin console answer `404` and are reached with `kubectl port-forward`. We recommend making the portal reachable [only from your VPN](/docs/private-access/).

Outbound, Infrayard needs OCI APIs, the image registry and the cluster APIs; see [requirements](/docs/requirements/#network).

## Hardening built in

- The Infrayard, Keycloak and PostgreSQL containers run as non-root users and drop all Linux capabilities. Only PostgreSQL's init container runs as root, with just the capabilities it needs to set the owner of the data directory. The API, the portal and PostgreSQL also use read-only root file systems. The images contain no package manager for Python, no `curl` and no `git`.
- Network policies let only the portal accept connections from outside the installation; the API, Keycloak and PostgreSQL accept only the pods that use them. k3s enforces them out of the box. On OKE they take effect only with a network policy controller such as Calico.
- The portal sends a strict Content Security Policy, HSTS, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options`, `Permissions-Policy` and cross-origin isolation headers, and redirects HTTP to HTTPS.
- Optional [rate limiting](#rate-limiting) of sign-in and API requests per client address.
- The bundled Keycloak requires passwords of at least 12 characters that differ from the user name, the e-mail and the last five passwords. After 5 failed sign-ins an account is locked for a minute; further failures lengthen the lockout, up to 15 minutes. Keycloak keeps sign-in events for 30 days and logs every change made in its admin console.
- The portal client accepts only the portal address as redirect and post-logout URL.
- Every kubeconfig and SSH key download is written to the audit log.
- The API documentation endpoints are off.
- Configuration or secret changes roll the affected pods automatically on `helm upgrade`.

After every install and upgrade, a job applies the Keycloak settings above to an existing installation: to the master realm, the `infrayard` realm and the portal client. It changes only values still at the old defaults, so settings you chose yourself stay. Its log stays for an hour and shows what it changed: `kubectl logs -n infrayard job/infrayard-keycloak-hardening`. Set `keycloak.hardening.enabled: false` to manage these settings only by hand.

The job signs in as the Keycloak master `admin` with the password from `secrets.yaml`. Keycloak calls this account a temporary admin and suggests replacing it with a permanent one. If you do, the job can no longer sign in, changes nothing and says so in its log. Then check these settings by hand in the admin console, in both the master and the `infrayard` realm: **Authentication → Policies → Password policy**, **Realm settings → Security defenses → Brute force detection** and **Realm settings → Events**.

## Rate limiting

The portal can limit sign-in and API requests per client address and answer `429` above the limit. It is off by default, because it needs each user's own address. Behind a load balancer or a Service with `externalTrafficPolicy: Cluster`, the portal sees one address for everyone, and all users would share one limit. Keycloak's lockout protects sign-in either way.

Check what the portal sees. The first field of each line of `kubectl logs -n infrayard deploy/infrayard-frontend` must be the user's public or VPN address, not an address of the cluster network. The OCI load balancer from [step 1 of the Kubernetes guide](/docs/install-kubernetes/#1-ingress-controller-and-certificates) puts its own address there, so leave rate limiting off behind it.

On k3s, Traefik keeps the client address with `externalTrafficPolicy: Local`. This suits a single-node k3s; with several nodes, only the nodes that run Traefik accept traffic. If a `HelmChartConfig` named `traefik` already exists, add the `service` lines to it instead of replacing it:

```bash
kubectl apply -f - <<'EOF'
apiVersion: helm.cattle.io/v1
kind: HelmChartConfig
metadata:
  name: traefik
  namespace: kube-system
spec:
  valuesContent: |-
    service:
      spec:
        externalTrafficPolicy: Local
EOF
```

Then turn rate limiting on in `values.yaml` and run `helm upgrade`:

```yaml
frontend:
  rateLimit:
    enabled: true
```

The limits are 5 sign-in requests per second with bursts of 30, and 30 API requests per second with bursts of 100, per address. Users behind one NAT share an address, so the limits leave room for several of them. Static files of the portal are not limited. If a proxy outside the private address ranges sits in front of the ingress, add its ranges to `frontend.trustedProxies`; the portal ignores `X-Forwarded-For` from other sources.

## Your security review

Before production, review TLS and exposure, OCI policy scope, who holds the admin role, kubeconfig rights, secret storage, database and state backups, and log access. Security questionnaires and additional evidence can be arranged through [Enterprise](/?enquiry=enterprise#demo).
