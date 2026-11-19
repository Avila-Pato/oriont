import { COUNTRIES } from "./countries";
import { brands, type BrandId } from "./services";
import { SITE, SITE_URL } from "./site";

/** países donde opera el grupo: los mismos del globo del hero (Chile, Perú, Colombia) */
const AREA_SERVED = COUNTRIES.map((c) => ({ "@type": "Country", name: c.name }));

/**
 * Datos estructurados (schema.org, JSON-LD) para Google y asistentes de IA: quién es Oriont,
 * qué servicios ofrece y qué empresas son del grupo. Se arman con los mismos datos que muestra
 * la sección Servicios (data/services.ts), así no se desalinean al cambiar los textos.
 * Validar en https://search.google.com/test/rich-results
 */

const ORG_ID = `${SITE_URL}/#organization`;
/** id de cada empresa del grupo (Oriont es la organización principal) */
const brandId = (id: BrandId) => (id === "oriont" ? ORG_ID : `${SITE_URL}/#${id}`);

/** nombre del servicio que presta cada empresa (como lo buscaría alguien) */
const SERVICE: Record<BrandId, string> = {
  oriont: "Estructuración de productos de bancaseguros y telecomunicaciones",
  conectados: "Contact center y telemarketing para bancaseguros y telecomunicaciones",
  dental: "Planes de asistencia dental",
};

const groupCompanies = brands.filter((b) => b.id !== "oriont");

export const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORG_ID,
      name: SITE.name,
      legalName: SITE.legalName,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      description: SITE.description,
      email: SITE.email,
      address: { "@type": "PostalAddress", ...SITE.address },
      areaServed: AREA_SERVED,
      contactPoint: { "@type": "ContactPoint", contactType: "sales", email: SITE.email, availableLanguage: "es" },
      // temas en los que la empresa es experta
      knowsAbout: [
        "Bancaseguros",
        "Telecomunicaciones",
        "Estructuración de productos",
        "Contact center",
        "Telemarketing",
        "Asistencia dental",
      ],
      // empresas del grupo
      subOrganization: groupCompanies.map((b) => ({ "@id": brandId(b.id) })),
      // servicios que ofrece el grupo
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Servicios",
        itemListElement: brands.map((b) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: SERVICE[b.id],
            description: b.text,
            serviceType: b.tags.join(", "),
            areaServed: AREA_SERVED,
            provider: { "@id": brandId(b.id) },
          },
        })),
      },
    },
    // cada empresa del grupo, con su sitio
    ...groupCompanies.map((b) => ({
      "@type": "Organization",
      "@id": brandId(b.id),
      name: b.name,
      url: b.href,
      description: b.text,
      parentOrganization: { "@id": ORG_ID },
    })),
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE.name,
      inLanguage: "es-CL",
      publisher: { "@id": ORG_ID },
    },
  ],
};
