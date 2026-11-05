# Install on Kubernetes

This guide installs Infrayard with Helm into a Kubernetes cluster you already run: an OKE cluster, k3s or another distribution. The steps are the same everywhere; where OKE and k3s differ, both variants are shown. Infrayard is tested on k3s with Traefik and cert-manager.

Time needed: about 30 minutes, after [Prepare OCI](/docs/oci-setup/).

## What you need

- A Kubernetes cluster and `kubectl` access with rights to create a namespace.
- [Helm](https://helm.sh/docs/intro/install/) 3.8 or newer on your workstation.
- An ingress controller. OKE has none by default; k3s ships Traefik.
- [cert-manager](https://cert-manager.io/) for Let's Encrypt certificates, or your own TLS certificate.
- A default StorageClass for one 10 GiB volume (PostgreSQL). OKE: `oci-bv`. k3s: `local-path`.
- Free capacity of about 1 CPU and 2 GiB memory. Limits allow peaks up to 4.7 CPU and 3.2 GiB.
- A DNS name for the portal, for example `infrayard.example.com`. Keycloak is served on the same name under `/auth`, so one name is enough.
- The values from the [OCI checklist](/docs/oci-setup/#values-checklist).
- Your registry access from the onboarding e-mail: user, token, registry address and the Infrayard version (for example `1.4.0`; use it wherever `<version>` appears below).

The examples use the namespace `infrayard`, the release name `infrayard` and the registry `registry.gitlab.com/solvialab/infrayard`. Use the registry address and version from your onboarding e-mail.

## 1. Ingress controller and certificates

Skip this step if your cluster already has an ingress controller and cert-manager.

**OKE: install Traefik.** It creates an OCI flexible load balancer with a public IP:

```bash
helm repo add traefik https://traefik.github.io/charts
helm install traefik traefik/traefik -n traefik --create-namespace \
  --set service.annotations."service\.beta\.kubernetes\.io/oci-load-balancer-shape"=flexible \
  --set service.annotations."service\.beta\.kubernetes\.io/oci-load-balancer-shape-flex-min"=10 \
  --set service.annotations."service\.beta\.kubernetes\.io/oci-load-balancer-shape-flex-max"=100
```

For a portal reachable only from your VPN, use an internal load balancer instead; see [private access](/docs/private-access/).

**k3s:** Traefik is already running in `kube-system`.

**cert-manager** (both):

```bash
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager -n cert-manager --create-namespace \
  --set crds.enabled=true
```

Then create a Let's Encrypt issuer. Use an e-mail address that receives expiry notices:

```bash
kubectl apply -f - <<'EOF'
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: platform@example.com
    privateKeySecretRef:
      name: letsencrypt
    solvers:
      - http01:
          ingress:
            ingressClassName: traefik
EOF
```

Let's Encrypt must reach the portal on port 80 from the internet. If it cannot, use your own certificate (step 4).

## 2. Log in to the registry

The chart and the images are in the same private registry. Log in once with the token from your onboarding e-mail:

```bash
helm registry login registry.gitlab.com -u <registry-user>
# Password: your registry token
```

Check that you can read the chart:

```bash
helm show chart oci://registry.gitlab.com/solvialab/infrayard/charts/infrayard --version <version>
```

## 3. Create the namespace and secrets

Two secrets are created by hand so that they never appear in Helm values. Run the commands from a directory that contains `oci_api_key.pem`:

```bash
kubectl create namespace infrayard

# Lets Kubernetes pull the images
kubectl create secret docker-registry regcred -n infrayard \
  --docker-server=registry.gitlab.com \
  --docker-username=<registry-user> \
  --docker-password=<registry-token>

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

`secrets.yaml` (generate each password with `openssl rand -base64 24`):

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
- **E-mail notifications** (optional): set `api.email.enabled: true`, `api.email.adminEmails` and the `api.email.smtp` block, with the SMTP password in `secrets.yaml`.
- **Single-node clusters:** the chart tolerates the control-plane taint by default, so all pods can run on one k3s node.

## 5. Install

```bash
helm install infrayard oci://registry.gitlab.com/solvialab/infrayard/charts/infrayard \
  --version <version> -n infrayard -f values.yaml -f secrets.yaml
```

The chart version selects the matching image version automatically; do not set an image tag.

Watch the pods until all four are `Running` and ready. Keycloak needs about a minute on the first start:

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

Create an `A` record from `infrayard.example.com` to the `EXTERNAL-IP`. Once DNS resolves, cert-manager obtains the certificate, usually within two minutes:

```bash
kubectl get certificate -n infrayard
# NAME            READY   SECRET          AGE
# infrayard-tls   True    infrayard-tls   2m
```

## 7. Sign in

Open `https://infrayard.example.com` and sign in with the first admin's user name and temporary password. Keycloak asks for a new password right away.

Then, in **Admin → Configuration**:

1. Check the region and the anchor compartment.
2. **Sync** shapes and Kubernetes versions from OCI and enable the ones your users may choose. New versions start disabled.
3. Review the default limits and the templates.

Create a small test cluster and watch the Terraform log. When it reaches **Running**, download the kubeconfig and run `kubectl get nodes`. Destroy the test cluster afterwards. This run proves the OCI policies, the state bucket and the network path to the cluster API; a successful `helm install` alone does not. See [cluster lifecycle](/docs/cluster-lifecycle/).

## Add users

With the bundled Keycloak, users are managed in the Keycloak admin console, which is not exposed on the internet. Open it through a port forward:

```bash
kubectl port-forward -n infrayard svc/infrayard-keycloak 8080:8080
```

Go to `http://localhost:8080/auth/admin`, sign in as `admin` with the Keycloak master admin password and switch to the realm **infrayard**.

- **Users → Add user**, then **Credentials → Set password** with **Temporary** on.
- For an administrator: **Role mapping → Assign role → admin**.

Users without the `admin` role can sign in, deploy clusters within their limits and see the templates allowed for their roles. To connect Infrayard to your company Keycloak instead, see [Use your own Keycloak](/docs/keycloak/).

## Reference: all settings

```bash
helm show values oci://registry.gitlab.com/solvialab/infrayard/charts/infrayard --version <version>
```

Every value is documented in that output. After the installation, `helm status infrayard -n infrayard` prints the portal URL and the sign-in summary again.

Next: [restrict access to your VPN](/docs/private-access/) and plan [upgrades and backups](/docs/operations/).
