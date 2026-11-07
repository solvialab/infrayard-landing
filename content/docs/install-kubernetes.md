# Install on Kubernetes

This guide installs Infrayard with Helm into a Kubernetes cluster you already run: an OKE cluster, k3s or another distribution. The steps are the same everywhere; where OKE and k3s differ, both variants are shown. Infrayard is tested with this guide on OKE (Kubernetes 1.36, one `VM.Standard.E4.Flex` worker with 1 OCPU and 8 GB) and on k3s, both with Traefik and cert-manager.

Time needed: about 30 minutes, after [Prepare OCI](/docs/oci-setup/).

## What you need

- A Kubernetes cluster and `kubectl` access. Step 1 installs cluster-wide resources (cert-manager and its CRDs, the Let's Encrypt issuer) and needs cluster-admin rights; the Infrayard chart itself creates only namespaced resources.
- [Helm](https://helm.sh/docs/intro/install/) 3.8 or newer on your workstation.
- An ingress controller. OKE has none by default; k3s ships Traefik.
- [cert-manager](https://cert-manager.io/) for Let's Encrypt certificates, or your own TLS certificate.
- A StorageClass for the PostgreSQL volume. The chart requests 10 GiB. OKE: `oci-bv`, which creates a 50 GB block volume, the OCI minimum. k3s: `local-path`.
- Free capacity of about 1 CPU and 2 GiB memory. Limits allow peaks up to 3.7 CPU and 3.2 GiB.
- Outbound internet access from the pods. Each cluster deployment downloads the Terraform providers from `registry.terraform.io`, `releases.hashicorp.com` and GitHub releases. On OKE with private worker nodes, this traffic goes through the VCN's NAT gateway; a service gateway alone is not enough.
- A DNS name for the portal, for example `infrayard.example.com`. Keycloak is served on the same name under `/auth`, so one name is enough.
- The values from the [OCI checklist](/docs/oci-setup/#values-checklist).
- The registry user, token, address and Infrayard version from your onboarding e-mail. Step 2 uses `1.0.2` as an example.

The examples use the namespace `infrayard`, the release name `infrayard` and the registry `registry.gitlab.com/solvialab/infrayard`. Use the registry address and version from your onboarding e-mail.

## 1. Ingress controller and certificates

Reuse your ingress controller and cert-manager if they are already installed. For automatic TLS, configure or reuse a ClusterIssuer and use its name in step 4.

**OKE:** Install Traefik if you need an ingress controller. The chart creates an OCI flexible load balancer with a public IP.

```bash
helm repo add traefik https://traefik.github.io/charts
helm install traefik traefik/traefik -n traefik --create-namespace \
  --set-string service.annotations."service\.beta\.kubernetes\.io/oci-load-balancer-shape"=flexible \
  --set-string service.annotations."service\.beta\.kubernetes\.io/oci-load-balancer-shape-flex-min"=10 \
  --set-string service.annotations."service\.beta\.kubernetes\.io/oci-load-balancer-shape-flex-max"=100
```

Use `--set-string`: annotations must be strings, and with `--set` Helm reads `10` and `100` as numbers and the install fails. The load balancer gets its public IP within about a minute; `kubectl get svc -n traefik traefik` shows it as `EXTERNAL-IP`.

The load balancer subnet must allow TCP 80 and 443 from the internet in its security list or network security group: 80 for Let's Encrypt, 443 for users. Clusters created by Infrayard have these rules. OKE opens the node ports from the load balancer to the worker nodes on its own.

For a portal reachable only from your VPN, use an internal load balancer instead; see [private access](/docs/private-access/).

**k3s:** Traefik is already running in `kube-system`.

Install cert-manager on OKE or k3s if it is missing from your cluster.

```bash
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager -n cert-manager --create-namespace \
  --set crds.enabled=true
```

Then create a Let's Encrypt issuer. It needs no e-mail address; Let's Encrypt no longer sends expiry e-mails, and cert-manager renews the certificate on its own:

```bash
kubectl apply -f - <<'EOF'
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt
    solvers:
      - http01:
          ingress:
            ingressClassName: traefik
EOF
kubectl wait --for=condition=Ready clusterissuer/letsencrypt --timeout=120s
```

Let's Encrypt must reach the portal on port 80 from the internet. If it cannot, use your own certificate (step 4).

## 2. Log in to the registry

The chart and the images are in the same private registry. Use the same Bash shell for the remaining steps so they can read the variables you set here. When prompted, enter the registry credentials from your onboarding e-mail.

```bash
VERSION=1.0.2  # Replace with the version from your onboarding e-mail.
read -r -p 'Registry user: ' REGISTRY_USER
read -rs -p 'Registry token: ' REGISTRY_TOKEN
printf '\n'
printf '%s' "$REGISTRY_TOKEN" |
  helm registry login registry.gitlab.com -u "$REGISTRY_USER" --password-stdin
```

Check that you can read the chart.

```bash
helm show chart oci://registry.gitlab.com/solvialab/infrayard/charts/infrayard --version "$VERSION"
```

Check that both `version` and `appVersion` match `VERSION`. If you get `401`, `403` or `denied`, check your login and the token's registry access. [Troubleshooting](/docs/troubleshooting/#installation)

## 3. Create the namespace and secrets

Create two Kubernetes Secrets outside Helm. This block uses `jq` and the registry credentials from step 2. Run it from the directory containing `oci_api_key.pem`.

```bash
kubectl create namespace infrayard

# Lets Kubernetes pull the images
printf '%s' "$REGISTRY_TOKEN" |
  jq -cRs --arg user "$REGISTRY_USER" \
    '{auths:{"registry.gitlab.com":{auth:(($user + ":" + .)|@base64)}}}' |
  kubectl create secret generic regcred -n infrayard \
    --type=kubernetes.io/dockerconfigjson --from-file=.dockerconfigjson=/dev/stdin
unset REGISTRY_TOKEN

# OCI API private key of the infrayard-svc user
kubectl create secret generic infrayard-oci-key -n infrayard \
  --from-file=oci_api_key.pem=./oci_api_key.pem
```

The key name inside the secret must be `oci_api_key.pem`. Without this secret the API pod stays in `Init` or `ContainerCreating`.

## 4. Write the values files

Keep settings and passwords in two files. `values.yaml` can go into your configuration repository; `secrets.yaml` belongs in your secret manager.

`values.yaml`:

```yaml
global:
  domain: infrayard.example.com
  imagePullSecrets:
    - name: regcred

api:
  image:
    repository: registry.gitlab.com/solvialab/infrayard/api
  oci:
    tenancyOcid: ocid1.tenancy.oc1..aaaa...
    userOcid: ocid1.user.oc1..aaaa...
    fingerprint: "12:34:56:78:90:ab:cd:ef:12:34:56:78:90:ab:cd:ef"
    region: eu-frankfurt-1
    namespace: frxyz1abcd
    parentCompartmentOcid: ocid1.compartment.oc1..aaaa...
  terraform:
    stateBucket: infrayard-tfstate

frontend:
  image:
    repository: registry.gitlab.com/solvialab/infrayard/frontend

postgresql:
  storage:
    storageClass: oci-bv        # OKE. k3s: local-path. Empty: cluster default

keycloak:
  realmImport:
    initialAdmin:               # first Infrayard administrator
      username: admin
      email: admin@example.com

ingress:
  className: traefik            # or nginx, or your controller's class
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
  tls:
    enabled: true
    secretName: infrayard-tls
```

`secrets.yaml`. Generate each of the three passwords with `openssl rand -hex 24`; hex passwords contain no characters that need escaping:

```yaml
postgresql:
  auth:
    password: "<database password>"
keycloak:
  admin:
    password: "<Keycloak master admin password>"
  realmImport:
    initialAdmin:
      password: "<temporary password of the first admin>"
api:
  terraform:
    s3AccessKey: "<S3 access key>"
    s3SecretKey: "<S3 secret key>"
```

```bash
chmod 600 secrets.yaml
```

Notes:

- **Own certificate instead of Let's Encrypt:** create the secret with `kubectl create secret tls infrayard-tls -n infrayard --cert=fullchain.pem --key=privkey.pem` and remove the `cert-manager.io/cluster-issuer` annotation.
- **ingress-nginx:** set `className: nginx` and add the annotations `nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"` and `nginx.ingress.kubernetes.io/proxy-buffering: "off"`, so that live Terraform logs are not cut off.
- **Your own Keycloak** instead of the bundled one: see [Use your own Keycloak](/docs/keycloak/) before installing.
- **E-mail notifications** (optional): set `api.email.enabled: true`, `api.email.adminEmails` and the `api.email.smtp` block, with the SMTP password in `secrets.yaml`. Infrayard connects with STARTTLS, usually on port 587, and checks the server certificate. Implicit TLS, usually on port 465, is not supported. If a company CA signed the certificate, put the PEM in `api.email.smtp.ca.cert`, or name a ConfigMap in `api.email.smtp.ca.existingConfigMap`. `api.email.smtp.tlsVerify: false` turns the check off, so anyone on the network path could read the SMTP password and the mail. Use it for tests only.
- **Rate limiting** (optional): off by default. It needs each user's own address to reach the portal; see [rate limiting](/docs/security/#rate-limiting) before you turn it on.
- **Test or demo installation:** `frontend.robots.noindex: true` asks search engines not to index the portal.
- **Single-node clusters:** the chart tolerates the control-plane taint by default, so all pods can run on one k3s node.

## 5. Install

```bash
helm install infrayard oci://registry.gitlab.com/solvialab/infrayard/charts/infrayard \
  --version "$VERSION" -n infrayard -f values.yaml -f secrets.yaml
```

The chart version selects the matching image version automatically; do not set an image tag.

Watch the pods until all four are `Running` and ready, usually within two minutes. Keycloak is the last one, because it imports the realm on the first start:

```bash
kubectl get pods -n infrayard -w
```

```text
NAME                                  READY   STATUS    RESTARTS   AGE
infrayard-api-6c9f7d8b5-x2kqp         1/1     Running   0          2m
infrayard-frontend-5bd8c7f9d4-7wq9z   1/1     Running   0          2m
infrayard-keycloak-7d9b6f5c8-k4m2n    1/1     Running   0          2m
infrayard-postgresql-0                1/1     Running   0          2m
```

## 6. Point DNS to the cluster

Find the external IP of the ingress controller:

```bash
kubectl get svc -n traefik traefik        # OKE with Traefik from step 1
kubectl get svc -n kube-system traefik    # k3s
```

If you use your own domain on OKE, point its A record to the `EXTERNAL-IP`.

**k3s on a cloud VM** (for example OCI Compute): k3s publishes Traefik on the node's own address, so `EXTERNAL-IP` shows the VM's **private** IP, such as `10.0.0.12`. Point DNS to the VM's **public** IP instead, and allow TCP 80 and 443 in the VM's security list or network security group and in the host firewall. For a VPN-only portal, use the private IP; see [private access](/docs/private-access/).

For a temporary k3s evaluation using `sslip.io`, use the same name as `global.domain` in step 4. That name supplies its own A record. Run `dig +short "$PORTAL_DOMAIN" A` with `PORTAL_DOMAIN` set to the name and check that it returns the VM's public IP.

Once DNS resolves, cert-manager obtains the certificate, usually within two minutes:

```bash
kubectl get certificate -n infrayard
# NAME            READY   SECRET          AGE
# infrayard-tls   True    infrayard-tls   2m
```

## 7. Sign in

Open `https://infrayard.example.com` and sign in with the first admin's user name and temporary password. Keycloak asks for a new password right away.

Then, in **Admin → Configuration**:

1. Check the region and the anchor compartment.
2. In **Available Node Shapes**, click **Sync from OCI**. In **Available K8s Versions**, click **Refresh from OCI**. Enable the shapes and versions your users may choose. New versions start disabled.
3. Set **Kubernetes API Access** under **OCI Settings**. Infrayard calls the API of every new cluster on port 6443 to issue kubeconfigs, so it needs a network path to it. With the box off (the default), clusters get a private endpoint. Infrayard creates a new VCN for each cluster unless you supply one, so it reaches a private endpoint only if its own network is routed into that VCN; without such a route the cluster still deploys, but the kubeconfig download fails. To use a public endpoint instead, turn on **Public endpoint restricted by CIDR allowlist**, enter your VPN or office ranges and Infrayard's own outbound address in **Allowed API CIDRs**, and click **Save OCI settings**. On OKE with private worker nodes, that address is the public IP of the NAT gateway in the VCN of the cluster that runs Infrayard:

   ```bash
   oci network nat-gateway list -c <compartment of that VCN> --query 'data[]."nat-ip"'
   ```

   On a k3s VM with a public IP, it is that IP. The setting applies to clusters created afterwards.
4. Review the default limits and the templates.

Create a small test cluster and watch the Terraform log. It ends with `OK Cluster ready for kubeconfig downloads`; if it reports `Cluster API endpoint … not reachable from Infrayard` instead, fix the API access from step 3. When the cluster reaches **Running**, download the kubeconfig and run `kubectl get nodes`. Destroy the test cluster afterwards. This run proves the OCI policies, the state bucket and the network path to the cluster API; a successful `helm install` alone does not. See [cluster lifecycle](/docs/cluster-lifecycle/).

## Add users

With the bundled Keycloak, users are managed in the Keycloak admin console, which is not exposed on the internet. Open it through a port forward:

```bash
kubectl port-forward -n infrayard svc/infrayard-keycloak 8080:8080
```

Go to `http://localhost:8080/auth/admin` and sign in as `admin` with the Keycloak master admin password from step 4. Open **Manage realms** and select **infrayard**.

- In **Users → Add user**, fill in the user details and click **Create**. Open **Credentials → Set password**, keep **Temporary** on, click **Save**, and confirm with **Save password**. The user sets a new password at first sign-in.
- For an administrator: **Role mapping → Assign role → admin**.

Passwords need at least 12 characters and must differ from the user name, the e-mail and the last five passwords. After 5 failed sign-ins an account is locked for a minute or longer; to unlock it at once, open the user and turn off **Temporarily locked**.

Users without the `admin` role can sign in, deploy clusters within their limits and see the templates allowed for their roles. To connect Infrayard to your company Keycloak instead, see [Use your own Keycloak](/docs/keycloak/).

## Reference: all settings

```bash
helm show values oci://registry.gitlab.com/solvialab/infrayard/charts/infrayard --version "$VERSION"
```

Every value is documented in that output. After the installation, `helm status infrayard -n infrayard` prints the portal URL and the sign-in summary again.

Next: [restrict access to your VPN](/docs/private-access/) and plan [upgrades and backups](/docs/operations/).
