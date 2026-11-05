# Security and access

Infrayard runs in the customer environment. OCI credentials, Terraform state, platform metadata and operational records are managed within that environment; a Solvia-hosted SaaS control plane is not required.

## Identity and roles

Authentication uses OpenID Connect with the Authorization Code flow and PKCE. The browser does not store a confidential OIDC client secret. Sign-in is handled by Keycloak: either the Keycloak bundled with Infrayard, or a realm in your organisation's existing Keycloak.

Users are created on first login from their identity claim. An admin role grants access to the administration panel. Template role requirements can restrict which approved configurations a user sees. Roles come from Keycloak realm roles, client roles or groups; an optional access role limits who can sign in at all.

Changing template visibility or resource limits is not a substitute for reviewing OCI permissions and Kubernetes access rights. Review each layer against your organisation's access policy.

## OCI credentials

The runner needs an OCI service identity with permissions for the resources it manages. Scope that identity to your selected anchor compartment and required resource families. A tenancy-root anchor needs correspondingly broader permissions.

The exact policy statements and secret provisioning are part of the customer deployment runbook. Keep API keys, signing keys, database passwords and registry tokens in your approved secret-management process. Do not send them through website forms or include them in support attachments.

## Kubernetes access

Authorised users can download a kubeconfig from a running cluster's detail page. The documented default uses a per-user Kubernetes ServiceAccount token, allowing `kubectl` access without local OCI CLI configuration. An explicit OCI-exec fallback is available for users who use OCI CLI authentication.

```bash
export KUBECONFIG=~/oke-my-cluster-kubeconfig.yaml
kubectl get nodes
```

Authentication does not establish a network route. The user's machine and runner must reach the OKE API endpoint. See [networking and connectivity](/docs/networking/#kubernetes-api-endpoint-access).

During security review, confirm the Kubernetes permissions, token lifetime, revocation procedure and downloaded credential handling for your supplied release. Website documentation is not a guarantee of a particular token expiry or a replacement for that review.

Administrators can download access files for other users' clusters from **All Clusters → Details**. Include this privilege in your role review.

## SSH access

Terraform-generated worker-node SSH keys are available through the documented cluster detail workflow. Treat downloaded private keys as credentials and retain them in your approved secure store. Confirm retrieval and rotation behaviour for your release; do not assume a later download will be available.

## Audit and approvals

Lifecycle operations record actor, action, cluster, outcome and duration. Protected destroy requests and limit-increase requests record submission and review decisions. Administrators retain a privileged force-destroy path for incident response.

The Activity inbox also records lifecycle events, request outcomes and limit changes. Optional SMTP notifications can send event details to configured recipients. Account for those emails when reviewing information flows and retention.

## Network and delivery boundary

The installation still needs access to OCI APIs, its identity endpoints, required OKE endpoints and the approved registry delivery path. Optional SMTP and customer-selected integrations have their own destinations. Mirroring container images alone does not establish disconnected operation.

Private endpoints and restricted public endpoints have different routing prerequisites. A future access agent is listed separately on the [roadmap](/docs/releases/#planned-work).

## Customer security review

Review TLS, ingress exposure, IAM scope, Kubernetes roles, secrets, database access, state storage, backups, log access and operational access before production. Security questionnaires and additional evidence requirements can be scoped through [Enterprise](/?enquiry=enterprise#demo).
