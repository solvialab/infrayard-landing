// Slovak version of the landing page, demo page and legal pages.
// The documentation and the resource guides stay in English only.
// Prices and terms come from content/site.mjs; run `npm run build` after changes.

export const skSite = {
  title: 'Infrayard | Samoobslužná platforma OKE pre Oracle Cloud',
  description: 'Samoobslužný portál pre Oracle Kubernetes Engine vo vašej OCI tenancy. Prístupové údaje OCI, stav Terraformu a auditné záznamy zostávajú u vás.',
};

export const skDemo = {
  path: '/sk/demo/',
  title: 'Ukážka Infrayard | Vytvorenie OKE klastra krok za krokom',
  name: 'Infrayard: samoobslužné nasadenie OKE klastra',
  description: 'Pozrite si ukážku Infrayard: výber šablóny OKE, kontrola odhadovaných nákladov a priebeh vytvárania klastra vo vašej vlastnej Oracle Cloud tenancy.',
};

// Pages that exist in both languages: [English path, Slovak path].
export const translatedPages = [
  ['/', '/sk/'],
  ['/demo/', skDemo.path],
  ['/legal/privacy.html', '/sk/legal/privacy.html'],
  ['/legal/terms.html', '/sk/legal/terms.html'],
  ['/legal/cookies.html', '/sk/legal/cookies.html'],
];
export const alternatesFor = path => {
  const pair = translatedPages.find(paths => paths.includes(path));
  return pair ? { en: pair[0], sk: pair[1] } : undefined;
};
export const languageOf = path => path.startsWith('/sk/') ? 'sk' : 'en';

export const skFaqs = [
  { question: 'Musia inžinieri písať Terraform?', answer: 'Inžinieri používajú portál a schválené šablóny. Administrátori platformy nastavujú prostredie OCI a môžu si pozrieť logy z behu Terraformu.', link: '/docs/cluster-lifecycle/', label: 'Postupy pre klastre' },
  { question: 'Čo potrebujeme na nasadenie Infrayard?', answer: 'Klaster Kubernetes: OKE pre produkciu alebo k3s na jednom virtuálnom stroji pre evaluáciu. Ďalej používateľa OCI so zdokumentovanými politikami, bucket pre stav Terraformu a DNS meno. Keycloak je súčasťou, alebo pripojíte svoj existujúci. Inštalačné návody vás prevedú každým krokom.', link: '/docs/installation/', label: 'Inštalačný návod' },
  { question: 'Môžeme použiť našu existujúcu sieť?', answer: 'Áno. Podporované konfigurácie môžu využiť existujúce OCI compartmenty, VCN a podsiete. Smerovanie, oprávnenia a dostupnosť endpointov musia spĺňať zdokumentované požiadavky.', link: '/docs/networking/', label: 'Sieťové konfigurácie' },
  { question: 'Nasadzuje Infrayard aj naše aplikácie?', answer: 'Infrayard sa zameriava na infraštruktúru OKE a životný cyklus klastrov. Nasadzovanie aplikácií a prevádzka workloadov zostávajú súčasťou vášho existujúceho procesu dodávania.', link: '/docs/requirements/#product-scope', label: 'Podporovaný rozsah' },
  { question: 'Ako začať?', answer: 'Vyžiadajte si demo: ukážeme vám produkt a prejdeme si vaše prostredie. Potom môžete začať mesačné produkčné predplatné alebo si dohodnúť voliteľnú sprevádzanú evaluáciu.', link: '/docs/subscription/', label: 'Predplatné a evaluácia' },
];

// Structured-data offers on the Slovak landing page: [name, price key, description].
export const skOffers = [
  ['Business mesačne', 'business.monthly', 'Mesačné produkčné predplatné, fakturované mesačne. Zrušiť ho môžete ku koncu zaplateného obdobia.'],
  ['Business ročne', 'business.annual', '12-mesačné produkčné predplatné, platené ročne vopred.'],
  ['Business pre zakladajúcich zákazníkov mesačne', 'founding.monthly', '40 % zľava na Business mesačne počas prvých 12 mesiacov pre prvých päť zákazníkov, ktorí splnia podmienky.'],
  ['Business pre zakladajúcich zákazníkov ročne', 'founding.annual', 'Prvých 12 mesiacov platených ročne vopred pre prvých päť zákazníkov, ktorí splnia podmienky.'],
];
export const skService = {
  name: 'Predplatné softvéru Infrayard',
  serviceType: 'Komerčné predplatné samoobslužnej platformy OKE prevádzkovanej u zákazníka',
};
