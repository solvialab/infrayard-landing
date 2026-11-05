# Infrayard documentation

Infrayard is a self-service portal for Oracle Kubernetes Engine (OKE). Engineers create, scale, upgrade and delete OKE clusters through a web portal. Platform administrators decide which templates, sizes and Kubernetes versions are allowed, and approve protected operations. Behind the portal, Terraform creates the resources in your own OCI tenancy.

You install Infrayard in your environment, on Kubernetes or on a single VM. Credentials, state and data stay with you.

## Find your starting point

| You want to… | Read |
| --- | --- |
| Check whether Infrayard fits your environment | [Requirements](/docs/requirements/) |
| Understand the components and data flow | [Architecture](/docs/architecture/) and [security](/docs/security/) |
| Install Infrayard | [Installation](/docs/installation/), starting with [Prepare OCI](/docs/oci-setup/) |
| Connect your company Keycloak | [Use your own Keycloak](/docs/keycloak/) |
| Keep the portal off the internet | [Private access](/docs/private-access/) |
| Reuse your VCNs, subnets and compartments | [Networking](/docs/networking/) |
| Create, access, scale or upgrade clusters | [Cluster lifecycle](/docs/cluster-lifecycle/) |
| Set up templates, limits and approvals | [Administration](/docs/administration/) |
| Upgrade, back up or restore Infrayard | [Operations](/docs/operations/) |
| Fix a problem | [Troubleshooting](/docs/troubleshooting/) |
| Compare plans | [Subscription](/docs/subscription/) |

## What Infrayard does

- **Clusters:** create, scale, upgrade and destroy OKE clusters (Basic and Enhanced), with live Terraform logs.
- **Access:** one-click kubeconfig per user, without OCI CLI setup.
- **Guardrails:** templates, per-user resource limits, protected destroy requests and limit-increase requests.
- **Visibility:** Activity inbox, audit log and cost estimates before deployment.
- **Existing infrastructure:** use your own compartments, VCNs and subnets.

Application deployment and day-to-day workload operations stay in your existing tools. See the [product scope](/docs/requirements/#product-scope).

## How to get started

1. [Request a demo](/?enquiry=demo#demo) to see a real workflow and discuss your environment.
2. Check the [requirements](/docs/requirements/).
3. Start a subscription or an evaluation, receive your registry access and [install](/docs/installation/).

The [releases and roadmap](/docs/releases/) page separates what is available today from planned work.
