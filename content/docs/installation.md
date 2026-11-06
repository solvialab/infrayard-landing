# Installation

Infrayard runs on Kubernetes in your environment. Use an existing OKE cluster for production or k3s on a single VM for an evaluation. Both use the same Helm chart, images and values.

## Time to first sign-in

Once you have registry access and OCI permissions, use these estimates to plan for OCI preparation and portal setup through first sign-in. Provisioning a new OKE cluster through the portal is a separate step.

- **Existing OKE cluster · 45–90 minutes.** For an engineer familiar with OCI and Helm deploying to an OKE cluster that is already running.
- **New k3s VM · 2–4 hours.** For a first-time evaluation that includes preparing OCI networking and a single VM with k3s.

## Choose your deployment path

| | Existing OKE cluster | Other Kubernetes (k3s, …) |
| --- | --- | --- |
| Good for | Production | Evaluation on a single VM, or production |
| Installed with | Helm chart | Helm chart |
| Ingress and TLS | Your ingress controller (e.g. Traefik) and cert-manager | Same; k3s ships Traefik |
| Database storage | OCI Block Volume (`oci-bv`), 50 GB | Your StorageClass (k3s: `local-path`) |
| Keycloak | Bundled or your own | Bundled or your own |
| Guide | [Install on Kubernetes](/docs/install-kubernetes/) | [Install on Kubernetes](/docs/install-kubernetes/) |

**For an evaluation**, one VM with k3s is enough. We recommend 2 OCPUs and 8 GB RAM. At idle, the full stack used about 2.7 GiB on the Arm test VM and about 3.5 GB on an earlier demo VM. The four Infrayard pods on the Arm VM used about 0.85 GiB. The images run on x86 and Arm shapes. [Prepare a k3s VM](#prepare-a-k3s-vm)

Both paths run one replica of each service, and Kubernetes restarts a service that fails. Neither is a high-availability setup for the portal itself. Your OKE clusters keep running if Infrayard is down.

## What you receive

When your order is accepted and the first invoice is paid, or when your evaluation starts, your technical contact receives an onboarding e-mail with:

| Item | Value |
| --- | --- |
| Registry user and token | Personal to your organisation; the token can only pull |
| Registry | `registry.gitlab.com` |
| Helm chart | `oci://registry.gitlab.com/solvialab/infrayard/charts/infrayard` |
| Images | `registry.gitlab.com/solvialab/infrayard/api` and `registry.gitlab.com/solvialab/infrayard/frontend` |
| Version to install | A number such as `1.0.1`; chart and images share it |
| Support | [support@infrayard.eu](mailto:support@infrayard.eu) |

The guides on this site are written so that your team can install Infrayard with these values on its own. Nothing is downloaded from a public website: the chart and the images come only from this registry.

The token reads the registry and nothing else, for the term of your subscription or evaluation. Store it in your secret manager and ask [support](mailto:support@infrayard.eu) for a new one if it leaks.

## From the e-mail to the first cluster

1. **[Prepare OCI](/docs/oci-setup/)**, about 20 minutes: the service user, policies, API key, state bucket and S3 key. Needed for every path.
2. **Prepare the host.** Use an existing OKE cluster or [prepare a k3s VM](#prepare-a-k3s-vm).
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

## Prepare a k3s VM

This evaluation setup uses one public Oracle Linux 9 VM with 2 OCPUs and 8 GB RAM. The steps below were tested on Ampere Arm (`VM.Standard.A1.Flex`) with the bundled k3s Traefik. Use the tenancy and anchor compartment from the OCI setup and an OCI CLI profile with permission to create Compute and network resources. [Prepare OCI](/docs/oci-setup/)

### Create the VM and its network in OCI

Run these commands in Bash with the OCI CLI and `jq`. Set `T` and `C` to your tenancy and compartment OCIDs, and replace the example SSH source with the public IPv4 address of your workstation or VPN.

```bash
export OCI_CLI_REGION=eu-frankfurt-1
T=ocid1.tenancy.oc1..aaaa...
C=ocid1.compartment.oc1..aaaa...
SSH_CIDR=203.0.113.10/32
NAME=infrayard-k3s

umask 077
mkdir -m 700 infrayard-host
cd infrayard-host
ssh-keygen -t ed25519 -f ssh_ed25519

VCN=$(oci network vcn create -c "$C" --display-name "$NAME-vcn" \
  --cidr-block 10.180.0.0/16 --wait-for-state AVAILABLE --query data.id --raw-output)
IGW=$(oci network internet-gateway create -c "$C" --vcn-id "$VCN" \
  --display-name "$NAME-igw" --is-enabled true \
  --wait-for-state AVAILABLE --query data.id --raw-output)
ROUTES=$(jq -nc --arg gateway "$IGW" \
  '[{destination:"0.0.0.0/0",destinationType:"CIDR_BLOCK",networkEntityId:$gateway}]')
RT=$(oci network route-table create -c "$C" --vcn-id "$VCN" \
  --display-name "$NAME-rt" --route-rules "$ROUTES" \
  --wait-for-state AVAILABLE --query data.id --raw-output)
INGRESS=$(jq -nc --arg ssh "$SSH_CIDR" '[
  {source:$ssh,protocol:"6",tcpOptions:{destinationPortRange:{min:22,max:22}}},
  {source:"0.0.0.0/0",protocol:"6",tcpOptions:{destinationPortRange:{min:80,max:80}}},
  {source:"0.0.0.0/0",protocol:"6",tcpOptions:{destinationPortRange:{min:443,max:443}}}
]')
SL=$(oci network security-list create -c "$C" --vcn-id "$VCN" \
  --display-name "$NAME-sl" --ingress-security-rules "$INGRESS" \
  --egress-security-rules '[{"destination":"0.0.0.0/0","protocol":"all"}]' \
  --wait-for-state AVAILABLE --query data.id --raw-output)
SUBNET=$(oci network subnet create -c "$C" --vcn-id "$VCN" \
  --display-name "$NAME-subnet" --cidr-block 10.180.1.0/24 \
  --route-table-id "$RT" --security-list-ids "$(jq -nc --arg sl "$SL" '[$sl]')" \
  --prohibit-public-ip-on-vnic false --wait-for-state AVAILABLE --query data.id --raw-output)

oci iam availability-domain list -c "$T" --query 'data[].name'
```

Choose an availability domain from that list. If OCI reports `Out of host capacity`, try another domain with the same subnet. You can also select `VM.Standard.E5.Flex` and repeat the image lookup to select the x86 image.

```bash
AD='your availability domain name'
SHAPE=VM.Standard.A1.Flex
IMAGE=$(oci compute image list -c "$T" --shape "$SHAPE" \
  --operating-system "Oracle Linux" --operating-system-version 9 \
  --sort-by TIMECREATED --sort-order DESC --limit 1 --query 'data[0].id' --raw-output)
VM=$(oci compute instance launch -c "$C" --availability-domain "$AD" \
  --shape "$SHAPE" --shape-config '{"ocpus":2,"memoryInGBs":8}' --image-id "$IMAGE" \
  --subnet-id "$SUBNET" --assign-public-ip true --display-name "$NAME-vm" \
  --ssh-authorized-keys-file ssh_ed25519.pub --query data.id --raw-output)
oci compute instance get --instance-id "$VM" --query 'data."lifecycle-state"' --raw-output
```

Once the instance is `RUNNING`, retrieve its public IP and sign in.

```bash
VM_IP=$(oci compute instance list-vnics --instance-id "$VM" \
  --query 'data[0]."public-ip"' --raw-output)
ssh -i ssh_ed25519 "opc@$VM_IP"
```

### Configure firewalld and install k3s

Run these commands on the VM. Keep TCP 6443 closed in the OCI security list. Local tools will reach the API through an SSH tunnel. The trusted sources below are the default pod and service CIDRs. [K3s firewall requirements](https://docs.k3s.io/installation/requirements#firewalld) · [K3s quick start](https://docs.k3s.io/quick-start)

```bash
sudo firewall-cmd --state
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=6443/tcp
sudo firewall-cmd --permanent --zone=trusted --add-source=10.42.0.0/16
sudo firewall-cmd --permanent --zone=trusted --add-source=10.43.0.0/16
sudo firewall-cmd --reload

curl -sfL https://get.k3s.io | sudo sh -
until sudo /usr/local/bin/k3s kubectl get nodes 2>/dev/null | grep -q Ready; do sleep 3; done
sudo /usr/local/bin/k3s kubectl wait --for=condition=Ready node --all --timeout=180s
sudo /usr/local/bin/k3s kubectl wait --for=create deployment/traefik -n kube-system --timeout=180s
sudo /usr/local/bin/k3s kubectl rollout status deployment/traefik -n kube-system --timeout=180s
```

### Connect kubectl and Helm from your workstation

Install kubectl and Helm on your workstation. On macOS with Homebrew, use `brew install kubectl helm`. [Install kubectl](https://kubernetes.io/docs/tasks/tools/) · [Install Helm](https://helm.sh/docs/intro/install/)

Return to the workstation shell in `infrayard-host`. The copied kubeconfig grants cluster-admin access. Keep it private and leave the server address at `https://127.0.0.1:6443` for this tunnel.

```bash
umask 077
ssh -i ssh_ed25519 "opc@$VM_IP" 'sudo cat /etc/rancher/k3s/k3s.yaml' > kubeconfig
chmod 600 kubeconfig
ssh -i ssh_ed25519 -fN -o ExitOnForwardFailure=yes \
  -L 127.0.0.1:6443:127.0.0.1:6443 "opc@$VM_IP"
export KUBECONFIG="$PWD/kubeconfig"
kubectl get nodes
helm version --short
```

Keep the tunnel running and return to the directory containing your OCI API key, such as `infrayard-oci`. Continue with the Kubernetes installation using storage class `local-path`. For a public portal, use the VM's public IP for DNS. A temporary evaluation can use a name such as `203-0-113-10.sslip.io` with the octets of the VM's public IP. Verify that the name resolves before you request the certificate. [Install on Kubernetes](/docs/install-kubernetes/)
