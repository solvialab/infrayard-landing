# Cluster lifecycle

These workflows apply to supported OKE clusters managed through Infrayard. Check your cluster tier and network prerequisites before making changes.

## Signing in

Infrayard signs you in through Keycloak — the bundled instance or your organisation's existing Keycloak. Click **Log In** — you are redirected to the Keycloak login page and returned to the portal after authentication. No separate Infrayard account is needed.

## Deploying a cluster

1. Navigate to **Deploy** from the top nav
2. *(Optional)* Select a **Cluster template** — pre-configured profiles created by your admin that pre-fill and lock resource fields (pools, nodes, CPU, RAM, storage). Choose "Custom" to configure everything manually with your account's limits enforced
3. Enter a **Cluster name** — this becomes the base name for all OCI resources (`{name}-cluster`, `{name}-vcn`, etc.)
4. Choose a **CIDR range** from the available pool — each cluster gets its own /24
5. Select a **Kubernetes version**, **VM shape**, and **Node image** (locked if the template defines them; otherwise user-selectable — image defaults to auto-select if none configured)
6. If using "Custom" mode, configure one or more **Node pools** — each pool has a name, node count, OCPU, RAM, and storage, constrained by your account's effective limits
7. *(Optional)* Use the **Advanced tab** to bring existing OCI infrastructure — your own VCN, compartment, or subnet. For a regular user, an existing VCN or subnet must be in the anchor compartment or below it; a network elsewhere in the tenancy needs an administrator to deploy the cluster
8. Review the **Deployment Summary** — shows all resources that will be created, plus live estimated monthly and hourly cost
9. Click **Deploy**

Infrayard runs `terraform apply` and streams the live output in the portal. The cluster appears in **My Clusters** once provisioning completes.

> The deploy form enforces your account's effective limits — maximum pools, nodes, OCPU, RAM, and storage. If a limit prevents you from deploying, submit a limit-increase request from the deploy or scale flow; admins can approve granted values into your per-user overrides.

## Scaling a cluster

1. In **My Clusters**, click **Scale** on a running cluster
2. Adjust resources per pool — nodes, OCPU, RAM, and storage
3. Add new node pools or remove existing ones as needed; new pools default their name to the cluster's bare name and accept any name that matches the standard pool-name rules (lowercase, alphanumeric + hyphen, 32 chars max). Existing pool names stay immutable to keep Terraform/OKE state aligned.
4. Review the change preview and click **Apply**

Scaling behaviour depends on the cluster tier configured by your admin — see [Cluster tiers](/docs/cluster-lifecycle/#cluster-tiers).
Kubernetes version changes are handled via a separate **Upgrade** action.

## Destroying a cluster

1. In **My Clusters**, click **Destroy**
2. Infrayard runs `terraform plan -destroy` and shows the exact resources that will be removed
3. Confirm — `terraform destroy` runs and cluster-scoped OCI resources are cleaned up
4. The CIDR range is returned to the pool and available for reuse

Destroy is permanent and cannot be undone.

> **Requests workflow:** The admin **Requests** area handles both protected-cluster destroy approvals and per-user limit-increase requests. Users submit a reason instead of destroying directly or when they need higher limits; admins approve, adjust, or deny with a note. Destroy approval still opens the Terraform destroy plan before force-destroy. Limit approval writes granted values into the user's per-user overrides. Results appear in the user's Activity inbox, and SMTP-enabled installs can also send info-only email pings with requester, action, comments, and request parameters.
>
> **Destroy behavior note:** Infrayard-managed child compartments may be deleted with the cluster. External compartment overrides are retained for shared/multi-cluster setups. In Object Storage, only the destroyed cluster's `.tfstate` object is removed; the user-level prefix/folder is kept for other clusters.

## Activity

The user nav includes an **Activity** inbox with an unread badge. It persists important events across refreshes and sessions; today it records destroy-request approvals/denials, limit request submissions and reviews, TTL expiry warnings at 24h, 4h, and 1h remaining, deploy/scale/upgrade/destroy start and completion events, and admin-driven account limit changes. Administrators also receive the deploy, scale, upgrade and destroy events of other users' clusters, with the owner's name, and an entry for every new destroy or limit request.

## Cluster detail

Click **Details** on any cluster card to see:

- **Cluster information** — name, status, K8s version, region, CIDR, compartment, VM shape, cluster tier, estimated monthly cost, OCID
- **Node pools** — pool name, node count, OCPU, RAM, storage, and status per pool
- **Cost breakdown** — per-pool monthly cost, control plane cost (Enhanced tier), and total with hourly rate
- **Access** — kubeconfig download and SSH key download (see [Kubernetes access](/docs/security/#kubernetes-access))

## Cluster tiers

The admin configures which cluster tier(s) the platform allows: **Basic only**, **Enhanced only**, or **Both**. When a single tier is allowed, users see it as an informational indicator on the deploy form. When **Both** is allowed, the deploy form shows a tier picker so each user picks per cluster — useful when one team wants free/dev clusters and another wants production-grade scaling, all served by the same platform.

| | Basic | Enhanced |
|---|---|---|
| Cost | Free | Oracle's current Enhanced control-plane rate |
| Node scaling | ⚠️ Full — add/remove nodes or pools is automatic; resource-profile changes require manual replacement | ✅ Full — add/remove nodes or pools is automatic; resource-profile changes require node pool cycling |
| Cluster Autoscaler | ❌ | ✅ |
| Best for | Dev/test, cost-sensitive teams | Production, automated scaling |

**Basic cluster scaling:** Both Basic and Enhanced clusters support full scaling — nodes, OCPU, RAM, and storage. In Basic clusters, adding/removing nodes or node pools is automatic and does not require manual rotation. Changes to per-node resources (shape, OCPU, RAM, storage) and Kubernetes upgrades reach only new workers. Existing workers keep their old settings until you [replace them](#replace-workers-in-a-basic-cluster). In Enhanced clusters a Kubernetes upgrade replaces the workers automatically; after a change of per-node resources you [cycle the node pool](#cycle-workers-in-an-enhanced-cluster).

**Kubernetes version upgrades:** Use **Upgrade k8s** on a running cluster. This updates the control plane and node-pool target Kubernetes/image configuration:
- Direct upgrades are limited to the same or next minor version (for example `1.33.x -> 1.34.x`; not `1.33.x -> 1.35.x`).
- Basic: existing workers keep the old version. After the upgrade, [replace them](#replace-workers-in-a-basic-cluster) one node pool at a time.
- Enhanced: Infrayard [replaces the workers](#automatic-worker-replacement-in-an-enhanced-cluster) after the control plane. The upgrade finishes when every worker runs the new version.

**Switching tiers:** Admins can switch the platform tier at any time in Configuration — Basic, Enhanced, or Both. The change applies to all new clusters; existing clusters retain the tier they were provisioned with.

**Per-user tier override:** Admins can pin a specific user to Basic or to Enhanced, regardless of the global setting. The override is force-only (single tier per user); a user without an override inherits whatever the global setting allows, including the per-cluster picker when the global is **Both**.

### Replace workers in a Basic cluster

Replace the workers in the OCI Console, one node pool at a time. `N` is the pool's current node count.

1. Open the cluster, then **Node pools**, then the pool, and choose **Edit**. Raise **Node count** from `N` to `2N` and save.
2. Wait until the `N` new nodes are `Active` and `Ready`. New nodes use the pool's current version and resources.
3. On the **Nodes** tab, open the actions menu (three dots) of one old node and choose **Delete node**. Select **Decrease node pool size**, keep **Eviction grace period** above 0 so the node is cordoned and drained, and confirm.
4. Wait until that node is gone and its workloads run elsewhere. Repeat step 3 for each remaining old node.
5. The pool is now back at `N`. Check with `kubectl get nodes` that every node shows the expected version, then continue with the next pool.

> Do not lower **Node count** back to `N` to remove the old nodes. OKE then deletes the new nodes and keeps the old ones. The Upgrade and Scale dialogs of Infrayard up to 1.0.3 suggest this shortcut; do not follow it.

Infrayard still records the pool at `N` during these steps, so do not run **Scale** on the cluster until you finish. It would set the pool back to `N` and remove nodes.

### Cycle workers in an Enhanced cluster

After a change of per-node resources, Infrayard updates the node pool but does not replace its workers. Cycle each node pool in the OCI Console, one pool at a time. Use the same steps to finish a Kubernetes upgrade whose [automatic worker replacement](#automatic-worker-replacement-in-an-enhanced-cluster) did not complete.

1. Open the cluster, then **Node pools**, then the pool, and choose **Cycle nodes** from the **Actions** menu.
2. Select **Replace nodes**.
3. Set **Maximum surge** to `1` and **Maximum unavailable** to `0`, both as **Integer**.
4. Start the cycle and follow it on the **Work requests** tab.
5. Check with `kubectl get nodes` that every node shows the expected version, then continue with the next pool.

With these values OKE adds one new node first. When it is active, OKE cordons, drains and removes one old node, so the pool never drops below its size. A higher **Maximum surge** finishes sooner but adds more temporary nodes and cost. A **Maximum unavailable** above `0` removes old nodes before their replacements are ready, so capacity drops during the cycle.

A PodDisruptionBudget can block the drain of a node. If a node cannot be drained within the eviction grace period, 60 minutes by default, the node pool shows **Needs attention**. Do not run **Scale** or **Upgrade** in Infrayard until the cycle finishes.

## Kubernetes upgrades

- **Dedicated action** — available from cluster detail and dashboard actions
- **Shape-aware + allowlist-aware** — upgrade options are filtered to OCI-compatible versions enabled by admin config
- **Sequential minors only** — direct upgrades allow same/next minor only; skip-minor upgrades are blocked with explicit error
- **Control plane + node-pool target update** — upgrade action updates cluster Kubernetes and node-pool target version/image
- **Basic upgrade behavior** — existing workers keep the old version until you [replace them](#replace-workers-in-a-basic-cluster)
- **Enhanced upgrade behavior** — after the control plane, Infrayard replaces the workers of each node pool
- **Tier guidance in UI** — Basic and Enhanced show upgrade-specific notes with rollout guidance

### Automatic worker replacement in an Enhanced cluster

During a Kubernetes upgrade of an Enhanced cluster, Infrayard turns on node pool cycling with **Maximum surge** `1` and **Maximum unavailable** `0`. Each pool gets one extra node. When it is active, OKE cordons, drains and removes one old node, and repeats this until every worker is replaced. Pools are replaced at the same time, so the tenancy needs room for one extra node per pool. Each extra node is billed while it runs.

The cluster stays in the upgrading state, and the job stays open, until every worker is active on the new version. Plan several minutes per node on top of the control plane upgrade.

If OKE reports a problem with a node pool, or nothing changes for too long, the job ends as failed. A PodDisruptionBudget that blocks a drain and a tenancy without capacity for the extra node are the usual causes. The control plane is upgraded, the cluster keeps running, and the workers that were not replaced keep the old version. Fix the cause, then [cycle the node pool](#cycle-workers-in-an-enhanced-cluster) in the OCI Console.

## Expiry and cleanup

A time-to-live can be set for temporary clusters. When its TTL is reached, Infrayard starts the destroy workflow. Use TTL deliberately and check how it interacts with your protected-cluster policy. Activity includes expiry warnings at 24 hours, 4 hours and 1 hour remaining.

Scaling a Basic cluster to zero worker nodes can pause compute use, but does not guarantee a zero Oracle bill: retained resources and other services can still be charged.

Review [operating responsibilities](/docs/operations/) before production changes.
