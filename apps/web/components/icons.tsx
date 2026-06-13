import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

function createIcon(paths: string[]) {
  return function Icon({ size = 24, ...props }: IconProps) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths.map((path, index) => <path d={path} key={index} />)}</svg>;
  };
}

export const ArrowRight = createIcon(["M5 12h14", "m13 6 6 6-6 6"]);
export const ArrowLeft = createIcon(["M19 12H5", "m11 18-6-6 6-6"]);
export const ArrowUpRight = createIcon(["M7 17 17 7", "M7 7h10v10"]);
export const Bot = createIcon(["M12 8V4H8", "M4 12h16v8H4z", "M8 16h.01", "M16 16h.01"]);
export const BookOpenText = createIcon(["M2 5h6a4 4 0 0 1 4 4v12a4 4 0 0 0-4-4H2z", "M22 5h-6a4 4 0 0 0-4 4v12a4 4 0 0 1 4-4h6z"]);
export const Building2 = createIcon(["M3 21h18", "M6 21V5l6-3v19", "M18 21V9l-6-3", "M9 9h.01", "M9 13h.01", "M15 13h.01", "M15 17h.01"]);
export const ChartNoAxesCombined = createIcon(["M3 3v18h18", "m7 16 4-5 4 3 5-7"]);
export const CheckCircle2 = createIcon(["M22 11.1V12a10 10 0 1 1-5.9-9.1", "m9 11 3 3L22 4"]);
export const ClipboardCheck = createIcon(["M9 5H6a2 2 0 0 0-2 2v13h16V7a2 2 0 0 0-2-2h-3", "M9 3h6v4H9z", "m9 14 2 2 4-5"]);
export const Download = createIcon(["M12 3v12", "m7 10 5 5 5-5", "M5 21h14"]);
export const FlaskConical = createIcon(["M9 3h6", "M10 9V3", "M14 9V3", "m8 21 5.5-9.5A2 2 0 0 0 15.8 9h-7.6a2 2 0 0 0-1.7 2.5L12 21z"]);
export const GitCompareArrows = createIcon(["m15 3 4 4-4 4", "M19 7H9a4 4 0 0 0-4 4", "m9 21-4-4 4-4", "M5 17h10a4 4 0 0 0 4-4"]);
export const Github = createIcon(["M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.7-1.6 6.7-7A5.4 5.4 0 0 0 19.3 3.7 5 5 0 0 0 19.2.2S18.1-.2 15 1.7a13.4 13.4 0 0 0-7 0C4.9-.2 3.8.2 3.8.2a5 5 0 0 0-.1 3.5A5.4 5.4 0 0 0 2.3 7.5c0 5.4 3.4 6.6 6.7 7A4.8 4.8 0 0 0 8 18v4", "M8 19c-3 .9-3-1.5-4-2"]);
export const Home = createIcon(["m3 11 9-8 9 8", "M5 10v10h14V10", "M9 20v-6h6v6"]);
export const Network = createIcon(["M9 3h6v4H9z", "M4 17h6v4H4z", "M14 17h6v4h-6z", "M12 7v5", "M7 17v-2h10v2"]);
export const RefreshCw = createIcon(["M20 6v5h-5", "M4 18v-5h5", "M18.5 9A7 7 0 0 0 6 6.5L4 11", "M5.5 15A7 7 0 0 0 18 17.5l2-4.5"]);
export const ShieldCheck = createIcon(["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10", "m9 12 2 2 4-5"]);
export const Send = createIcon(["m22 2-7 20-4-9-9-4z", "M22 2 11 13"]);
export const TriangleAlert = createIcon(["M10.3 3.7 2 18a2 2 0 0 0 1.7 3h16.6A2 2 0 0 0 22 18L13.7 3.7a2 2 0 0 0-3.4 0", "M12 9v4", "M12 17h.01"]);
export const X = createIcon(["M18 6 6 18", "m6 6 12 12"]);
