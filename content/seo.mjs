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
  publishedAt: null,
};

export const docsTitles = {
  '': 'Infrayard Documentation | OKE Setup, Security and Operations',
  architecture: 'OKE Platform Architecture and Terraform | Infrayard Docs',
  requirements: 'OKE Platform Requirements and Compatibility | Infrayard Docs',
  security: 'OKE Security, Identity and Cluster Access | Infrayard Docs',
  networking: 'OKE Networking, BYON, VCNs and Subnets | Infrayard Docs',
  installation: 'Install Infrayard on Kubernetes or a VM | Infrayard Docs',
  'oci-setup': 'OCI IAM Policies, API Key and State Bucket | Infrayard Docs',
  'install-kubernetes': 'Install Infrayard with Helm on OKE or k3s | Infrayard Docs',
  'install-vm': 'Install Infrayard with Docker Compose on a VM | Infrayard Docs',
  keycloak: 'Connect Infrayard to Your Existing Keycloak | Infrayard Docs',
  'private-access': 'VPN-Only Access to the Infrayard Portal | Infrayard Docs',
  'cluster-lifecycle': 'Provision, Scale and Upgrade OKE Clusters | Infrayard Docs',
  administration: 'OKE Templates, Resource Limits and Approvals | Infrayard Docs',
  operations: 'Platform Operations, Upgrades and Recovery | Infrayard Docs',
  troubleshooting: 'OKE Platform Troubleshooting and Support | Infrayard Docs',
  subscription: 'Infrayard Pricing, Monthly Billing and Licensing | Docs',
  releases: 'Infrayard Releases and Product Roadmap | Docs',
};

export const resourceTitles = {
  'index.html': 'OCI and OKE Platform Engineering Guides | Infrayard',
  'oke-self-service-platform.html': 'OKE Self-service Platform for Oracle Cloud | Infrayard',
  'byon-networking-for-oke.html': 'BYON Networking for OKE: VCNs and Subnets | Infrayard',
  'oke-kubeconfig-access-without-oci-cli.html': 'OKE Kubeconfig Access without Local OCI CLI | Infrayard',
  'internal-developer-platform-for-oracle-cloud.html': 'Internal Developer Platform for Oracle Cloud | Infrayard',
  'internal-developer-platform-for-oracle-kubernetes-engine.html': 'Internal Developer Platform for OKE | Infrayard',
};

export const robotsRules = {
  disallow: ['/.git/', '/.idea/', '/.local-tools/', '/src/', '/content/', '/scripts/', '/tests/', '/dist/'],
};
