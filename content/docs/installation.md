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

## What you receive

When your order is accepted and the first invoice is paid, or when your evaluation starts, your technical contact receives an onboarding e-mail with:

| Item | Value |
| --- | --- |
| Registry user and token | Personal to your organisation; the token can only pull |
| Registry | `registry.gitlab.com` |
| Helm chart | `oci://registry.gitlab.com/solvialab/infrayard/charts/infrayard` |
| Images | `registry.gitlab.com/solvialab/infrayard/api` and `registry.gitlab.com/solvialab/infrayard/frontend` |
| Version to install | A number such as `1.4.0`; chart and images share it |
| Support | [support@infrayard.eu](mailto:support@infrayard.eu) |

The guides on this site are written so that your team can install Infrayard with these values on its own. Nothing is downloaded from a public website: the chart and the images come only from this registry.

The token reads the registry and nothing else, for the term of your subscription or evaluation. Store it in your secret manager and ask [support](mailto:support@infrayard.eu) for a new one if it leaks.

## From the e-mail to the first cluster

1. **[Prepare OCI](/docs/oci-setup/)**, about 20 minutes: the service user, policies, API key, state bucket and S3 key. Needed for every path.
2. **Prepare the host:** an OKE cluster you already run, or a VM with k3s from the [k3s quick start](https://docs.k3s.io/quick-start).
3. **[Install with Helm](/docs/install-kubernetes/)**, about 30 minutes, including DNS and the certificate.
4. **Configure and test:** sign in, set up **Admin → Configuration** and create a test cluster, as in [step 7 of the guide](/docs/install-kubernetes/#7-sign-in). The test cluster proves the OCI policies, the state bucket and the network path to the cluster API.
5. **Give people access:** [add users](/docs/install-kubernetes/#add-users) in the bundled Keycloak, or connect [your own Keycloak](/docs/keycloak/).
6. **Recommended:** make the portal reachable [only from your VPN](/docs/private-access/).
7. **Before production use:** schedule the daily [database backup](/docs/operations/#backups) and read how to [upgrade](/docs/operations/#upgrade-infrayard).

If a step fails, look it up in [troubleshooting](/docs/troubleshooting/#installation). If that does not help, write to [support](/docs/troubleshooting/#contact-support) with the details listed there.

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
