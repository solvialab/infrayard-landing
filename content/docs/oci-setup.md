# Prepare OCI

Infrayard creates OKE clusters with Terraform under one OCI user. This page creates that user, its permissions, an API key, the Terraform state bucket and the S3 key for the bucket. Every installation path needs these steps. Plan about 20 minutes in the OCI Console.

At the end you have the values from the [checklist](#values-checklist).

## 1. Choose the anchor compartment

Infrayard creates everything it manages **under one compartment**, the anchor. By default each cluster gets its own child compartment with its network and node pools; a cluster can also use an existing compartment inside the anchor.

- Create a dedicated compartment, for example `infrayard`, or choose an existing one.
- Note its **OCID** (Identity & Security → Compartments → your compartment).
- Note its **name path**, which the policies use. For a nested compartment, write it with colons, for example `platform:infrayard`.

Administrators can switch the anchor and region later in **Admin → Configuration**. The OCI user can only manage what the policies below allow.

## 2. Create the user and group

In **Identity & Security → Domains → Default domain**:

1. **Groups → Create group**, name `InfrayardServiceGroup`.
2. **Users → Create user**: first name `Infrayard`, last name `Service`, username `infrayard-svc`. An e-mail address is required; use a team mailbox. Clear **Use the email address as the username**.
3. Open the user, **Groups → Assign user to groups**, select `InfrayardServiceGroup`.
4. Copy the **user OCID** from the user's page.

The user does not need a console password.

## 3. Add the policies

**Identity & Security → Policies**, select the **root compartment**, then **Create policy**. Name it `infrayard-service`, open the **manual editor** and paste the statements. Replace `infrayard` with your compartment name path.

```text
Allow group InfrayardServiceGroup to manage cluster-family in compartment infrayard
Allow group InfrayardServiceGroup to manage virtual-network-family in compartment infrayard
Allow group InfrayardServiceGroup to manage instance-family in compartment infrayard
Allow group InfrayardServiceGroup to manage compartments in compartment infrayard
Allow group InfrayardServiceGroup to manage object-family in compartment infrayard
Allow group InfrayardServiceGroup to read all-resources in tenancy
Allow group InfrayardServiceGroup to read tenancies in tenancy
Allow group InfrayardServiceGroup to inspect compartments in tenancy
Allow group InfrayardServiceGroup to use tag-namespaces in tenancy
Allow service OKE to manage all-resources in tenancy
```

What each part is for:

| Statements | Why |
| --- | --- |
| `cluster-family`, `virtual-network-family`, `instance-family` | Create, scale, upgrade and delete OKE clusters, their VCNs and worker nodes |
| `compartments` | Create one child compartment per cluster and remove it on destroy |
| `object-family` | Read and write Terraform state in the bucket from step 5 |
| `read all-resources`, `read tenancies`, `inspect compartments` | List regions, shapes, Kubernetes versions, images and existing networks |
| `use tag-namespaces` | Required when your tenancy applies tag defaults to new resources. Infrayard itself sets free-form tags |
| `Allow service OKE …` | Lets the OKE service itself work in the tenancy. Add it once per tenancy; skip it if it already exists |

If the group lives in a domain other than **Default**, write it as `group 'MyDomain'/'InfrayardServiceGroup'`.

Keep [existing VCNs and subnets](/docs/networking/#bringing-your-own-network) that clusters should use inside the anchor compartment; the policies above then cover them.

## 4. Create the API key

1. Open the `infrayard-svc` user → **API keys → Add API key**.
2. Select **Generate API key pair**, click **Download private key** and save it as `oci_api_key.pem`.
3. Click **Add**. The configuration preview shows `user`, `fingerprint`, `tenancy` and `region`. Note all four.

The private key is the most sensitive item of the installation. Store it in your secret manager and do not e-mail it.

## 5. Create the Terraform state bucket

1. **Storage → Object Storage → Buckets**, select the **anchor compartment**, then **Create bucket**.
2. Name: `infrayard-tfstate`. Keep the default **Standard** tier and enable **Object versioning**. Versioning keeps earlier state versions if something goes wrong.
3. Note the **namespace** shown on the bucket page (also: `oci os ns get`).

Use the same region as the one in the API key preview.

## 6. Create the S3 key for the bucket

Terraform reaches the bucket through the S3-compatible API, which needs its own key.

1. Open the `infrayard-svc` user → **Customer secret keys → Generate secret key**, name `infrayard-tfstate`.
2. Copy the **secret key** right away. OCI shows it only once.
3. Copy the **access key** from the list.

## Check the setup (optional)

With the OCI CLI configured for the new user (`~/.oci/config` with the key from step 4), these commands must succeed:

```bash
oci iam compartment get --compartment-id <anchor-compartment-ocid>
oci ce cluster-options get --cluster-option-id all --query 'data."kubernetes-versions"'
oci os object list --bucket-name infrayard-tfstate
```

Infrayard runs the same kind of calls when an administrator opens **Admin → Configuration** and syncs shapes and versions.

## Values checklist

| Value | Example | Where it comes from |
| --- | --- | --- |
| Tenancy OCID | `ocid1.tenancy.oc1..aaaa…` | API key preview |
| User OCID | `ocid1.user.oc1..aaaa…` | Step 2 |
| Fingerprint | `12:34:56:…` | API key preview |
| Region | `eu-frankfurt-1` | API key preview |
| Private key file | `oci_api_key.pem` | Step 4 |
| Anchor compartment OCID | `ocid1.compartment.oc1..aaaa…` | Step 1 |
| Object Storage namespace | `frxyz1abcd` | Step 5 |
| State bucket | `infrayard-tfstate` | Step 5 |
| S3 access key and secret key | `0a1b2c…` | Step 6 |

Continue with your installation path: [Kubernetes](/docs/install-kubernetes/) or [single VM](/docs/install-vm/).
