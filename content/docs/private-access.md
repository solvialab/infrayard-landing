# Private access (VPN only)

Infrayard holds credentials that can create and delete infrastructure in your OCI tenancy. We strongly recommend that the portal is reachable only from your company network or VPN, not from the whole internet. Infrayard does not restrict network access by itself: this is part of your network setup, and this page shows the usual ways to do it.

Keep in mind what still has to work:

- **Inbound:** users on the VPN reach the portal on port 443. With the bundled Keycloak, sign-in runs on the same address under `/auth`, so it becomes private too.
- **Outbound from Infrayard:** OCI APIs, the image registry, and the Kubernetes API (port 6443) of every cluster it creates. A NAT gateway or your proxy path is enough; Infrayard needs no inbound connection from the internet.
- **Clusters:** users need a route from the VPN to the Kubernetes API of their clusters to use `kubectl`. See [Kubernetes API access](/docs/networking/#kubernetes-api-endpoint-access).

## Option A: private address (recommended)

The portal gets an IP address inside your VCN and has no public IP at all. The VPN reaches the VCN through a dynamic routing gateway (Site-to-Site VPN or FastConnect) or through a VPN server in the VCN.

**OKE with Traefik:** make the load balancer internal and place it in a private subnet:

```bash
helm upgrade traefik traefik/traefik -n traefik --reuse-values \
  --set service.annotations."service\.beta\.kubernetes\.io/oci-load-balancer-internal"="true" \
  --set service.annotations."service\.beta\.kubernetes\.io/oci-load-balancer-subnet1"=<private-subnet-ocid>
```

OCI does not change an existing load balancer from public to private. If Traefik is already installed with a public load balancer, uninstall and install it again with these annotations; it receives a new private IP.

**Other Kubernetes distributions:** use your platform's internal load balancer, or expose the ingress controller only on the nodes' private addresses.

**Single VM:** create the VM in a private subnet without a public IP. Give the subnet a NAT gateway for outbound traffic.

## Option B: public address with an allowlist

The portal keeps its public IP, but only your VPN's egress addresses may connect. In OCI, add an ingress rule for TCP 443 (and 80) from your VPN CIDR ranges only, in the network security group or security list of the load balancer or the VM, and remove any rule that allows `0.0.0.0/0`.

This is quicker to set up but depends on the VPN's public addresses staying the same.

## Certificates for a private portal

Let's Encrypt's standard check (HTTP-01) connects to your portal from the internet, so it fails once the portal is private. Choose one of these:

| Certificate | Kubernetes | Single VM |
| --- | --- | --- |
| From your company CA | `kubectl create secret tls infrayard-tls -n infrayard --cert=fullchain.pem --key=privkey.pem` and remove the `cert-manager.io/cluster-issuer` annotation from the values | Use the `tls` line in the `Caddyfile`, see [own TLS certificate](/docs/install-vm/#variants) |
| Let's Encrypt with a DNS check (DNS-01) | A cert-manager `ClusterIssuer` with a [DNS-01 solver](https://cert-manager.io/docs/configuration/acme/dns01/) for your DNS provider | Use a Caddy build with your DNS provider's module, or a company CA |

A company CA certificate must be trusted on users' devices; for a public DNS-01 certificate nothing extra is needed. Renew company CA certificates before they expire: Infrayard does not do that for you.

## DNS

Point `infrayard.example.com` to the private IP in your internal DNS, for example a private view in OCI DNS or your company DNS that VPN clients use. A public DNS record with a private IP also works, but it publishes the internal address.

## Your own Keycloak

If you [use your own Keycloak](/docs/keycloak/), users' browsers must reach it from the VPN, and the Infrayard API must reach it from the cluster. If the API sees Keycloak under a different internal address, set `api.oidc.internalUrl`.

## Cluster API endpoints

Clusters created by Infrayard can use a private Kubernetes API endpoint or a public one restricted to allowed source ranges. With a restricted public endpoint, add the VPN's egress ranges **and** Infrayard's own outbound address in **Admin → Configuration** as allowed CIDRs; Infrayard calls the cluster API to issue kubeconfigs. See [networking](/docs/networking/).

## Check it

From a machine outside the VPN, the portal must not answer:

```bash
curl -m 10 -sS -o /dev/null https://infrayard.example.com && echo "STILL PUBLIC"
```

From the VPN, it must load and sign-in must work. Then create a test cluster and download its kubeconfig to confirm that Infrayard still reaches OCI and the cluster API.
