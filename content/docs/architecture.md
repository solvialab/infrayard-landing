# Architecture

Infrayard runs in an environment you control: an OKE cluster, or k3s on a single VM. There is no Solvia Lab cloud service in between. Infrayard works in your OCI tenancy with its own OCI user and keeps its data in your database and your Object Storage bucket.

## Components

| Component | What it does | Runs as |
| --- | --- | --- |
| Portal | Web interface: clusters, requests, access downloads, administration | `infrayard-frontend` (nginx) |
| API | Checks tokens and requests, stores data, starts and tracks Terraform jobs | `infrayard-api` |
| Terraform runner | Runs provisioning, scale, upgrade and destroy jobs | Inside `infrayard-api` |
| PostgreSQL | Clusters, jobs, users, configuration, templates, requests, audit log | `infrayard-postgresql`, or your external PostgreSQL |
| Keycloak | Sign-in, users and roles | `infrayard-keycloak`, or your existing Keycloak |
| Object Storage bucket | Terraform state of every managed cluster | In your OCI tenancy |
| OCI and OKE | The cloud resources themselves | Your OCI tenancy |

The Helm chart installs these services. An ingress controller in your cluster, such as Traefik, terminates HTTPS in front of the portal.

The portal and the bundled Keycloak share one address: the portal at `https://infrayard.example.com`, Keycloak at `https://infrayard.example.com/auth`. The portal forwards `/api` to the API and `/auth` to Keycloak; the Keycloak admin console is not reachable this way.

## What happens when a user creates a cluster

1. The user signs in through Keycloak and receives a token.
2. The portal shows the templates, options and limits that apply to this user.
3. The API checks the request: limits, template, compatibility of version, shape and image, and network settings.
4. The API starts a Terraform job with the Infrayard OCI user. Terraform stores the cluster's state in the bucket.
5. The portal streams the Terraform log. When the job ends, the cluster status, Activity entry and audit record are updated.
6. For a running cluster, the API creates a per-user ServiceAccount in the cluster and issues the kubeconfig.

Destroy requests and requests for higher limits go through the administrator review. Other operations run immediately within the user's limits.

## State and ownership

PostgreSQL holds the platform data; the bucket holds the Terraform state. Back up both and keep them consistent; see [operations](/docs/operations/).

Resources created by Infrayard are managed by their cluster's Terraform state, and manual changes are overwritten by the next run. Existing networks you supply are only referenced; see [networking](/docs/networking/#who-owns-what).

## Connections

| From | To | Why |
| --- | --- | --- |
| Users | Portal (443) | Use Infrayard and sign in |
| API | OCI APIs and Object Storage (443) | Create and inspect resources, Terraform state |
| API | Kubernetes API of managed clusters (6443) | Issue kubeconfigs |
| API | Keycloak | Fetch the realm's signing keys |
| Host | Image registry (443) | Pull the Infrayard images |
| API, optional | SMTP server | E-mail notifications |

The installation needs no inbound connection from the internet when users come through a VPN. See [private access](/docs/private-access/).

## Operating responsibility

You operate the installation, its database, secrets, storage and network, and the workloads on your clusters. Oracle provides OCI and OKE. Solvia Lab provides the Infrayard releases, documentation and the support defined in your agreement.
