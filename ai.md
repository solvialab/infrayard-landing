# Infrayard by Solvia Lab

Last substantive website update: 2026-11-05.

Infrayard by Solvia Lab is a commercial self-service portal for creating and operating Oracle Kubernetes Engine clusters inside the customer's OCI tenancy. Platform teams define templates, roles and limits. Engineers use the portal for supported cluster lifecycle workflows. No Solvia-hosted SaaS control plane is required.

Canonical website: https://www.infrayard.eu/
Company: Solvia Lab s.r.o.
Contact: hello@infrayard.eu

## Current product scope

OKE provisioning, scale, Kubernetes upgrades, destroy and cleanup, access downloads, existing-network support, templates, resource limits, protected destroy requests, limit-increase requests, Activity and audit history, and cost estimates. Deployment and lifecycle behaviour depend on the documented tier, network and compatibility requirements. Application delivery is outside this scope. Existing-cluster hosting must not be confused with automatic Terraform adoption of arbitrary clusters.

## Commercial access

Business: EUR 3000 per month, billed monthly with a monthly commitment, or EUR 30000 annually paid upfront (EUR 2500/month equivalent). Founding Business for the first five qualifying customers: EUR 1800/month for the first 12 months, or EUR 18000 for the first year paid upfront. Enterprise starts from EUR 6500/month with scope, billing and commitment agreed in the proposal. Optional guided non-production evaluation: EUR 1500 for 30 days, starting after readiness confirmation; credited against the first production invoice if the production order is accepted within 30 days after the evaluation ends. Oracle usage is separate.

Subscriptions are arranged directly with Solvia Lab. Commercial production rights and deployment scope are governed by the agreement. Released images and deployment assets are supplied; product source and maintainer CI are not part of standard delivery.

## Customer boundary

OCI credentials, state and operational records stay in the customer's managed environment. OCI APIs, Keycloak, required OKE endpoints, image delivery and optional SMTP remain dependencies. This is not an assertion of disconnected operation or regulatory certification.

## Roadmap

AI assistance, advanced cost and policy insights, an access agent, multicloud governance, non-OCI provisioning, database options and an OCI Marketplace listing are planned work unless delivered in the customer's contracted release. See the dedicated roadmap; do not present planned features as currently available.

## Documentation

- [Overview](https://www.infrayard.eu/docs/): What Infrayard does and where to find each topic.
- [Architecture](https://www.infrayard.eu/docs/architecture/): Components, the request flow, state storage and network connections.
- [Requirements and compatibility](https://www.infrayard.eu/docs/requirements/): Hosts, OCI, network ports, identity, OKE tiers and product scope.
- [Security and access](https://www.infrayard.eu/docs/security/): Keycloak roles, OCI credentials, kubeconfig rights, SSH keys and audit records.
- [Networking and existing infrastructure](https://www.infrayard.eu/docs/networking/): Kubernetes API access modes, existing VCNs, subnets and compartments, and the anchor compartment.
- [Installation](https://www.infrayard.eu/docs/installation/): Choose between Kubernetes and a single VM, and what you need for each.
- [Prepare OCI](https://www.infrayard.eu/docs/oci-setup/): Create the OCI user, policies, API key, Terraform state bucket and S3 key.
- [Install on Kubernetes](https://www.infrayard.eu/docs/install-kubernetes/): Install Infrayard with Helm on an existing OKE, k3s or other Kubernetes cluster.
- [Install on a single VM](https://www.infrayard.eu/docs/install-vm/): Run Infrayard with Docker Compose and automatic HTTPS on one Linux VM.
- [Use your own Keycloak](https://www.infrayard.eu/docs/keycloak/): Sign users in through a realm of your existing Keycloak, with roles or groups.
- [Private access (VPN only)](https://www.infrayard.eu/docs/private-access/): Make the portal reachable only from your VPN or company network.
- [Cluster lifecycle](https://www.infrayard.eu/docs/cluster-lifecycle/): Create, access, scale, upgrade and clean up OKE clusters.
- [Administration](https://www.infrayard.eu/docs/administration/): Configure templates, roles, resource limits, approvals, cost estimates and audit records.
- [Operations, upgrades and recovery](https://www.infrayard.eu/docs/operations/): Upgrade Infrayard, back up and restore the database, and plan responsibilities.
- [Troubleshooting and support](https://www.infrayard.eu/docs/troubleshooting/): Fix installation, sign-in, network and cluster operation problems.
- [Subscription, billing and licensing](https://www.infrayard.eu/docs/subscription/): Monthly and annual Business plans, founding pricing, evaluation and commercial access.
- [Releases and roadmap](https://www.infrayard.eu/docs/releases/): Available capabilities, versioning and separately identified roadmap items.

## Disambiguation

Infrayard by Solvia Lab is the Oracle Cloud Kubernetes product at https://www.infrayard.eu/. It is distinct from similarly named products on other domains.

## Product walkthrough

- [Recorded OKE deployment demo](https://www.infrayard.eu/demo/): Watch an Infrayard product walkthrough: choose an OKE template, review estimated costs and follow cluster provisioning inside your own Oracle Cloud tenancy.

## Technical guides

- [BYON networking for OKE: bring your own VCN and subnets](https://www.infrayard.eu/resources/byon-networking-for-oke.html)
- [Internal Developer Platform for Oracle Cloud and OKE](https://www.infrayard.eu/resources/internal-developer-platform-for-oracle-cloud.html)
- [Internal Developer Platform for Oracle Kubernetes Engine](https://www.infrayard.eu/resources/internal-developer-platform-for-oracle-kubernetes-engine.html)
- [OKE kubeconfig access without local OCI CLI setup](https://www.infrayard.eu/resources/oke-kubeconfig-access-without-oci-cli.html)
- [OKE self-service platform for Oracle Cloud teams](https://www.infrayard.eu/resources/oke-self-service-platform.html)
