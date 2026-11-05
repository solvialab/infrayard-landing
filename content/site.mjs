// Commercial terms live here. Run `npm run build` after changing them.
export const site = {
  name: 'Infrayard',
  origin: 'https://www.infrayard.eu',
  company: 'Solvia Lab s.r.o.',
  email: 'hello@infrayard.eu',
  supportEmail: 'support@infrayard.eu',
  updated: '2026-10-17',
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
  { question: 'What do we need to deploy Infrayard?', answer: 'A supported Kubernetes environment, OCI credentials and permissions, Keycloak (bundled or your existing one) and the required network connectivity. Your onboarding includes a review of these prerequisites.', link: '/docs/requirements/', label: 'View deployment requirements' },
  { question: 'Can we use our existing network?', answer: 'Yes. Supported configurations can use existing OCI compartments, VCNs and subnets. Routing, permissions and endpoint connectivity must meet the documented requirements.', link: '/docs/networking/', label: 'Review network configurations' },
  { question: 'Does Infrayard deploy our applications?', answer: 'Infrayard focuses on OKE infrastructure and cluster lifecycle workflows. Application deployment and workload operations remain part of your existing delivery process.', link: '/docs/requirements/#product-scope', label: 'See the supported scope' },
  { question: 'How do we get started?', answer: 'Request a demo to see the product and discuss your environment. You can then start a monthly production subscription or arrange an optional guided evaluation.', link: '/docs/subscription/', label: 'Read subscription and evaluation details' },
];

export const docs = [
  { slug: '', file: 'overview', title: 'Overview', group: 'Start here', description: 'Evaluate, deploy and operate Infrayard in your OCI environment.' },
  { slug: 'architecture', file: 'architecture', title: 'Architecture', group: 'Evaluate', description: 'Components, Terraform execution, state storage and the customer tenancy boundary.' },
  { slug: 'requirements', file: 'requirements', title: 'Requirements and compatibility', group: 'Evaluate', description: 'Deployment prerequisites, supported cluster tiers and product scope.' },
  { slug: 'security', file: 'security', title: 'Security and access', group: 'Evaluate', description: 'Identity, roles, OCI credentials, Kubernetes access and data boundaries.' },
  { slug: 'networking', file: 'networking', title: 'Networking and existing infrastructure', group: 'Evaluate', description: 'Private and restricted public endpoints, BYON combinations, routing and ownership.' },
  { slug: 'installation', file: 'installation', title: 'Installation', group: 'Deploy and use', description: 'Prepare your OCI environment, install with Helm and verify your first workflow.' },
  { slug: 'cluster-lifecycle', file: 'cluster-lifecycle', title: 'Cluster lifecycle', group: 'Deploy and use', description: 'Create, access, scale, upgrade and clean up OKE clusters.' },
  { slug: 'administration', file: 'administration', title: 'Administration', group: 'Deploy and use', description: 'Configure templates, roles, resource limits, approvals, cost estimates and audit records.' },
  { slug: 'operations', file: 'operations', title: 'Operations, upgrades and recovery', group: 'Operate', description: 'Plan platform upgrades, backups and recovery with clear operating responsibilities.' },
  { slug: 'troubleshooting', file: 'troubleshooting', title: 'Troubleshooting and support', group: 'Operate', description: 'Diagnose deployment, connectivity, identity and lifecycle issues.' },
  { slug: 'subscription', file: 'subscription', title: 'Subscription, billing and licensing', group: 'Reference', description: 'Monthly and annual Business plans, founding pricing, evaluation and commercial access.' },
  { slug: 'releases', file: 'releases', title: 'Releases and roadmap', group: 'Reference', description: 'Available capabilities, versioned delivery and separately identified roadmap items.' },
];

export const money = value => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
