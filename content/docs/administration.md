# Administration

Administrators configure the approved options and operating boundaries available to each team. Review [security and access](/docs/security/) for the identity and privilege model.

Admin access is granted by the admin role in Keycloak (`admin` in the bundled realm; with your own Keycloak a realm role, client role or group you choose, see [roles](/docs/keycloak/#roles)). Admins see an **Admin** panel in the top navigation.

## All clusters

A full view of every cluster across all users — status, owner, CIDR, K8s version, tier, resource counts, estimated cost (monthly + hourly), and age. The stats cards show online, provisioning, upgrading k8s, destroying, failed, total, CIDRs used, and monthly spend. From this view admins can:

- Click **Details** on any cluster to open its full detail view including kubeconfig and SSH key download
- Click **Scale** on Active/Error clusters to adjust pools, nodes, and per-node resources
- Click **Upgrade k8s** on Active/Error clusters to upgrade Kubernetes version
- Click **Destroy** to destroy any cluster regardless of owner
- Click **View logs** while an operation is running or after a failure
- Click **New Cluster** to provision a cluster outside of normal user quotas

## Users & limits

Lists every user who has signed into Infrayard. For each user, admins can:

- View current cluster count and active limit
- View resolved effective limits (per-user override if set, otherwise global default)
- Click **Edit Limits** to set per-user overrides for any combination of: cluster limit, pool max, node max, OCPU, RAM, storage, and cluster tier
- Reset a user's overrides back to global defaults; direct admin limit edits and resets create user Activity notifications
- Reset all overrides at once to revert the user to global platform defaults

Limit changes take effect on the user's next page load or login — no restart required.

## Configuration

Platform-wide settings manageable at runtime — no redeployment needed:

| Setting | Description |
|---|---|
| Cluster tier | Basic (free), Enhanced (Oracle's current Enhanced control-plane rate), or Both — applies to all new clusters; "Both" lets the user pick per cluster on the deploy form |
| Cluster limit | Default max active clusters per user |
| Node pool limit | Max pools per cluster |
| Nodes per pool | Max nodes per pool |
| OCPU / RAM / Storage | Max compute per node |
| CIDR pool | Add, remove, and enable/disable /24 ranges available for cluster allocation |
| VM shapes | Sync from OCI, plus add/remove/enable/disable shapes in the deploy form |
| K8s versions | Add, remove, and enable/disable Kubernetes versions |
| Node images | Add, remove, and enable/disable OCI compute images for worker node pools |

> Note: Shape and image availability is region- and tenancy-specific. In **Admin → Configuration**, use **Sync from OCI** in the VM Shapes section first, then curate/label as needed. For CLI verification, fetch current OKE node pool options in the target region:
>
> `oci ce node-pool-options get --node-pool-option-id all --profile <PROFILE>`
>
> Use the returned `shapes` and `sources` lists as the source of truth for VM shapes and node images.
>
> If **Sync from OCI** is unavailable, Infrayard keeps existing shape config unchanged and you can continue with manual curation from the CLI output above. Sync uses the API pod OCI service account credentials/policies (not the browser/user profile).
>
> K8s version freshness: OCI can publish new OKE patch versions after Infrayard is deployed. The platform now auto-syncs available OKE versions in the background (default daily) so admin config stays current without anyone clicking **Refresh from OCI**. Newly-fetched versions land disabled by default — admins still curate which versions users may deploy. **Refresh from OCI** remains available for on-demand pulls (e.g. before template reviews or upgrade waves). Upgrade recommendation pills use the latest enabled version, so stale enablement can hide available upgrades.
>
> Once a cluster's K8s version falls behind the latest enabled, a separate sweeper (default hourly) emits one Activity entry plus one email to the cluster owner per (cluster, target version) pair, so the owner is told about new upgrade options even when not actively logged in. The notification is idempotent — it does not re-fire for the same target — and the marker auto-resets after the cluster is upgraded, ready to fire again on the next enabled-version bump.
>
> Deploy form behavior: Kubernetes versions are filtered by the currently selected VM shape and region. Users only see versions that are both OCI-compatible for that shape (based on OKE node image availability) and enabled in Admin Configuration. If compatibility lookup is unavailable, the K8s list is not shown (fail-closed) and deploy is blocked until validation succeeds. If a version is missing, either enable it in Admin Configuration or choose a shape that supports it.

## Cluster templates

Templates are administrator-approved configurations. Template-defined resource values can exceed a user's personal custom-deployment limits; the locked fields prevent the user from editing those pre-approved values. Review template scope and required roles accordingly.

Dedicated admin page for creating and managing cluster templates — pre-configured profiles that appear as selectable cards on the deploy form. Templates encode:

| Setting | Description |
|---|---|
| K8s version | Pre-selected Kubernetes version (optional — user selects if not set) |
| VM shape | Pre-selected node shape (optional) |
| Node image | Pre-selected OCI compute image (optional — auto-selects latest OKE image if not set) |
| Node pools | Pre-defined pool layout — name, node count, OCPU, RAM, storage per pool |
| Tier default | Suggested cluster tier — Basic or Enhanced (suggestion only, not enforced) |
| TTL | Optional time-to-live in hours — when reached, Infrayard automatically starts cluster destroy/cleanup |
| Destroy protection | When enabled, the "Destroy" button on the user's cluster opens a "Request destroy" modal instead. Requests land in Admin → Requests (with a live count badge in the nav) where an admin approves, reviews the destroy plan, then confirms force-destroy, or denies with a note |
| Required role | Keycloak role (or group, depending on your role source) — only users with it can see and use the template. Leave empty for all users |
| Sort order | Controls display position in the deploy form (lower numbers appear first) |

The templates table shows estimated monthly and hourly cost per template. The add/edit modal includes a live cost preview that updates as you change pools, shape, or tier.

Template modal behavior: when a VM shape is selected, the K8s dropdown is filtered to versions OCI reports as compatible for that shape in the current region (node-image-backed compatibility). If compatibility lookup is unavailable, no fallback list is shown (fail-closed). Template save/update re-validates shape+K8s compatibility and blocks incompatible combinations.

**Environment-tier gating** — use `required_role` to control which teams can deploy which cluster sizes. For example, create a `DEV — Small` template visible to everyone, a `TEST — Medium` template requiring a `testing` role, a `UAT — Large` template requiring a `uat` role, and a `PROD — HA` template requiring a `production` role. Users only see the templates they have access to on the deploy form. Create the roles in Keycloak under **Realm roles** (or as client roles or groups, matching your [role source](/docs/keycloak/#roles)) and assign them to the relevant users.

Templates can be created, edited, enabled/disabled, and permanently deleted. Disabled templates no longer appear in the deploy form but remain referenced by existing clusters. Permanently deleting a template removes it from the admin panel entirely.

## Requests

Approval queue for user-submitted destroy requests on protection-enabled clusters and limit-increase requests for per-user overrides. The admin nav shows live request count badges that refresh every 5 seconds (hidden when zero pending). Filter by Pending / Approved / Denied / All. Each pending row has a **Review** action. When SMTP is configured, request submit/review events also send info-only email pings: admins get submit notifications, and users get submit/approve/deny notifications.

For destroy requests, the review modal lets the admin:
- Add an optional admin note
- Click **Approve & review plan** — the normal destroy plan opens. After the admin confirms the plan, the request is marked `approved` and `force=true` destroy starts. Audit-logged as `destroy-request:approve`.
- Click **Deny** — the note is surfaced on the user's cluster card as a red "Destroy denied" pill (with the note in the tooltip). Audit-logged as `destroy-request:deny`.

For limit requests, the review modal lets the admin grant the requested values or adjust them before approval. Approved values are written into the user's per-user overrides and the user receives an Activity notification. Denials can include an admin note and are audit-logged as `limit-request:deny`. Request emails include the requester, request id, comment, requested values, and granted values where applicable.

Approval is row-locked to prevent two admins double-approving. Bypass path: admins can still force-destroy any protected cluster directly via `?force=true` from the All Clusters table — useful for incident response.

## Audit Log

Every provisioning, scaling, upgrade, and destroy operation is recorded with user identity, operation type, cluster name, outcome, and duration — including `destroy-request:*` and `limit-request:*` events from the Requests queue. The log is append-only and filterable by user, operation, and date range.

## Resource limits

Limits cascade: global config sets the baseline for all users, per-user overrides take precedence when set.

| Limit | Global default | Per-user override |
|---|---|---|
| Clusters per user | Inherited from config | ✅ |
| Node pools per cluster | 3 | ✅ |
| Nodes per pool | 3 | ✅ |
| OCPU per node | 1 | ✅ |
| RAM per node | 12 GB | ✅ |
| Storage per node | 50 GB | ✅ |
| Cluster tier | BASIC_CLUSTER | ✅ |

The deploy form always reflects the user's current effective limits. If a user hits a limit, the form shows a clear message with a link to contact support. Limits can be raised at any time by an admin without restarting the platform.

## Cost estimates

Cost estimates are visible in deployment forms, cluster cards, cluster details, templates and administrator views. They use configured resource rates with optional overrides for custom contracts. The breakdown covers the modelled compute, worker storage and control-plane components; it is not a reconciliation of your Oracle invoice.

Review the rates and included components against your contract. Networking, load balancers, other services and the platform host can add charges outside the cluster estimate. Administrators can review estimated spend across active clusters. Estimates do not enforce a guaranteed monetary budget and do not include the Infrayard subscription.
