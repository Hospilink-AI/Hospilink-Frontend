// Same shape as the app's LegalDoc component, so the client-approved text is reused verbatim.
export type LegalBlock = string | { bullets: string[] } | { sub: string; blocks: LegalBlock[] };
export type LegalSection = { title: string; blocks: LegalBlock[] };
export type LegalDocument = { title: string; updated: string; intro: string[]; sections: LegalSection[] };
