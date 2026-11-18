/**
 * Contenido de la sección "Cadena de valor" (provisorio: reemplazar textos).
 * Solo datos: los íconos y logos se eligen por clave y viven en
 * components/sections/solutions/parts/visuals.tsx.
 */

export type StepIcon = "building" | "box" | "network" | "headset" | "product";
export type StepTheme = "navy" | "cream" | "teal" | "sky" | "gradient";

export type Step = {
  title: string;
  text: string;
  tags: string[];
  /** "lo que hacemos" en esta etapa: 3 puntos cortos (provisorio: reemplazar) */
  points: string[];
  icon: StepIcon;
  theme: StepTheme;
};

/** Etapas de la cadena (tarjetas del mazo + índice). */
export const steps: Step[] = [
  {
    title: "Sponsor",
    text: "Bancos, aseguradoras, retail y telcos que buscan llegar a sus clientes con nuevos productos y canales.",
    tags: ["Bancaseguros", "Retail", "Telecomunicaciones"],
    points: ["Detectamos oportunidades en su base de clientes", "Definimos objetivos y metas comerciales", "Un solo equipo coordina toda la cadena"],
    icon: "building",
    theme: "navy",
  },
  {
    title: "Estructurador de Producto",
    text: "Diseñamos el producto junto al sponsor: coberturas, precio, proveedores y propuesta de valor.",
    tags: ["Diseño", "Pricing", "Proveedores"],
    points: ["Coberturas y precio a la medida del cliente", "Selección y negociación con proveedores", "Propuesta de valor lista para vender"],
    icon: "box",
    theme: "cream",
  },
  {
    title: "Tecnología e Integración",
    text: "Integramos sistemas, datos y canales para operar el producto de punta a punta, sin fricción.",
    tags: ["APIs", "Datos", "Automatización"],
    points: ["Conexión con los sistemas del sponsor", "Datos y reportería en tiempo real", "Procesos automatizados de punta a punta"],
    icon: "network",
    theme: "teal",
  },
  {
    title: "Call Center",
    text: "Equipos especializados de venta y servicio que conversan directo con el cliente final.",
    tags: ["Venta", "Servicio", "Retención"],
    points: ["Equipos entrenados para cada sponsor", "Venta y servicio en un mismo canal", "Calidad monitoreada en cada contacto"],
    icon: "headset",
    theme: "sky",
  },
  {
    title: "Producto",
    text: "Un producto en el mercado, medido y optimizado de forma continua para crecer junto al sponsor.",
    tags: ["Medición", "Optimización", "Escala"],
    points: ["Indicadores de venta y retención", "Mejoras continuas con datos reales", "Crecimiento sostenido junto al sponsor"],
    icon: "product",
    theme: "gradient",
  },
];
