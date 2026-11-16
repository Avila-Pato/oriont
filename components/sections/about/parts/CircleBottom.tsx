/** Círculo grande de fondo, detrás del texto y las tarjetas. */
export default function CircleBottom() {
  return (
    <div
      aria-hidden
      data-about-circle
      className="absolute left-1/2 top-1/2 aspect-square w-[min(92vw,135svh)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-white to-[#eef0f3] ring-1 ring-[#21255c]/[0.05] shadow-[inset_0_-40px_80px_-40px_rgba(33,37,92,0.08)]"
    />
  );
}
