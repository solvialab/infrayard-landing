# Architecture

Infrayard is installed in a customer-managed Kubernetes environment. It has no required Solvia-hosted SaaS control plane. The customer operates the installation and retains control of its OCI credentials, infrastructure state and operational records.

## Components

| Component | Responsibility |
| --- | --- |
| Web portal | Cluster requests, lifecycle actions, access downloads and administration |
| FastAPI service | Authentication validation, resource validation, configuration, requests and lifecycle coordination |
| PostgreSQL | Cluster and job records, users, configuration, templates, requests and audit history |
| Terraform runner | Isolated execution for provisioning, scale, upgrade and destroy jobs |
| OCI Object Storage | Terraform state for Infrayard-managed clusters |
| Keycloak | Login, user identity and roles; bundled with Infrayard or your existing Keycloak |
| Oracle Cloud / OKE | The actual cloud resources and managed Kubernetes service |

The portal and services are delivered as released container images with Helm deployment assets. Customers pull approved images into their own environment or use an agreed internal registry mirror.

## Request flow

1. The user signs in through Keycloak.
2. The portal displays the templates, cluster options and limits available to that user.
3. The API validates the request, compatibility and applicable configuration.
4. A Terraform job executes with the installation's OCI permissions and cluster state.
5. The portal exposes the run output and resulting cluster status. Lifecycle events are recorded for operational visibility.

Protected destroy requests and requests for higher resource limits use the admin review workflow. This is not a general approval gate on every cluster creation or lifecycle action.

## State and ownership

PostgreSQL stores platform metadata. Terraform state is stored in OCI Object Storage. Both are part of your operating and recovery responsibilities; backing up only the portal does not preserve the full platform state.

Resources created by Infrayard are managed by their cluster's Terraform state. Manual edits to those managed resources can be overwritten by a subsequent apply. Supplied existing network resources are referenced according to the [BYON ownership rules](/docs/networking/#bringing-your-own-network).

## Connectivity and external dependencies

The installation must reach the required OCI APIs, Keycloak and OKE API endpoints. Initial image delivery also requires registry access, or an agreed mirror. Optional SMTP notifications use your configured email service.

Running the control plane in your tenancy does not remove these dependencies or automatically provide a disconnected deployment. Review the required routes and any delivery constraints during onboarding.

## Operating responsibility

Your team operates the customer installation, its database, secrets, storage, network and workloads. Oracle provides the contracted OCI and OKE services. Solvia Lab supplies the Infrayard release, documentation and support defined in your agreement. Deployment assistance and additional operational support can be scoped in Enterprise.

Continue with [security and access](/docs/security/), [networking](/docs/networking/) and [operations](/docs/operations/).
