# Installation

Infrayard runs on a Kubernetes cluster in your environment: an OKE cluster for production, or k3s on a single VM for an evaluation. Both use the same Helm chart, images and values. Installation takes about an hour, including the OCI preparation.

## Choose your deployment path

| | Existing OKE cluster | Other Kubernetes (k3s, …) |
| --- | --- | --- |
| Good for | Production | Evaluation on a single VM, or production |
| Installed with | Helm chart | Helm chart |
| Ingress and TLS | Your ingress controller (e.g. Traefik) and cert-manager | Same; k3s ships Traefik |
| Database storage | OCI Block Volume (`oci-bv`), 50 GB | Your StorageClass (k3s: `local-path`) |
| Keycloak | Bundled or your own | Bundled or your own |
| Guide | [Install on Kubernetes](/docs/install-kubernetes/) | [Install on Kubernetes](/docs/install-kubernetes/) |

**For an evaluation**, one VM with k3s is enough: install k3s with its [quick start](https://docs.k3s.io/quick-start), then follow the Kubernetes guide. We recommend 2 OCPUs and 8 GB memory. Measured on our k3s demo VM at rest, the whole VM (Oracle Linux, k3s, Traefik, cert-manager and Infrayard) uses about 3.5 GB, of which Infrayard about 0.9 GB. The images run on x86 and Arm (Ampere A1) shapes.

Both paths run one replica of each service, and Kubernetes restarts a service that fails. Neither is a high-availability setup for the portal itself. Your OKE clusters keep running if Infrayard is down.

## Steps

1. **[Prepare OCI](/docs/oci-setup/)**: the service user, policies, API key, state bucket and S3 key. Needed for every path.
2. **Install** with [the Kubernetes guide](/docs/install-kubernetes/).
3. **Optional:** connect [your own Keycloak](/docs/keycloak/).
4. **Recommended:** make the portal reachable [only from your VPN](/docs/private-access/).
5. **Verify** with a test cluster, as described at the end of the guide.
6. Plan [upgrades and backups](/docs/operations/).

## What you receive

With your subscription or evaluation you get by e-mail:

- **Registry access**: a user name and token for the private registry that holds the Helm chart and the images.
- **Addresses** of the chart (`oci://…/charts/infrayard`) and the images (`…/api`, `…/frontend`).
- **The version** to install, for example `1.4.0`. Chart and images share it.

Nothing is downloaded from a public website; everything comes from this registry.

The token is personal to your organisation. Store it in your secret manager and request a new one from [support](mailto:support@infrayard.eu) if it leaks.

## What you prepare

| Item | Example |
| --- | --- |
| OCI tenancy, region and anchor compartment | `eu-frankfurt-1`, compartment `infrayard` |
| OCI service user with policies, API key and S3 key | See [Prepare OCI](/docs/oci-setup/) |
| A DNS name for the portal | `infrayard.example.com` |
| A way to get a TLS certificate | Let's Encrypt (automatic) or your company CA |
| A host | A Kubernetes cluster with about 1 CPU and 2 GiB free, or a VM with 2 OCPUs and 8 GB memory for k3s |
| Network paths | Users → portal (443); Infrayard → OCI APIs, registry, cluster APIs (6443) |

Details for each item are in [requirements](/docs/requirements/).

For errors during installation, see [troubleshooting](/docs/troubleshooting/#installation).
