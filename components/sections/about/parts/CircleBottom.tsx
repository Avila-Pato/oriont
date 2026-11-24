/** Círculo grande de fondo, detrás del texto y las tarjetas.
 *  will-change-transform: el scroll lo escala (GSAP, scrub). Con capa propia se pinta UNA vez y la
 *  GPU solo lo agranda; sin ella se repintaba en cada cuadro (disco de ~1200 px con degradado y
 *  sombra interior difuminada): era lo que más GPU gastaba al pasar de Industrias a Nosotros. */
export default function CircleBottom() {
  return (
    <div
      aria-hidden
      data-about-circle
      className="absolute left-1/2 will-change-transform top-1/2 aspect-square w-[min(92vw,135svh)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-b/srgb from-white to-[#eef0f3] ring-1 ring-navy/[0.05] shadow-[inset_0_-40px_80px_-40px_rgba(33,37,92,0.08)]"
    />
  );
}
