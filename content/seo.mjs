// Editorial dates are deliberate content updates, never the clock time of a build.
// Set publishedAt to the actual first public release date of the music version
// when publishing it. Until then, do not claim a public upload date in JSON-LD.
export const demo = {
  path: '/demo/',
  title: 'Infrayard Demo | OKE Cluster Provisioning Walkthrough',
  name: 'Infrayard: self-service OKE cluster deployment',
  description: 'Watch an Infrayard product walkthrough: choose an OKE template, review estimated costs and follow cluster provisioning inside your own Oracle Cloud tenancy.',
  contentPath: '/assets/infrayard-demo-with-music.mp4',
  thumbnailPath: '/assets/product-poster.jpg',
  duration: 'PT2M59.267S',
  seconds: 179,
  publishedAt: '2026-10-17', // first public deploy of the music version (commit 3555ead)
};

export const docsTitles = {
  '': 'Infrayard Documentation | OKE Setup, Security and Operations',
  architecture: 'OKE Platform Architecture and Terraform | Infrayard Docs',
  requirements: 'OKE Platform Requirements and Compatibility | Infrayard Docs',
  security: 'OKE Security, Identity and Cluster Access | Infrayard Docs',
  networking: 'OKE Networking, BYON, VCNs and Subnets | Infrayard Docs',
  installation: 'Install Infrayard on OKE or k3s | Infrayard Docs',
  'oci-setup': 'OCI IAM Policies, API Key and State Bucket | Infrayard Docs',
  'install-kubernetes': 'Install Infrayard with Helm on OKE or k3s | Infrayard Docs',
  keycloak: 'Connect Infrayard to Your Existing Keycloak | Infrayard Docs',
  'private-access': 'VPN-Only Access to the Infrayard Portal | Infrayard Docs',
  'cluster-lifecycle': 'Provision, Scale and Upgrade OKE Clusters | Infrayard Docs',
  administration: 'OKE Templates, Resource Limits and Approvals | Infrayard Docs',
  operations: 'Platform Operations, Upgrades and Recovery | Infrayard Docs',
  troubleshooting: 'OKE Platform Troubleshooting and Support | Infrayard Docs',
  subscription: 'Infrayard Pricing, Monthly Billing and Licensing | Docs',
  releases: 'Infrayard Releases and Product Roadmap | Docs',
};

// Search snippets for docs pages (110-160 characters). The shorter
// docs[].description in site.mjs stays the on-page summary and navigation text.
export const docsDescriptions = {
  '': "Infrayard documentation: requirements, architecture, OCI setup, installation on OKE or k3s, Keycloak sign-in, cluster lifecycle, operations and support.",
  architecture: "How Infrayard works: portal, API, Terraform runner, PostgreSQL and Keycloak run in your environment and create OKE clusters in your own OCI tenancy.",
  requirements: "What Infrayard needs: an OKE cluster or a k3s VM, an OCI user and policies, network ports, Keycloak, supported OKE tiers and the product scope.",
  security: "Infrayard security model: Keycloak roles, the OCI service user and API key, Kubernetes access rights, SSH access, audit, approvals and network exposure.",
  networking: "OKE networking with Infrayard: Kubernetes API endpoint modes, CIDR allowlists, existing VCNs, subnets and compartments, and the anchor compartment.",
  installation: "Install Infrayard with Helm on OKE for production or on a k3s VM for an evaluation: what the onboarding e-mail contains, the steps and what to prepare.",
  'oci-setup': "Prepare OCI for Infrayard step by step: service user, group, IAM policies, API key, Terraform state bucket and S3 key, in the Console or with the OCI CLI.",
  'install-kubernetes': "Install Infrayard with Helm on OKE, k3s or another Kubernetes cluster: ingress, cert-manager, registry login, secrets, values files, DNS and first sign-in.",
  keycloak: "Connect Infrayard to your existing Keycloak: Helm values, client import, roles or groups, a private CA, an internal cluster address and sign-in troubleshooting.",
  'private-access': "Keep the Infrayard portal off the internet: a private address or a public address with an allowlist, certificates, DNS, Keycloak and OKE API endpoints.",
  'cluster-lifecycle': "Create, scale, upgrade and destroy OKE clusters in Infrayard: deployment, Basic and Enhanced tiers, Kubernetes upgrades, Activity, expiry and cleanup.",
  administration: "Administer Infrayard: all clusters, users and limits, configuration, cluster templates, requests and approvals, the audit log and cost estimates.",
  operations: "Operate Infrayard: responsibilities, backup and restore of PostgreSQL and Terraform state, upgrades, PostgreSQL and Keycloak versions, uninstall and offboarding.",
  troubleshooting: "Fix Infrayard problems: installation and registry errors, OCI authentication, Keycloak sign-in and roles, missing versions, networks, nodes and kubectl access.",
  subscription: "Infrayard pricing: what each plan includes, Business monthly or annual, the founding discount, Enterprise, the optional paid evaluation and licensing.",
  releases: "Capabilities in the current Infrayard release, how the Helm chart and images share one version, and planned roadmap work kept separate.",
};

export const resourceTitles = {
  'index.html': 'OCI and OKE Platform Engineering Guides | Infrayard',
  'oke-self-service-platform.html': 'OKE Self-service Platform for Oracle Cloud | Infrayard',
  'byon-networking-for-oke.html': 'BYON Networking for OKE: VCNs and Subnets | Infrayard',
  'oke-kubeconfig-access-without-oci-cli.html': 'OKE Kubeconfig Access without Local OCI CLI | Infrayard',
  'internal-developer-platform-for-oracle-cloud.html': 'Internal Developer Platform for Oracle Cloud | Infrayard',
  'internal-developer-platform-for-oracle-kubernetes-engine.html': 'Internal Developer Platform for OKE | Infrayard',
};

// IndexNow key; the build publishes it as /<key>.txt to prove ownership of the host.
export const indexNowKey = '7f37133c7e3ef77cd4fd2def25b8a250';

export const robotsRules = {
  disallow: ['/.git/', '/.idea/', '/.local-tools/', '/src/', '/content/', '/scripts/', '/tests/', '/dist/'],
};
