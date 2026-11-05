# Requirements and compatibility

Use this page to assess deployment fit before committing to an installation. Exact versions, image references and customer-specific values are confirmed against the release supplied during onboarding.

## Deployment options

| Requirement | Existing OKE cluster | Single-node k3s on OCI VM |
| --- | --- | --- |
| Intended use | Production customer installations | Evaluation, development and demos |
| Deployment | Customer Helm chart and OKE values | The same chart with k3s values |
| Ingress | ingress-nginx with an OCI Load Balancer, configured separately | Traefik, supplied by k3s |
| Storage | OCI Block Volume storage class (`oci-bv`) | Local-path storage |
| Identity | Bundled Keycloak or your existing Keycloak | Bundled Keycloak or your existing Keycloak |
| Scheduling | Dedicated worker nodes | Single-node scheduling settings in the supplied values |

An existing supported Kubernetes host can run the platform; this does not imply that every Kubernetes distribution or version has been validated. Confirm the intended distribution and release during onboarding.

## Before installation

- An OCI tenancy, target region and selected anchor compartment.
- A service identity with permissions for the resource families Infrayard will manage.
- OCI Object Storage configuration for Terraform state.
- A Kubernetes host with appropriate ingress, persistent storage and capacity for the platform services.
- DNS and TLS arrangements for the portal and identity endpoints.
- Network reachability from the runner and authorised users to the OKE API endpoints they will use.
- An approved image delivery path and the release-specific Helm assets.
- Bundled Keycloak, or a realm in your existing Keycloak, and the admin role assignment.

The installation includes PostgreSQL and identity services when configured in the supplied chart. Budget for these services, their persistent storage, any load balancer and your OKE resources. The software subscription does not pay your Oracle Cloud bill.

## OKE versions, shapes and images

Compatibility is region- and tenancy-specific. Administrators sync OCI shapes and Kubernetes versions, then enable the choices available to users. Newly synced Kubernetes versions are disabled until an administrator enables them.

The deploy and template forms filter Kubernetes versions by the selected shape and available OKE node images. If compatibility validation is unavailable, deployment is blocked rather than allowing an unverified combination. See [troubleshooting](/docs/troubleshooting/#missing-versions-or-shapes).

## Basic and Enhanced clusters

The platform can allow Basic, Enhanced or both OKE tiers. These are Oracle service tiers, separate from Infrayard subscription plans.

| Operation | Basic | Enhanced |
| --- | --- | --- |
| Add or remove nodes and pools | Supported automatically | Supported automatically |
| Change per-node shape, OCPU, RAM or storage | Requires rolling worker cycling | Automated supported rollout |
| Kubernetes upgrade | Control-plane and target updates, followed by rolling worker refresh | Automated supported control-plane and worker rollout |
| OCI control-plane charges | Follow Oracle's Basic pricing | Follow Oracle's Enhanced pricing |

Check [cluster lifecycle](/docs/cluster-lifecycle/#cluster-tiers) for operational steps and workload considerations.

## Product scope

Current scope is OKE infrastructure provisioning and lifecycle management through Infrayard workflows. The product includes templates, limits, protected requests, cost estimates, identity integration, audit records and supported existing-network configurations.

- Application deployment, CI/CD, databases used by your applications and application availability remain within your existing delivery and operating processes.
- Using an existing OKE cluster to **host Infrayard** is different from importing that cluster into Infrayard's Terraform management. Do not assume arbitrary existing clusters can be adopted; agree the supported lifecycle scope during evaluation.
- One installation's compartment access follows its anchor and OCI IAM scope. Unrelated compartment subtrees need an appropriate root anchor or separate installations.
- Existing subnets require an existing VCN reference and prepared routing. Some restricted public endpoint combinations require Infrayard-managed networking.
- AI assistance, the access agent and non-OCI management are roadmap items unless explicitly delivered in your contracted release.
- Hosting in your tenancy does not itself certify compliance, provide application high availability or create an air-gapped environment.

See [networking](/docs/networking/) for supported combinations and [releases and roadmap](/docs/releases/) for future work.
