# Networking and existing infrastructure

Each cluster needs a network, and its Kubernetes API must be reachable from Infrayard and from your users. This page explains what Infrayard creates by default, how to reuse your own VCNs, subnets and compartments, and which access mode to choose for the Kubernetes API.

## Default setup

Without any overrides, Infrayard creates a complete network for every cluster, in the cluster's own compartment:

- A **VCN** whose /16 range is derived from the cluster's /24 CIDR.
- A **private worker subnet** (/24). Worker nodes have no public IPs.
- A **public load balancer subnet** for Kubernetes `LoadBalancer` services.
- A **public API endpoint subnet**, only in the restricted public API mode (below).
- Internet, NAT and service gateways with route tables.
- Security lists with the rules OKE needs, plus the TCP/6443 allowlist for the API.

All of it belongs to the cluster's Terraform state and is removed when the cluster is destroyed.

## Kubernetes API endpoint access

Choose the mode in **Admin → Configuration → OCI Settings → Kubernetes API Access**: the box **Public endpoint restricted by CIDR allowlist** and the list **Allowed API CIDRs**. The setting applies to clusters created afterwards.

| Mode | Where the API is | Who can reach it |
| --- | --- | --- |
| Private endpoint (box off, default) | Private subnet, no public IP | Anything with a route into the VCN: VPN through a DRG, FastConnect, a bastion, or Infrayard running in a peered network |
| Public endpoint restricted by CIDR allowlist | Dedicated public subnet | Only the CIDR ranges you list; `0.0.0.0/0` is rejected |

With **Public endpoint restricted by CIDR allowlist** on, list both in **Allowed API CIDRs**:

- your **VPN or office egress** ranges, so users can run `kubectl`, and
- the **outbound address of Infrayard** itself (NAT gateway or VM public IP), because Infrayard calls the cluster API to issue kubeconfigs.

This mode avoids routing every cluster VCN to your network, which helps when DRG attachments are costly or local peering limits are reached. Users still connect from the VPN or office network.

The kubeconfig only provides authentication. Without a network path to port 6443, `kubectl` times out.

## Bringing your own network

In the deploy form, the **Advanced** tab accepts existing OCIDs. Infrayard then skips creating those resources:

| Field | Effect |
| --- | --- |
| Existing Compartment OCID | Resources go into this compartment instead of a new one |
| Existing VCN OCID | Uses your VCN; Infrayard creates only the cluster subnets and their security lists inside it |
| Existing Subnet OCID | Worker nodes and the Kubernetes API endpoint go into your subnet; requires the VCN OCID as well |

Supported combinations:

| You provide | Infrayard creates and manages |
| --- | --- |
| Nothing | Compartment, VCN, subnets, gateways, route tables, security lists, cluster |
| Compartment | VCN and the complete network inside that compartment, cluster |
| VCN (optionally compartment) | Subnets and security lists in your VCN, cluster. Your gateways and route tables are used as they are |
| VCN and subnet (optionally compartment) | Only the cluster and node pools. Infrayard creates and changes nothing in your network |
| Subnet without VCN | Rejected before Terraform starts |

Rules:

- **Stay inside the anchor.** A supplied compartment must be the anchor compartment or any compartment below it. Others are rejected before Terraform starts, because the OCI policies only cover the anchor subtree.
- **No automatic discovery.** Supplying only a compartment does not reuse a VCN that already exists in it; Infrayard creates a new one.
- **Routing must be ready.** With your own VCN or subnet, the worker subnet needs a route `0.0.0.0/0` to a NAT gateway (or your egress path) and a route for `all-<region>-services-in-oracle-services-network` to a service gateway. Otherwise nodes cannot register.
- **Public endpoint restricted by CIDR allowlist** needs an Infrayard-managed VCN. While this mode is on, deployments with an existing VCN or subnet are rejected; an existing compartment is fine.
- **Sharing a compartment:** to place several clusters in one compartment, create a compartment for them and supply it to each cluster. Do not reuse a compartment that Infrayard created for another cluster.
- **A network path to the API.** The Kubernetes API of a cluster in your network has a private address. Infrayard needs a route to it to issue kubeconfigs, for example by running in the same VCN or in a network connected to it.

The OCID fields check the OCID type and offer autocomplete lists of the compartments, VCNs and subnets Infrayard can see.

### When you supply only a VCN

- The VCN needs a **DNS label** and a **free /24 inside its address range**, entered as the cluster CIDR. Infrayard rejects anything else before Terraform starts.
- Inside that /24, Infrayard creates a private subnet for workers and the API endpoint (the lower /25) and a public subnet for load balancers (the last /28). The VCN can be small (a /20 was tested), and several clusters can share one VCN, each with its own /24.
- The new subnets use the **default route table of your VCN**, so that table needs the routes above. With `0.0.0.0/0` pointing to a NAT gateway, a public load balancer cannot be reached from the internet. Use an internal load balancer instead, as in [private access](/docs/private-access/).

### When you supply a VCN and a subnet

- The subnet needs a **free address for the API endpoint and every worker node**, plus rules that let them talk to each other. This set was tested: all traffic from the subnet itself, TCP 6443 from the VCN, ICMP type 3 code 4, and all egress.
- The cluster has **no default subnet for load balancers**, because OKE does not allow the node subnet in that role. A `Service` of type `LoadBalancer` stays pending with the event `a subnet must be specified for creating a load balancer` until it names a subnet. The node subnet works too:

  ```yaml
  metadata:
    annotations:
      service.beta.kubernetes.io/oci-load-balancer-internal: "true"
      service.beta.kubernetes.io/oci-load-balancer-subnet1: <subnet OCID>
  ```

- **Load balancers change the security list.** While such a load balancer exists, OKE adds the rules it needs to the security list of your subnet and removes them when the load balancer is deleted. Infrayard does not do this. To keep the list unchanged, see the Oracle documentation for the annotation `service.beta.kubernetes.io/oci-load-balancer-security-list-management-mode`.

## Choosing the anchor compartment

The anchor is set at installation and can be changed in **Admin → Configuration**. Typical choices:

| Anchor | Good for | Note |
| --- | --- | --- |
| A dedicated compartment, e.g. `infrayard` | Clear separation and the narrowest permissions | Existing networks must be inside it |
| An existing compartment such as `platform` | Reusing networks and compartments that already exist there | The policies grant management of everything below it |
| The tenancy root | Reusing anything in the tenancy | Policies at tenancy scope; widest permissions |

One installation cannot span several unrelated compartment trees. Use the tenancy root as anchor, or run separate installations.

## Who owns what

- Resources Infrayard creates are managed by the cluster's Terraform state. Manual changes in the OCI Console are overwritten by the next scale or upgrade.
- Infrayard only references the resources you supply (compartment, VCN, subnet) and never changes or deletes them. OKE itself can add security rules for load balancers, as described above.

## Custom security rules

The default security lists cover what OKE needs. For your own rules, for example extra node ports, restricted egress or network security groups, supply your own subnet with those rules already in place. Infrayard then creates no security list of its own.

## The Infrayard installation itself

To make the portal reachable only from your VPN, see [private access](/docs/private-access/).
