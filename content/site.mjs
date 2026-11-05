// Commercial terms live here. Run `npm run build` after changing them.
export const site = {
  name: 'Infrayard',
  origin: 'https://www.infrayard.eu',
  company: 'Solvia Lab s.r.o.',
  email: 'hello@infrayard.eu',
  supportEmail: 'support@infrayard.eu',
  updated: '2026-11-05',
  title: 'Infrayard | OKE Self-service Platform for Oracle Cloud',
  description: 'Provision and operate Oracle Kubernetes Engine clusters through a self-service portal. Control templates, access and resource limits inside your OCI tenancy.',
};

export const pricing = {
  currency: 'EUR',
  business: { monthly: 3000, annual: 30000 },
  founding: { monthly: 1800, annual: 18000, discount: 40, months: 12, customers: 5 },
  enterprise: { monthlyFrom: 6500 },
  evaluation: { fee: 1500, days: 30, conversionDays: 30 },
};

export const faqs = [
  { question: 'Do engineers need to write Terraform?', answer: 'Engineers use the portal and approved templates. Platform administrators configure the OCI environment and can inspect the underlying Terraform execution logs.', link: '/docs/cluster-lifecycle/', label: 'Explore cluster workflows' },
  { question: 'What do we need to deploy Infrayard?', answer: 'A Kubernetes cluster (OKE, k3s or another distribution) or a single Linux VM, an OCI user with the documented policies, a state bucket and a DNS name. Keycloak is included, or you connect your existing one. The installation guides walk through every step.', link: '/docs/installation/', label: 'Read the installation guide' },
  { question: 'Can we use our existing network?', answer: 'Yes. Supported configurations can use existing OCI compartments, VCNs and subnets. Routing, permissions and endpoint connectivity must meet the documented requirements.', link: '/docs/networking/', label: 'Review network configurations' },
  { question: 'Does Infrayard deploy our applications?', answer: 'Infrayard focuses on OKE infrastructure and cluster lifecycle workflows. Application deployment and workload operations remain part of your existing delivery process.', link: '/docs/requirements/#product-scope', label: 'See the supported scope' },
  { question: 'How do we get started?', answer: 'Request a demo to see the product and discuss your environment. You can then start a monthly production subscription or arrange an optional guided evaluation.', link: '/docs/subscription/', label: 'Read subscription and evaluation details' },
];

export const docs = [
  { slug: '', file: 'overview', title: 'Overview', group: 'Start here', description: 'What Infrayard does and where to find each topic.' },
  { slug: 'architecture', file: 'architecture', title: 'Architecture', group: 'Evaluate', description: 'Components, the request flow, state storage and network connections.' },
  { slug: 'requirements', file: 'requirements', title: 'Requirements and compatibility', group: 'Evaluate', description: 'Hosts, OCI, network ports, identity, OKE tiers and product scope.' },
  { slug: 'security', file: 'security', title: 'Security and access', group: 'Evaluate', description: 'Keycloak roles, OCI credentials, kubeconfig rights, SSH keys and audit records.' },
  { slug: 'networking', file: 'networking', title: 'Networking and existing infrastructure', group: 'Evaluate', description: 'Kubernetes API access modes, existing VCNs, subnets and compartments, and the anchor compartment.' },
  { slug: 'installation', file: 'installation', title: 'Installation', group: 'Install', description: 'Choose between Kubernetes and a single VM, and what you need for each.' },
  { slug: 'oci-setup', file: 'oci-setup', title: 'Prepare OCI', group: 'Install', description: 'Create the OCI user, policies, API key, Terraform state bucket and S3 key.' },
  { slug: 'install-kubernetes', file: 'install-kubernetes', title: 'Install on Kubernetes', group: 'Install', description: 'Install Infrayard with Helm on an existing OKE, k3s or other Kubernetes cluster.' },
  { slug: 'install-vm', file: 'install-vm', title: 'Install on a single VM', group: 'Install', description: 'Run Infrayard with Docker Compose and automatic HTTPS on one Linux VM.' },
  { slug: 'keycloak', file: 'keycloak', title: 'Use your own Keycloak', group: 'Install', description: 'Sign users in through a realm of your existing Keycloak, with roles or groups.' },
  { slug: 'private-access', file: 'private-access', title: 'Private access (VPN only)', group: 'Install', description: 'Make the portal reachable only from your VPN or company network.' },
  { slug: 'cluster-lifecycle', file: 'cluster-lifecycle', title: 'Cluster lifecycle', group: 'Use', description: 'Create, access, scale, upgrade and clean up OKE clusters.' },
  { slug: 'administration', file: 'administration', title: 'Administration', group: 'Use', description: 'Configure templates, roles, resource limits, approvals, cost estimates and audit records.' },
  { slug: 'operations', file: 'operations', title: 'Operations, upgrades and recovery', group: 'Operate', description: 'Upgrade Infrayard, back up and restore the database, and plan responsibilities.' },
  { slug: 'troubleshooting', file: 'troubleshooting', title: 'Troubleshooting and support', group: 'Operate', description: 'Fix installation, sign-in, network and cluster operation problems.' },
  { slug: 'subscription', file: 'subscription', title: 'Subscription, billing and licensing', group: 'Reference', description: 'Monthly and annual Business plans, founding pricing, evaluation and commercial access.' },
  { slug: 'releases', file: 'releases', title: 'Releases and roadmap', group: 'Reference', description: 'Available capabilities, versioning and separately identified roadmap items.' },
];

export const money = value => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
