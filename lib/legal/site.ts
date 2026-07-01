export interface LegalSiteConfig {
  entityName: string;
  address: string;
  email: string;
  website: string;
  representative: string;
  uid: string;
  supervisoryAuthority: string;
  contentResponsible: string;
  hostingProvider: string;
  hostingLocation: string;
}

export function getLegalSiteConfig(): LegalSiteConfig {
  return {
    entityName: process.env.LEGAL_ENTITY_NAME ?? "Poolbar Kultur gGmbH",
    address:
      process.env.LEGAL_ADDRESS ?? "Austraße 35, 6800 Feldkirch, Österreich",
    email: process.env.LEGAL_EMAIL ?? "ahoi@poolbar.at",
    website: process.env.LEGAL_WEBSITE ?? "www.poolbar.at",
    representative: process.env.LEGAL_REPRESENTATIVE ?? "Herwig Bauer",
    uid: process.env.LEGAL_UID ?? "ATU 71176737",
    supervisoryAuthority:
      process.env.LEGAL_SUPERVISORY_AUTHORITY ??
      "Bezirkshauptmannschaft Feldkirch",
    contentResponsible:
      process.env.LEGAL_CONTENT_RESPONSIBLE ??
      "Herwig Bauer, 6800 Feldkirch",
    hostingProvider: process.env.LEGAL_HOSTING_PROVIDER ?? "Render Services, Inc.",
    hostingLocation:
      process.env.LEGAL_HOSTING_LOCATION ?? "Region Frankfurt (EU)",
  };
}
