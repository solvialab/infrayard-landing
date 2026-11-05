# Installation

Infrayard runs in your environment: on a Kubernetes cluster you already operate, or on a single VM. Both paths use the same images and give the same portal. Installation takes about an hour, including the OCI preparation.

## Choose your deployment path

| | Existing OKE cluster | Other Kubernetes (k3s, …) | Single VM |
| --- | --- | --- | --- |
| Good for | Production | Production or evaluation | Evaluation, demos, small teams |
| Installed with | Helm chart | Helm chart | Docker Compose |
| Ingress and TLS | Your ingress controller (e.g. Traefik) and cert-manager | Same; k3s ships Traefik | Caddy with automatic Let's Encrypt, included |
| Database storage | OCI Block Volume (`oci-bv`), 50 GB | Your StorageClass (k3s: `local-path`) | Docker volume on the VM |
| Keycloak | Bundled or your own | Bundled or your own | Bundled |
| Guide | [Install on Kubernetes](/docs/install-kubernetes/) | [Install on Kubernetes](/docs/install-kubernetes/) | [Install on a single VM](/docs/install-vm/) |

All paths run one replica of each service. The Kubernetes paths add automatic restarts across nodes and managed volumes; none of them is a high-availability setup for the portal itself. Your OKE clusters keep running if Infrayard is down.

## Steps

1. **[Prepare OCI](/docs/oci-setup/)**: the service user, policies, API key, state bucket and S3 key. Needed for every path.
2. **Install** with the guide for your path.
3. **Optional:** connect [your own Keycloak](/docs/keycloak/) (Kubernetes paths).
4. **Recommended:** make the portal reachable [only from your VPN](/docs/private-access/).
5. **Verify** with a test cluster, as described at the end of each guide.
6. Plan [upgrades and backups](/docs/operations/).

## What you receive

With your subscription or evaluation you get by e-mail:

- **Registry access**: a user name and token for the private registry that holds the Helm chart and the images.
- **Addresses** of the chart (`oci://…/charts/infrayard`), the images (`…/api`, `…/frontend`) and the Compose bundle (`…/compose`).
- **The version** to install, for example `1.4.0`. Chart, images and bundle share it.

Nothing is downloaded from a public website; everything comes from this registry.

The token is personal to your organisation. Store it in your secret manager and request a new one from [support](mailto:support@infrayard.eu) if it leaks.

## What you prepare

| Item | Example |
| --- | --- |
| OCI tenancy, region and anchor compartment | `eu-frankfurt-1`, compartment `infrayard` |
| OCI service user with policies, API key and S3 key | See [Prepare OCI](/docs/oci-setup/) |
| A DNS name for the portal | `infrayard.example.com` |
| A way to get a TLS certificate | Let's Encrypt (automatic) or your company CA |
| A host | A Kubernetes cluster with about 1 CPU and 2 GiB free, or a VM with 2 CPUs and 4–8 GB memory |
| Network paths | Users → portal (443); Infrayard → OCI APIs, registry, cluster APIs (6443) |

Details for each item are in [requirements](/docs/requirements/).

For errors during installation, see [troubleshooting](/docs/troubleshooting/#installation).
