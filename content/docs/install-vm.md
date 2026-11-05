# Install on a single VM

This guide runs Infrayard on one Linux VM with Docker Compose, without Kubernetes. It suits evaluations, demos and small teams. The VM runs five containers: PostgreSQL, Keycloak, the Infrayard API, the portal and [Caddy](https://caddyserver.com/), which provides HTTPS with an automatic Let's Encrypt certificate.

Time needed: about 20 minutes, after [Prepare OCI](/docs/oci-setup/).

For production with high availability requirements, use [Kubernetes](/docs/install-kubernetes/). You can move from the VM to Kubernetes later with a database backup and restore.

## What you need

- A VM with Ubuntu 24.04 LTS (other Linux distributions with Docker work the same way), x86 or Arm.
- At least 2 CPUs, 4 GB memory and 30 GB disk; 8 GB memory is recommended. On OCI, for example `VM.Standard.A1.Flex` with 2 OCPUs and 12 GB, or `VM.Standard.E5.Flex` with 1 OCPU and 8 GB.
- Ports 80 and 443 open from your users to the VM (OCI: security list or network security group of the subnet). Port 80 is needed for the Let's Encrypt check and redirects to HTTPS.
- A DNS name, for example `infrayard.example.com`, with an `A` record to the VM's IP. Keycloak is served on the same name under `/auth`.
- Outbound internet access from the VM to OCI APIs, the image registry and Let's Encrypt.
- The values from the [OCI checklist](/docs/oci-setup/#values-checklist) and the `oci_api_key.pem` file.
- Your registry access from the onboarding e-mail: user, token, image addresses and the Infrayard version.

## 1. Install Docker

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
```

Log out and in again so that your user can run `docker`. Check:

```bash
docker compose version
```

## 2. Log in to the registry

```bash
docker login registry.gitlab.com -u <registry-user>
# Password: your registry token
```

## 3. Get the Compose bundle

The bundle is delivered through the same private registry as the images, in the version you install:

```bash
cd ~
docker run --rm registry.gitlab.com/solvialab/infrayard/compose:1.4.0 | tar xz
mv infrayard-compose infrayard && cd ~/infrayard
ls
```

```text
Caddyfile  README.md  docker-compose.yml  keycloak  nginx  postgres
```

It contains configuration only, and `.env.example` already names the matching image version.

## 4. Configure

```bash
cp .env.example .env
chmod 600 .env
nano .env
```

Fill in every value. Generate each password with `openssl rand -hex 24`:

```bash
# Portal
INFRAYARD_DOMAIN=infrayard.example.com
INFRAYARD_API_IMAGE=registry.gitlab.com/solvialab/infrayard/api
INFRAYARD_FRONTEND_IMAGE=registry.gitlab.com/solvialab/infrayard/frontend
# Already set to the version of the bundle
INFRAYARD_VERSION=1.4.0

# Passwords
DB_PASSWORD=<random>
KEYCLOAK_ADMIN_PASSWORD=<random>

# First Infrayard administrator; the password is temporary
INFRAYARD_ADMIN_USER=admin
INFRAYARD_ADMIN_EMAIL=admin@example.com
INFRAYARD_ADMIN_PASSWORD=<random>

# OCI (from Prepare OCI)
OCI_TENANCY_OCID=ocid1.tenancy.oc1..aaaa...
OCI_USER_OCID=ocid1.user.oc1..aaaa...
OCI_FINGERPRINT=12:34:56:78:90:ab:cd:ef:12:34:56:78:90:ab:cd:ef
OCI_REGION=eu-frankfurt-1
OCI_NAMESPACE=frxyz1abcd
OCI_PARENT_COMPARTMENT_OCID=ocid1.compartment.oc1..aaaa...
TF_STATE_BUCKET=infrayard-tfstate
TF_S3_ACCESS_KEY=<S3 access key>
TF_S3_SECRET_KEY=<S3 secret key>
```

The optional `SMTP_*` values at the end of the file enable e-mail notifications.

Copy the OCI API private key next to the file. The API container runs as user ID 1000 and must be able to read it:

```bash
cp /path/to/oci_api_key.pem ./oci_api_key.pem
sudo chown 1000 oci_api_key.pem
sudo chmod 400 oci_api_key.pem
```

## 5. Start

Make sure the DNS record already points to the VM; Caddy requests the certificate on the first start.

```bash
docker compose up -d
docker compose ps
```

All five services must be `Up`; `infrayard-api`, `infrayard-frontend` and `infrayard-postgresql` also show `(healthy)`.

On the first start, Keycloak creates the realm `infrayard`, the portal client, the `admin` role and your first administrator. This takes about a minute. Follow it with `docker compose logs -f infrayard-keycloak` until the line `Realm 'infrayard' imported` appears.

## 6. Sign in

Open `https://infrayard.example.com` and sign in with `INFRAYARD_ADMIN_USER` and `INFRAYARD_ADMIN_PASSWORD`. Keycloak asks for a new password right away. `INFRAYARD_ADMIN_PASSWORD` is only used on the first start; changing it later has no effect.

Then, in **Admin → Configuration**:

1. Check the region and the anchor compartment.
2. **Sync** shapes and Kubernetes versions from OCI and enable the ones your users may choose.
3. Review the default limits and the templates.

Create a small test cluster, download its kubeconfig, run `kubectl get nodes` and destroy the cluster again. This proves the OCI policies, the state bucket and the network path to the cluster API.

## Add users

The Keycloak admin console listens only on the VM itself (`127.0.0.1:8081`). Open it through an SSH tunnel from your workstation:

```bash
ssh -L 8081:127.0.0.1:8081 ubuntu@<vm-address>
```

Go to `http://localhost:8081/auth/admin`, sign in as `admin` with `KEYCLOAK_ADMIN_PASSWORD` and switch to the realm **infrayard**.

- **Users → Add user**, then **Credentials → Set password** with **Temporary** on.
- For an administrator: **Role mapping → Assign role → admin**.

## Day-to-day commands

Run them in `~/infrayard`:

```bash
docker compose ps                         # status
docker compose logs -f infrayard-api      # API and Terraform logs
docker compose restart infrayard-api      # restart one service
docker compose down                       # stop (data stays in Docker volumes)
docker compose up -d                      # start again
```

Data lives in Docker volumes: `infrayard_postgres` (Infrayard and Keycloak database), `infrayard_caddy-data` (certificates) and `infrayard_runner` (temporary Terraform work files). Terraform state itself is in the OCI bucket. Back up the database as described in [operations](/docs/operations/#backups).

## Variants

**Own TLS certificate** (for example from a company CA, or when Let's Encrypt cannot reach the VM): put `infrayard.crt` (full chain) and `infrayard.key` into `~/infrayard/certs/`, then change the `Caddyfile`:

```text
{$INFRAYARD_DOMAIN} {
	tls /certs/infrayard.crt /certs/infrayard.key
	encode zstd gzip
	reverse_proxy infrayard-frontend:8080 {
		flush_interval -1
	}
}
```

and add `- ./certs:/certs:ro` to the `volumes` of the `caddy` service in `docker-compose.yml`. Then `docker compose up -d`.

**Access only through VPN:** see [private access](/docs/private-access/).

**Your own Keycloak:** the single-VM bundle always uses its bundled Keycloak. To sign in through your company Keycloak, use the [Kubernetes installation](/docs/install-kubernetes/) with [your own Keycloak](/docs/keycloak/).
