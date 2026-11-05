# Prepare OCI

Infrayard creates OKE clusters with Terraform under one OCI user. This page creates that user, its permissions, an API key, the Terraform state bucket and the S3 key for the bucket. Every installation path needs these steps. Plan about 20 minutes in the OCI Console, or use the [OCI CLI variant](#the-same-steps-with-the-oci-cli) below.

You need a user with administrator rights in the tenancy for these steps; Infrayard itself never gets them.

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
| `Allow service OKE …` | Lets the OKE service itself work in the tenancy. Keep it in this policy even if another policy already has it; a duplicate statement does no harm |

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

Use a separate bucket for every Infrayard installation, for example for a test and a production portal. Infrayard stores each cluster's state as `<user name>/<cluster name>.tfstate`, so two installations that share a bucket can overwrite each other's state.

Use the same region as the one in the API key preview.

## 6. Create the S3 key for the bucket

Terraform reaches the bucket through the S3-compatible API, which needs its own key.

1. Open the `infrayard-svc` user → **Customer secret keys → Generate secret key**, name `infrayard-tfstate`.
2. Copy the **secret key** right away. OCI shows it only once.
3. Copy the **access key** from the list.

## The same steps with the OCI CLI

Instead of the Console you can run steps 1–6 with the OCI CLI, signed in as a tenancy administrator. The commands were tested in this order; they keep the generated values in shell variables and write the key files to the current directory. Run them in an empty directory that only you can read (`mkdir -m 700 infrayard-oci && cd infrayard-oci`).

```bash
# Your tenancy OCID, as in ~/.oci/config of the administrator
T=ocid1.tenancy.oc1..aaaa…

# 1. Anchor compartment (skip and set C=<ocid> to use an existing one)
C=$(oci iam compartment create -c $T --name infrayard \
      --description "Infrayard anchor compartment" \
      --wait-for-state ACTIVE --query data.id --raw-output)

# 2. Group and user, user in the group
G=$(oci iam group create -c $T --name InfrayardServiceGroup \
      --description "Infrayard service user" --query data.id --raw-output)
U=$(oci iam user create -c $T --name infrayard-svc \
      --description "Infrayard service user" --email platform-team@example.com \
      --query data.id --raw-output)
oci iam group add-user --group-id $G --user-id $U

# 3. Policy: save the ten statements from step 3 as a JSON list in policy.json,
#    one string per statement: ["Allow group …", "Allow group …", …]
oci iam policy create -c $T --name infrayard-service \
  --description "Infrayard service user" --statements file://policy.json

# 4. API key: generate it locally and upload the public part
umask 077
openssl genrsa -out oci_api_key.pem 2048
openssl rsa -pubout -in oci_api_key.pem -out oci_api_key_public.pem
FP=$(oci iam user api-key upload --user-id $U \
       --key-file oci_api_key_public.pem --query data.fingerprint --raw-output)

# 5. State bucket with versioning, and the namespace
oci os bucket create -c $C --name infrayard-tfstate --versioning Enabled
NS=$(oci os ns get --query data --raw-output)

# 6. S3 key: "id" is the access key, "key" the secret key (shown only once)
oci iam customer-secret-key create --user-id $U --display-name infrayard-tfstate \
  --query 'data.{access_key:id,secret_key:key}' --output json > s3-key.json

echo "tenancy=$T user=$U fingerprint=$FP compartment=$C namespace=$NS"
```

The last line prints the values for the [checklist](#values-checklist); the S3 key pair is in `s3-key.json`. Store `oci_api_key.pem` and `s3-key.json` in your secret manager and delete the local copies after the installation.

## Check the setup

A new user and API key take **a few minutes** to work in every OCI service. During that time some calls fail with `401 NotAuthenticated` even though everything is set up correctly; in our tests Identity accepted the key first, Container Engine and Object Storage about two minutes later. Wait five minutes before you start the installation or before you look for a mistake.

To check the new user from your workstation, write a CLI configuration file for it (values from the [checklist](#values-checklist)):

```ini
# infrayard-oci-config
[DEFAULT]
user=ocid1.user.oc1..aaaa…
fingerprint=12:34:56:…
tenancy=ocid1.tenancy.oc1..aaaa…
region=eu-frankfurt-1
key_file=/full/path/to/oci_api_key.pem
```

These three commands must succeed. They print the compartment name, a list of Kubernetes versions, and an empty list for the new bucket:

```bash
oci --config-file infrayard-oci-config iam compartment get \
  --compartment-id <anchor-compartment-ocid> --query data.name --raw-output
oci --config-file infrayard-oci-config ce cluster-options get \
  --cluster-option-id all --query 'data."kubernetes-versions"'
oci --config-file infrayard-oci-config os object list --bucket-name infrayard-tfstate
```

`NotAuthorizedOrNotFound` (404) instead means a policy is missing or names the wrong group or compartment. Infrayard runs the same kind of calls when an administrator syncs shapes and versions in **Admin → Configuration**.

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

Continue with [Install on Kubernetes](/docs/install-kubernetes/).
