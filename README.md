# Infrayard by Solvia Lab - OCI-native Internal Developer Platform for Oracle Kubernetes Engine

**Infrayard by Solvia Lab** is a commercial, OCI-native Internal Developer Platform (IDP) for **Oracle Kubernetes Engine (OKE)**. It helps platform engineering teams offer governed self-service Kubernetes lifecycle management inside their own Oracle Cloud tenancy.

Website: [https://www.infrayard.eu](https://www.infrayard.eu)  
Public docs: [https://www.infrayard.eu/docs/](https://www.infrayard.eu/docs/)  
Resources hub: [https://www.infrayard.eu/resources/](https://www.infrayard.eu/resources/)  
Contact: [hello@infrayard.eu](mailto:hello@infrayard.eu)

> This repository contains the public landing page, public documentation, and legal pages for Infrayard. It does **not** contain the Infrayard product source code. Infrayard is commercial software delivered through private registry access, Helm values, and customer onboarding.

## What Infrayard Is

Infrayard turns Oracle Kubernetes Engine into a governed internal platform. Engineers can deploy, scale, upgrade, access, and destroy OKE clusters through a web portal, while administrators keep control through templates, limits, approvals, audit history, cost visibility, and network ownership boundaries.

It is built for organizations that want faster OKE delivery without giving every engineer direct OCI Console access, IAM administration rights, Terraform knowledge, or local OCI CLI setup.

## Key Capabilities

- **OKE self-service provisioning** - deploy managed Kubernetes clusters on Oracle Cloud from a web portal.
- **Oracle Kubernetes Engine lifecycle management** - create, scale, upgrade, and destroy OKE clusters with live Terraform logs.
- **OCI-native platform engineering** - works with OCI IAM, OKE, VCN networking, Object Storage, and customer tenancy boundaries.
- **Terraform automation for OKE** - Terraform execution is isolated per job with state stored in OCI Object Storage.
- **Governed self-service** - admins define cluster templates, resource limits, Kubernetes versions, VM shapes, and allowed deployment options.
- **Approval workflows** - protected-cluster destroy requests and per-user limit-increase requests flow through an admin review queue, with optional info-only email pings for request submit/review events.
- **Activity history** - users receive durable Activity notifications for lifecycle events, approvals, denials, TTL warnings, and admin limit changes.
- **BYON / bring your own network** - support for existing OCI compartments, VCNs, and subnets with preflight validation while keeping customer-owned network resources read-only.
- **VPN-first Kubernetes API access** - public OKE API endpoints can be restricted to runner, VPN, and corporate CIDRs for environments avoiding DRG or LPG complexity.
- **Kubeconfig download** - kubectl-ready kubeconfig generation without requiring users to configure OCI CLI locally.
- **FinOps visibility** - live monthly/hourly cost estimates for deploy forms, cluster cards, detail views, templates, and admin panels.
- **Shape and Kubernetes compatibility checks** - OCI shape sync, OKE version sync, node-image selection, and fail-closed compatibility filtering reduce invalid cluster requests.
- **OIDC authentication** - works with Keycloak, Azure AD, Okta, Google Workspace, and OIDC-compatible identity providers.
- **Private deployment model** - runs in the customer environment through Helm, with no SaaS control plane required.

## Built For

Infrayard is designed for:

- platform engineering teams standardizing Oracle Cloud Kubernetes operations
- enterprises using Oracle Kubernetes Engine as their managed Kubernetes platform
- internal developer platform teams building self-service infrastructure portals
- organizations that need Kubernetes governance, approvals, auditability, and cost visibility
- OCI customers that want to reduce manual Terraform, ticket-based cluster delivery, and direct OCI Console usage
- regulated or security-conscious teams that prefer software running inside their own tenancy

## Common Search Terms

Infrayard is relevant to teams searching for:

- Oracle Kubernetes Engine Internal Developer Platform
- OCI-native IDP
- OKE self-service platform
- Kubernetes lifecycle management for Oracle Cloud
- Terraform automation for OKE
- Oracle Cloud Kubernetes governance
- OKE provisioning portal
- Kubernetes cost visibility on OCI
- OKE kubeconfig access management
- bring your own VCN for OKE
- BYON Oracle Cloud Kubernetes
- OKE approval workflows
- platform engineering for Oracle Cloud
- private Internal Developer Platform for Kubernetes
- self-hosted Kubernetes platform portal

## Deployment Model

Infrayard is deployed into the customer environment, typically into an existing OKE cluster or a Kubernetes host used for platform services. The public product documentation describes the deployment paths at a high level; detailed onboarding, values files, operational runbooks, and validation procedures are provided during evaluation or commercial onboarding.

Infrayard is intentionally not a SaaS control plane. OCI credentials, Terraform state, Kubernetes access, and operational control remain inside the customer's Oracle Cloud environment.

## Commercial Access

Infrayard is commercial software. Public pricing, evaluation options, and the founding customer program are described on the website:

- [Pricing](https://www.infrayard.eu/#pricing)
- [Founding Customer Program](https://www.infrayard.eu/#founding)
- [Documentation](https://www.infrayard.eu/docs/)
- [Privacy Policy](https://www.infrayard.eu/legal/privacy.html)
- [Terms and Legal Notice](https://www.infrayard.eu/legal/terms.html)
- [Cookie Policy](https://www.infrayard.eu/legal/cookies.html)

For evaluation, enterprise access, or partnership questions, contact [hello@infrayard.eu](mailto:hello@infrayard.eu).

## Roadmap Direction

Infrayard's current focus is reliable governed OKE lifecycle management, BYON validation, and production deployment into existing OKE environments.

Planned roadmap areas include an AI-assisted troubleshooting advisor, Gatekeeper policy and cost guardrails, drift detection, approval-gated remediation, and an in-cluster access agent for private-by-default environments. Roadmap items are directional and may change based on customer feedback and commercial agreements.

## Repository Scope

This public repository is intended for discoverability and transparency around the public website. It may include:

- landing page HTML/CSS/JS
- public documentation
- legal pages
- public product positioning
- public contact links

It does not include:

- backend product source code
- Terraform product modules
- Helm chart source intended for customers
- private runbooks
- internal billing or licensing notes
- customer data
- secrets or credentials

## Links

- Website: [https://www.infrayard.eu](https://www.infrayard.eu)
- Docs: [https://www.infrayard.eu/docs/](https://www.infrayard.eu/docs/)
- Email: [hello@infrayard.eu](mailto:hello@infrayard.eu)
- Company: [Solvia Lab](https://solvialab.tech)
