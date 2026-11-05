# Releases and roadmap

Choose Infrayard based on capabilities available in the release delivered to your organisation. Planned work is described separately below and is not a delivery commitment unless included in a written agreement.

## Available capabilities

- Create, scale, upgrade, access and destroy OKE clusters through the portal.
- Inspect Terraform execution logs and lifecycle status.
- Publish cluster templates and control role visibility.
- Configure global limits, per-user overrides and limit-increase requests.
- Protect cluster destruction with an admin review workflow.
- Use supported existing OCI compartments, VCNs and subnets.
- Download Kubernetes access files without requiring local OCI CLI setup in the default access workflow.
- Review cost estimates, Activity notifications and audit history.
- Sync available shapes and Kubernetes versions with compatibility filtering.
- Sign in through the bundled Keycloak or your existing Keycloak.
- Install with Helm on Kubernetes: OKE, k3s and other distributions.

Operational behaviour depends on cluster tier and network design; see [requirements](/docs/requirements/) and [cluster lifecycle](/docs/cluster-lifecycle/).

## Versioned delivery

Each release has a version number such as `1.4.0`. The Helm chart and the images of a release share that version and are published together in the private registry you receive access to; chart `1.4.0` runs images `1.4.0`.

Release notes list changes and any required upgrade steps. Follow [Upgrade Infrayard](/docs/operations/#upgrade-infrayard) and run `helm list -n infrayard` to see which version you run. Source code and build pipelines are not needed to install or operate Infrayard.

## Planned work

| Area | Direction |
| --- | --- |
| Gatekeeper AI | Optional assistance for cluster requests and Terraform failures, plus cost and policy insights; customer-controlled provider configuration |
| Cost and policy insights | Idle-cluster signals, anomaly alerts, right-sizing suggestions, drift and lifecycle risk visibility |
| Oracle database options | Optional Oracle-native database deployment backend alongside the existing PostgreSQL approach |
| In-cluster access agent | A future connectivity option for environments that cannot expose even a CIDR-restricted OKE API endpoint |
| Multicloud governance | Read-only inventory and governance for observed EKS, AKS and GKE clusters before lifecycle ownership |
| Non-OCI provisioning | Provider-specific lifecycle automation selected according to customer demand |
| OCI Marketplace | A future listing and guided deployment path |

These items can change in scope and order. Observing an external cluster does not imply Terraform state import or resource adoption. AI, multicloud and Marketplace capabilities are not included as available features solely because they appear here.

## Request release information

For the current supported release, compatibility notes or upgrade guidance for your installation, contact [support@infrayard.eu](mailto:support@infrayard.eu). For product fit and upcoming requirements, [request a demo](/?enquiry=demo#demo).
