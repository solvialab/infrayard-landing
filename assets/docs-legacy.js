(() => {
  // Preserve links from the previous two-page, hash-routed documentation.
  // section-links.js has already taken the hash out of the address.
  const hash = window.__initialSection ?? decodeURIComponent(location.hash.slice(1));
  if (!hash) return;
  const parts = hash.split('/');
  const page = parts[0];
  const heading = parts.length > 1 ? parts.slice(1).join('/') : (['readme', 'features'].includes(page) ? '' : page);
  const exact = {
    'table-of-contents': '/docs/',
    '1-quick-start': '/docs/installation/',
    'existing-oke-cluster-recommended': '/docs/installation/#choose-your-deployment-path',
    'single-node-k3s': '/docs/installation/#choose-your-deployment-path',
    'oci-marketplace-planned': '/docs/releases/#planned-work',
    '2-user-guide': '/docs/cluster-lifecycle/',
    '3-admin-guide': '/docs/administration/',
    '4-cluster-tiers': '/docs/cluster-lifecycle/#cluster-tiers',
    '5-resource-limits': '/docs/administration/#resource-limits',
    '6-access--kubeconfig-and-ssh': '/docs/security/#kubernetes-access',
    '5-access--kubeconfig-and-ssh': '/docs/security/#kubernetes-access',
    '7-networking': '/docs/networking/',
    '8-testing--ci': '/docs/releases/#versioned-delivery',
    '9-deployment-phases': '/docs/releases/',
    '10-license': '/docs/subscription/#licence-and-delivery',
    'kubeconfig': '/docs/security/#kubernetes-access',
    'ssh-key': '/docs/security/#ssh-access',
    'self-service-cluster-provisioning': '/docs/cluster-lifecycle/#deploying-a-cluster',
    'cluster-templates': '/docs/administration/#cluster-templates',
    'cost-visibility-finops': '/docs/administration/#cost-estimates',
    'scaling': '/docs/cluster-lifecycle/#scaling-a-cluster',
    'cluster-lifecycle': '/docs/cluster-lifecycle/',
    'identity-and-access': '/docs/security/#identity-and-roles',
    'resource-limits': '/docs/administration/#resource-limits',
    'users--limits': '/docs/administration/#users-limits',
    'admin-panel': '/docs/administration/',
    'architecture': '/docs/architecture/',
    'testing--ci': '/docs/releases/#versioned-delivery',
    'deployment-options': '/docs/requirements/#deployment-options',
    'marketplace-features-planned': '/docs/releases/#planned-work',
  };
  const lifecycle = ['signing-in', 'deploying-a-cluster', 'scaling-a-cluster', 'destroying-a-cluster', 'activity', 'cluster-detail', 'kubernetes-upgrades'];
  const admin = ['all-clusters', 'users--limits', 'configuration', 'requests', 'audit-log'];
  const network = ['default-setup', 'kubernetes-api-endpoint-access', 'bringing-your-own-network', 'custom-security-rules'];
  let target = exact[heading];
  if (!target && lifecycle.includes(heading)) target = `/docs/cluster-lifecycle/#${heading}`;
  if (!target && admin.includes(heading)) target = `/docs/administration/#${heading}`;
  if (!target && network.includes(heading)) target = `/docs/networking/#${heading}`;
  if (!target && page === 'features') target = '/docs/requirements/#product-scope';
  if (!target && page === 'readme') target = '/docs/';
  if (target) location.replace(target);
})();
