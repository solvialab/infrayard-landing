# Installation

Infrayard is deployed with the customer Helm chart into your environment. Registry access, pinned image references, customer values and the release-specific runbook are provided during evaluation or onboarding.

## Choose your deployment path

- **Existing OKE cluster:** the production deployment path for teams with an appropriate Kubernetes host, ingress and persistent storage.
- **Single-node k3s on an OCI VM:** an evaluation and demo path using the same chart with values adapted for Traefik, local storage and single-node scheduling. It is not a substitute for a production availability design.

See the [requirements comparison](/docs/requirements/#deployment-options). An OCI Marketplace deployment path is planned, rather than an installation option available from this website.

## Prepare your environment

1. Select the tenancy, region, anchor compartment and intended resource ownership boundary.
2. Establish the OCI service identity and release-specific IAM policies.
3. Prepare the OCI Object Storage state backend.
4. Confirm host capacity, ingress, persistent storage, DNS and TLS.
5. Choose the bundled Keycloak or a realm in your existing Keycloak, and agree the admin role.
6. Check runner access to OCI services and OKE API endpoints, plus the intended user access path.
7. Receive registry credentials and the pinned release, or arrange an approved mirror.

Do not copy broad tenancy permissions from an unrelated deployment. Use the scope appropriate to your [anchor compartment and network design](/docs/networking/).

## Install the supplied release

Create the image-pull secret and customer values described in the supplied runbook. Keep credentials out of shell history and source control. The following illustrates the Helm invocation once the chart and customer values are present:

```bash
helm upgrade --install infrayard ./deploy/helm/ \
  --namespace infrayard \
  --create-namespace \
  --values ./values.customer.yaml
```

The chart path and values file above refer to delivered customer assets. They are not files available from the public website repository. Use the release-specific layout and approved image references supplied to you.

OKE values use the configured ingress controller and OCI storage class. Evaluation k3s values use its ingress and local storage model. Review persistence and scheduling before applying a values file from another target.

## Verify the installation

1. Check that the deployed services and persistent volumes are healthy.
2. Verify portal and identity URLs, TLS and successful login.
3. Confirm the admin role and regular-user template visibility.
4. Validate OCI access, the state backend, enabled shapes and Kubernetes versions.
5. Create an appropriately scoped non-production cluster.
6. Inspect Terraform logs, cluster state, the cost estimate and access download.
7. Validate user connectivity and a suitable lifecycle operation.
8. Clean up the test resources and review audit history.

A successful Helm install alone does not validate your OCI policies, OKE worker network or end-user access path. Complete the workflow checks before production use.

## Evaluation readiness

Agree prerequisites and success criteria before starting an optional paid evaluation. Its 30-day window starts once the agreed environment is ready and the evaluation is activated. See [evaluation terms](/docs/subscription/#evaluation).

For errors, use [troubleshooting and support](/docs/troubleshooting/). For repeatable operating procedures, continue with [operations](/docs/operations/).
