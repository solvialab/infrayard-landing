# Troubleshooting and support

Start with the logs. For a failed cluster operation, open the operation's Terraform log in the portal. For the installation itself:

```bash
# Kubernetes
kubectl get pods -n infrayard
kubectl describe pod -n infrayard <pod>
kubectl logs -n infrayard deploy/infrayard-api --tail=200
```

Note the time and the exact error before you retry, and check what actually exists in OCI before starting a second operation on the same cluster.

## Installation

| Symptom | Cause and fix |
| --- | --- |
| `infrayard-api` pod stays in `Init` or `ContainerCreating`; events mention `infrayard-oci-key` | The OCI key secret is missing or in another namespace. Create it as in [step 3](/docs/install-kubernetes/#3-create-the-namespace-and-secrets) |
| `ImagePullBackOff`, or `helm show chart` fails with `401`, `403`, `unauthorized` or `denied` | The registry login or the `regcred` secret is missing, has a typo, or the token has expired. Check `global.imagePullSecrets` and the image addresses. If the login succeeds but pulling still fails, the token lacks read access to the registry; ask support for a new token |
| API log or `oci` CLI shows `401 NotAuthenticated` right after the OCI user or API key was created | OCI needs a few minutes to activate a new user and key in every service. Wait five minutes and retry. If it persists, compare the fingerprint, user OCID and tenancy OCID with the API key page |
| API log shows `404 NotAuthorizedOrNotFound` for OCI calls | A policy statement is missing or names the wrong group or compartment. Compare with [Prepare OCI](/docs/oci-setup/#3-add-the-policies) |
| Traefik install on OKE fails with `cannot unmarshal number into Go struct field ObjectMeta.metadata.annotations of type string` | The load balancer annotations were passed with `--set`, which turns `10` and `100` into numbers. Use `--set-string` as in [step 1](/docs/install-kubernetes/#1-ingress-controller-and-certificates) |
| Pod stays in `Init:ImageInspectError`; events show `short name mode is enforcing` | OKE nodes run CRI-O, which accepts only fully qualified image names. An image override such as `postgres:18-alpine` must name its registry: `docker.io/library/postgres:18-alpine` |
| After a `helm upgrade` that fixes an image or setting, `infrayard-postgresql-0` keeps its old error | A StatefulSet does not replace a pod that never became ready. Delete it with `kubectl delete pod -n infrayard infrayard-postgresql-0`; it starts again with the new settings and keeps its volume |
| `helm install` fails with `... is required` | A required value is missing, for example `postgresql.auth.password` or `keycloak.admin.password`. Add it to `secrets.yaml` |
| Certificate stays `READY False` | DNS does not point to the ingress yet, or port 80 is not reachable from the internet. Check `kubectl describe certificate -n infrayard infrayard-tls` and `kubectl get challenges -A` |
| Sign-in shows `502 Bad Gateway` or a Keycloak error page | Keycloak is still starting (about a minute on the first start) or the realm import failed. Check the Keycloak logs for `Realm 'infrayard' imported` |
| Keycloak does not start, log shows `password authentication failed` | The database password changed after the first start. The database keeps the password it was created with; set the original value again |

## Sign-in and roles

| Symptom | Cause and fix |
| --- | --- |
| "Your account is not allowed to use Infrayard" | The user lacks the access role (`requiredRole`). Assign it in Keycloak; it takes effect at the next sign-in |
| No **Admin** menu | The user lacks the admin role, or `rolesClaim` points to the wrong claim |
| Sign-in works but data does not load | The issuer setting does not match the token. See [Keycloak troubleshooting](/docs/keycloak/#troubleshooting) |
| A template is missing for a user | The template requires a role the user does not hold |
| A role change has no effect | Roles are read from the token; the user gets the change with the next token, within the token lifetime (5 minutes by default) |

## Missing versions or shapes

In **Admin → Configuration**, sync shapes and Kubernetes versions from OCI for the configured region. Newly found Kubernetes versions must be enabled by an administrator. A version is only offered when OCI has a node image for it and the selected shape.

If the check with OCI fails, deployment is blocked on purpose. Then check the OCI user's policies and the API's outbound access. With the OCI CLI configured for the same user, this shows what OCI offers:

```bash
oci ce node-pool-options get --node-pool-option-id all --region eu-frankfurt-1
```

## Existing-network validation fails

- An existing subnet also needs its VCN OCID.
- The compartment must be the anchor or below it.
- A compartment alone does not reuse its VCN; Infrayard creates a new one.
- With **Public endpoint restricted by CIDR allowlist** on, existing VCNs and subnets are rejected.

See [networking](/docs/networking/#bringing-your-own-network).

## Worker nodes do not become ready

Look at the Terraform log and the node pool in the OCI Console. Common causes: service limits or quotas, no capacity for the shape in the availability domain, or a shape without a matching image. With your own subnet, the subnet needs a NAT gateway route and a service gateway route; without them nodes cannot register.

## kubectl cannot connect

The kubeconfig only authenticates; it does not open a network path. Check that you are on the VPN, that the cluster's endpoint mode fits your network, and that your egress range is in **Allowed API CIDRs** (**Admin → Configuration → OCI Settings**). Infrayard's own outbound address must be in the allowlist as well, otherwise the kubeconfig download fails; the deploy log then ends with `Cluster API endpoint … not reachable from Infrayard`. See [step 7 of the Kubernetes guide](/docs/install-kubernetes/#7-sign-in) for how to find that address.

## A limit blocks a request

Check the global default, the user's own limit and the template. Users can request more in the portal; administrators approve or adjust it in **Requests**. Templates may allow more than a user's limit for custom configurations.

## A cluster operation fails

Read the Terraform log, then check the resources in OCI. A failed deployment offers a cleanup action that removes partial resources; check what it will remove first. For Basic clusters, changes to nodes or a Kubernetes upgrade need a rolling worker refresh.

Do not repair Infrayard-managed resources by hand in the OCI Console as a routine fix; the next Terraform run overwrites the changes. If you must intervene, contact support before running further operations on that cluster.

## Contact support

Write to [support@infrayard.eu](mailto:support@infrayard.eu) or use the [support form](/?enquiry=support#demo). Include:

- The Infrayard version and where it runs (OKE, k3s or other Kubernetes).
- What you did, the approximate time and the region.
- The error message and the relevant log lines.
- Recent changes and what you have already tried.

Remove private keys, tokens, passwords and personal data before you send logs. Response times and support hours are part of your subscription; see [Enterprise](/?enquiry=enterprise#demo) for extended support.
