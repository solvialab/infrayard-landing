# Requirements and compatibility

Use this page to check whether Infrayard fits your environment before you install it.

## Deployment options

| | Existing OKE cluster | Other Kubernetes (k3s, …) |
| --- | --- | --- |
| Intended use | Production | Evaluation on a single VM, or production |
| Tooling | `kubectl`, Helm 3.8+ | `kubectl`, Helm 3.8+ |
| Ingress | An ingress controller you install, e.g. Traefik with an OCI load balancer | Your ingress controller; k3s ships Traefik |
| TLS | cert-manager or your own certificate | cert-manager or your own certificate |
| Storage | 50 GB block volume, `oci-bv` (the OCI minimum; the chart requests 10 GiB) | 10 GiB volume from your StorageClass |
| Capacity | About 1 CPU and 2 GiB free (requests 0.9 CPU and 1.6 GiB, limits 3.7 CPU and 3.2 GiB) | Same; a k3s VM: 2 OCPUs and 8 GB memory |
| Keycloak | Bundled or your own | Bundled or your own |

At rest Infrayard uses about 0.9 GB memory and almost no CPU; Keycloak takes most of it. On a k3s VM, k3s with Traefik and cert-manager adds about 1.8 GB. Terraform jobs run inside the API, whose limit is 1 GiB.

Infrayard is tested on OKE 1.36 and k3s 1.36, both with Traefik and cert-manager. The images are built for x86 (`amd64`) and Arm (`arm64`).

## Compare deployment models

When evaluating a platform for sensitive infrastructure, check who runs the control plane, where it stores operational records and how much of the OKE workflow your team needs to assemble.

- **Infrayard** is a commercial subscription for a ready-to-install OKE portal. Your team runs the portal and API on its own Kubernetes cluster, stores operational records in its PostgreSQL database and keeps Terraform state in its OCI Object Storage. The chart includes OKE provisioning and lifecycle workflows. [Infrayard architecture](/docs/architecture/)
- **Quali Torque** orchestrates infrastructure environments from blueprints. Its SaaS model uses an agent that connects the customer's infrastructure to Torque SaaS. Quali also describes a self-hosted control plane for sovereign environments. [Torque Agent](https://docs.qtorque.io/torque-agent/Torque-Agent-Intro) · [Quali's self-hosted control plane](https://www.quali.com/resource/qualis-torque-platform-delivers-the-operational-foundation-enterprises-need-to-achieve-sovereign-ai/)
- **Rafay** offers a Rafay-managed SaaS controller and a self-hosted controller that customers can install on Kubernetes. Review the requirements for the controller model you plan to run. [Rafay SaaS controller](https://docs.rafay.co/security/whitelist/) · [Rafay self-hosted controller](https://docs.rafay.co/selfhosted/installation_helm/)
- **Backstage** is a framework for building and deploying an internal developer portal. Its Kubernetes plugin gives service owners visibility into running workloads. Teams choose the integrations and workflows that go into their portal. [Backstage production deployment](https://backstage.io/docs/next/golden-path/deployment/) · [Backstage Kubernetes plugin](https://backstage.io/docs/next/features/kubernetes/)

## OCI

- A tenancy and a region where you create OKE clusters.
- An **anchor compartment** under which Infrayard creates clusters. See [choosing the anchor](/docs/networking/#choosing-the-anchor-compartment).
- An OCI user with the [Infrayard policies](/docs/oci-setup/#3-add-the-policies), an API key and a customer secret key.
- An Object Storage bucket for Terraform state, one per Infrayard installation.
- Service limits and quotas for the clusters you plan: OKE clusters, compute cores of the worker shapes, VCNs and load balancers.

## Network

| Direction | From → to | Port |
| --- | --- | --- |
| Inbound | Users → portal | 443, and 80 for redirects and Let's Encrypt |
| Outbound | Infrayard → OCI APIs and Object Storage (`*.oraclecloud.com`) | 443 |
| Outbound | Infrayard → image registry | 443 |
| Outbound | Infrayard → Terraform providers: `registry.terraform.io`, `releases.hashicorp.com`, GitHub releases | 443 |
| Outbound | Infrayard → Kubernetes API of each managed cluster | 6443 |
| Outbound | Users → Kubernetes API of their clusters, for `kubectl` | 6443 |
| Outbound, optional | Infrayard → your SMTP server | 587 or your port |
| Outbound, optional | Infrayard → your own Keycloak | 443 |

The portal needs no inbound connection from the internet if users come through a VPN; see [private access](/docs/private-access/).

## Identity

Sign-in uses Keycloak: either the Keycloak bundled with Infrayard (realm, client and admin role are created automatically) or a realm in your existing Keycloak 22 or newer. See [Use your own Keycloak](/docs/keycloak/).

## Costs outside the subscription

The subscription covers the Infrayard software. Your Oracle Cloud bill covers the OKE clusters and their nodes, load balancers and storage, and the host that runs Infrayard: capacity and one block volume in your cluster (50 GB on OKE, the OCI minimum) plus a load balancer for the ingress, or the VM for k3s.

## OKE versions, shapes and images

Which Kubernetes versions, shapes and node images exist depends on your region and tenancy. Administrators sync them from OCI in **Admin → Configuration** and enable what users may choose. Newly synced Kubernetes versions stay disabled until an administrator enables them.

The deploy and template forms only offer Kubernetes versions that have a node image for the selected shape. If Infrayard cannot check this with OCI, deployment is blocked rather than allowing an unverified combination. See [troubleshooting](/docs/troubleshooting/#missing-versions-or-shapes).

## Basic and Enhanced clusters

The platform can allow Basic, Enhanced or both OKE cluster types. These are Oracle service tiers, separate from Infrayard subscription plans.

| Operation | Basic | Enhanced |
| --- | --- | --- |
| Add or remove nodes and pools | Automatic | Automatic |
| Change a pool's shape, OCPUs, memory or storage | Needs rolling worker cycling | Automatic rollout |
| Kubernetes upgrade | Control plane first, then a rolling worker refresh | Automatic control plane and worker rollout |
| OCI control-plane charges | Oracle's Basic pricing | Oracle's Enhanced pricing |

See [cluster lifecycle](/docs/cluster-lifecycle/#cluster-tiers) for the steps.

## Product scope

Infrayard provisions and manages OKE clusters: create, access, scale, upgrade and destroy, with templates, limits, requests, cost estimates, audit records and existing-network support.

- Deploying applications, CI/CD and application databases stay in your existing tools.
- Running Infrayard **on** an existing OKE cluster is different from **managing** that cluster with Infrayard. Infrayard manages only clusters it created; existing clusters are not imported.
- One installation manages one anchor compartment tree. Unrelated trees need the tenancy root as anchor or separate installations.
- Existing subnets need their VCN as well, and prepared routing. The public API endpoint mode needs Infrayard-managed networking.
- AI assistance, an access agent and non-OCI clouds are on the [roadmap](/docs/releases/#planned-work), not in the product today.
- Running in your tenancy does not by itself make the setup compliant, highly available or air-gapped.
