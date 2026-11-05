# Operations, upgrades and recovery

You operate the Infrayard installation; Solvia Lab supplies releases, documentation and support. This page covers upgrades, backups, restores and uninstalling, with the commands to run. They are the same on OKE and k3s.

## Responsibilities

| Area | Who |
| --- | --- |
| Host (Kubernetes cluster or k3s VM), ingress, TLS, storage, network | You |
| OCI user, policies and keys | You |
| Backups of the database, secrets and Terraform state | You |
| Applications on the OKE clusters | You |
| Infrayard releases, release notes, documentation, support | Solvia Lab |

## What to back up

| Item | Contains | How |
| --- | --- | --- |
| PostgreSQL database `infrayard` | Clusters, jobs, users, configuration, templates, requests, audit log, SSH keys of the worker nodes and, with the bundled Keycloak, all Keycloak users and settings | [Database backup](#backups), daily |
| Terraform state bucket | The state of every managed cluster | Object versioning on the bucket; optionally a copy to another region |
| Configuration | `values.yaml` and `secrets.yaml` | Your secret manager (`secrets.yaml`) and configuration repository (`values.yaml`) |
| OCI API key | `oci_api_key.pem` | Your secret manager |

Database and state belong together: a restored database must match the clusters that actually exist in OCI. Treat backups as sensitive; they contain SSH private keys and, with the bundled Keycloak, password hashes.

## Backups

The database backup is one file that contains both Infrayard and the bundled Keycloak.

```bash
kubectl exec -n infrayard infrayard-postgresql-0 -c postgresql -- \
  pg_dump -U infrayard -Fc infrayard > infrayard-$(date +%F).dump
```

Copy the files off the host, for example to an Object Storage bucket with `oci os object put`, and delete old ones according to your retention policy.

If you use an external PostgreSQL (`postgresql.enabled: false`), back it up with your database tooling instead.

## Restore

Restore into the same Infrayard version that created the backup, then upgrade if needed. Stop the services that write to the database first.

```bash
kubectl scale deploy -n infrayard infrayard-api infrayard-keycloak --replicas=0
kubectl exec -i -n infrayard infrayard-postgresql-0 -c postgresql -- \
  pg_restore -U infrayard -d infrayard --clean --if-exists --no-owner < infrayard-2026-01-31.dump
kubectl scale deploy -n infrayard infrayard-api infrayard-keycloak --replicas=1
```

Without the bundled Keycloak, leave `infrayard-keycloak` out of the commands.

**On a new host**, start only the database first, so that nothing writes to it before the restore: install with your values and `--set api.replicaCount=0 --set keycloak.replicaCount=0`, restore, then run `helm upgrade` with the same command without these two options.

After a restore, compare the cluster list in the portal with what exists in OCI before you start new operations. A cluster created or destroyed after the backup appears in the wrong state; its Terraform state in the bucket is still correct.

## Upgrade Infrayard

Before you start:

1. Read the release notes of the target version, especially for steps marked as required.
2. Take a [database backup](#backups).
3. Make sure no cluster operation is running (**Admin → All Clusters**).

The API applies database changes automatically when it starts. They cannot be undone by downgrading; a rollback means restoring the backup.

```bash
helm upgrade infrayard oci://registry.gitlab.com/solvialab/infrayard/charts/infrayard \
  --version 1.5.0 -n infrayard -f values.yaml -f secrets.yaml
kubectl get pods -n infrayard -w
```

The chart version selects the image version. Changed configuration or secrets restart the affected pods automatically.

**After the upgrade:** sign in as an administrator and as a regular user, check the cluster list and the Activity history, and run **Sync** in **Admin → Configuration** to confirm OCI access.

**Rollback:** `helm rollback infrayard -n infrayard` returns the previous chart and images. If the new version had already started, also restore the backup taken before the upgrade.

## PostgreSQL and Keycloak versions

The chart pins the PostgreSQL major version (currently 18) and the Keycloak version (currently 26.8). Patch releases arrive with Infrayard upgrades.

A new PostgreSQL major version cannot read the old data directory. When a release moves to a new major version, its notes say so, and the upgrade needs a dump and restore:

1. Take a [database backup](#backups).
2. Stop everything and delete the database volume: `kubectl scale deploy -n infrayard infrayard-api infrayard-keycloak --replicas=0`, then `kubectl delete statefulset infrayard-postgresql -n infrayard` and `kubectl delete pvc data-infrayard-postgresql-0 -n infrayard`.
3. Start the new version with only the database running: the `helm upgrade` command from above with `--set api.replicaCount=0 --set keycloak.replicaCount=0`.
4. [Restore](#restore) the backup with the `pg_restore` command.
5. Start everything: the same `helm upgrade` without the two `--set` options.

Keycloak updates its schema by itself on the first start of a new version.

## OKE clusters are a separate topic

Upgrading Infrayard does not touch your OKE clusters. Kubernetes upgrades of the clusters are done per cluster in the portal; see [cluster lifecycle](/docs/cluster-lifecycle/). Plan them with worker refresh, disruption budgets and temporary extra capacity in mind.

## Uninstall Infrayard

Uninstalling Infrayard does not touch the clusters it created, and only Infrayard can destroy them cleanly: their Terraform state is in the state bucket. Work through the steps in this order.

1. **Destroy the clusters** you no longer need in the portal and wait until each one is destroyed. A destroyed cluster takes its compartment, VCN and node pools with it. Clusters you keep go on running and being billed.
2. **Back up the database** if you may need the history later; see [backups](#backups).
3. **Remove Infrayard.** Helm keeps the PostgreSQL volume; deleting the claim deletes the volume as well, on OKE the 50 GB `oci-bv` block volume. The namespace also holds the registry and OCI key secrets:

   ```bash
   helm uninstall infrayard -n infrayard
   kubectl delete pvc -n infrayard data-infrayard-postgresql-0
   kubectl delete namespace infrayard
   ```

4. **Remove Traefik and cert-manager** if you installed them only for Infrayard in step 1 of the [Kubernetes guide](/docs/install-kubernetes/). When Traefik is removed, OKE deletes its load balancer. cert-manager leaves its CRDs behind; the last command deletes them:

   ```bash
   helm uninstall traefik -n traefik
   helm uninstall cert-manager -n cert-manager
   kubectl delete clusterissuer letsencrypt
   kubectl delete namespace traefik cert-manager
   kubectl get crd -o name | grep 'cert-manager.io$' | xargs kubectl delete
   ```

5. **Check OCI.** On OKE, after a minute or two the load balancer is gone and the block volume is `TERMINATED` in the compartment of the cluster that ran Infrayard:

   ```bash
   oci lb load-balancer list -c <compartment>
   oci bv volume list -c <compartment> --query 'data[].{name:"display-name",state:"lifecycle-state"}'
   ```

6. **Delete the state bucket** once none of its clusters is left. Versioning is on, so `--empty` removes every object version before the bucket:

   ```bash
   oci os bucket delete --bucket-name infrayard-tfstate --empty --force
   ```

7. **Remove the rest by hand** if no other installation uses it: the DNS record of the portal, and the OCI user, group and policy from [OCI setup](/docs/oci-setup/).

If you destroy the cluster that runs Infrayard, remove the load balancer and the volume first (steps 3 to 5). OKE does not delete them with the cluster: the load balancer keeps the VCN from being deleted, and the volume stays and is billed.

## Ending a subscription

Ending the subscription does not stop or delete anything in OCI, and Oracle keeps billing running clusters. Before access ends, destroy the clusters you no longer need, or keep the Terraform state bucket so that they can still be managed. Details are in your agreement; see [billing and licensing](/docs/subscription/#cancellation-and-offboarding).
