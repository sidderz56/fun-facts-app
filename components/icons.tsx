// Hand-built inline SVG icons ported directly from the design handoff
// prototype (Fun Facts.dc.html, shapeSvg()/renderVals()). Flat-color with
// black outlines, no icon library, no image assets — treat as final art.
import type { CategoryShape } from "@/lib/designTokens";

const CATEGORY_SVG_PROPS = { width: 52, height: 52, viewBox: "0 0 44 44" };

export function DiceIcon() {
  return (
    <svg width={52} height={52} viewBox="0 0 44 44" aria-hidden="true" focusable="false">
      <rect x={5} y={5} width={34} height={34} rx={9} fill="#fff9f0" stroke="#1a1a1a" strokeWidth={2.4} />
      <circle cx={15} cy={15} r={3} fill="#e0566c" />
      <circle cx={29} cy={15} r={3} fill="#e0566c" />
      <circle cx={22} cy={22} r={3} fill="#e0566c" />
      <circle cx={15} cy={29} r={3} fill="#e0566c" />
      <circle cx={29} cy={29} r={3} fill="#e0566c" />
    </svg>
  );
}

export function RabbitIcon() {
  return (
    <svg width={48} height={42} viewBox="0 0 48 40" aria-hidden="true" focusable="false">
      <ellipse cx={35} cy={33.5} rx={11.5} ry={3.2} fill="oklch(22% 0.01 75)" />
      <ellipse cx={9} cy={27} rx={4.4} ry={3.4} fill="oklch(78% 0.05 60)" transform="rotate(20 9 27)" />
      <rect x={15} y={1.5} width={3.6} height={15} rx={1.8} fill="oklch(75% 0.05 60)" transform="rotate(-24 16.8 9)" />
      <rect x={19.5} y={2.5} width={3.4} height={13.5} rx={1.7} fill="oklch(82% 0.045 60)" transform="rotate(-10 21.2 9.2)" />
      <ellipse cx={16} cy={24} rx={11} ry={7.8} fill="oklch(82% 0.045 60)" />
      <circle cx={6.5} cy={21} r={3} fill="oklch(94% 0.02 60)" />
      <circle cx={24} cy={16.5} r={6} fill="oklch(82% 0.045 60)" />
      <ellipse cx={27.5} cy={27.5} rx={3.6} ry={5.4} fill="oklch(78% 0.05 60)" transform="rotate(25 27.5 27.5)" />
      <ellipse cx={10} cy={30} rx={4} ry={2.6} fill="oklch(75% 0.05 60)" />
      <circle cx={27.5} cy={15} r={1.2} fill="oklch(25% 0.02 60)" />
      <circle cx={29.8} cy={18} r={0.9} fill="oklch(55% 0.08 30)" />
    </svg>
  );
}

function ColumnIcon() {
  return (
    <svg {...CATEGORY_SVG_PROPS} aria-hidden="true" focusable="false">
      <rect x={6} y={4} width={32} height={7} rx={3.5} fill="#a5673f" stroke="#1a1a1a" strokeWidth={2.2} />
      <rect x={9} y={9} width={26} height={26} fill="#fdf1de" stroke="#1a1a1a" strokeWidth={2.2} />
      <rect x={6} y={33} width={32} height={7} rx={3.5} fill="#a5673f" stroke="#1a1a1a" strokeWidth={2.2} />
      <line x1={13} y1={15} x2={26} y2={15} stroke="#c9a877" strokeWidth={1.6} />
      <line x1={13} y1={30} x2={24} y2={30} stroke="#c9a877" strokeWidth={1.6} />
      <polygon points="17,9 20,9 27,34 24,34" fill="#e0362f" stroke="#1a1a1a" strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx={22} cy={22} r={5.5} fill="#c9302c" stroke="#1a1a1a" strokeWidth={1.8} />
      <circle cx={22} cy={22} r={2.4} fill="#f2807a" />
    </svg>
  );
}

function AtomIcon() {
  return (
    <svg {...CATEGORY_SVG_PROPS} aria-hidden="true" focusable="false">
      <ellipse cx={22} cy={22} rx={19} ry={7.5} fill="none" stroke="#3f6b76" strokeWidth={2.2} transform="rotate(0 22 22)" />
      <ellipse cx={22} cy={22} rx={19} ry={7.5} fill="none" stroke="#3f6b76" strokeWidth={2.2} transform="rotate(60 22 22)" />
      <ellipse cx={22} cy={22} rx={19} ry={7.5} fill="none" stroke="#3f6b76" strokeWidth={2.2} transform="rotate(120 22 22)" />
      <circle cx={22} cy={22} r={6.2} fill="#ffcb4d" />
      <circle cx={20} cy={20} r={2} fill="#fff" opacity={0.5} />
      <circle cx={9} cy={8} r={2.2} fill="#ffcb4d" />
      <circle cx={33} cy={8} r={2.6} fill="#2f8fd1" />
      <circle cx={5} cy={20} r={2.6} fill="#f4794b" />
      <circle cx={39} cy={20} r={2.6} fill="#2f8fd1" />
      <circle cx={12} cy={34} r={2.6} fill="#2f8fd1" />
      <circle cx={28} cy={36} r={2.6} fill="#f4794b" />
      <circle cx={35} cy={34} r={2} fill="#ffcb4d" />
    </svg>
  );
}

function PawIcon() {
  return (
    <svg {...CATEGORY_SVG_PROPS} aria-hidden="true" focusable="false">
      <ellipse cx={22} cy={29} rx={10.5} ry={8.2} fill="#c98a4b" stroke="#1a1a1a" strokeWidth={2.2} />
      <circle cx={9} cy={16} r={4.4} fill="#c98a4b" stroke="#1a1a1a" strokeWidth={2.2} />
      <circle cx={18.5} cy={8.5} r={4.4} fill="#c98a4b" stroke="#1a1a1a" strokeWidth={2.2} />
      <circle cx={27.5} cy={8.5} r={4.4} fill="#c98a4b" stroke="#1a1a1a" strokeWidth={2.2} />
      <circle cx={36} cy={17.5} r={4.4} fill="#c98a4b" stroke="#1a1a1a" strokeWidth={2.2} />
      <ellipse cx={22} cy={27} rx={2.4} ry={1.8} fill="#f2a6b8" stroke="#1a1a1a" strokeWidth={1.2} />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg {...CATEGORY_SVG_PROPS} aria-hidden="true" focusable="false">
      <circle cx={19} cy={23} r={16} fill="#5bc8f0" stroke="#1a1a1a" strokeWidth={2.4} />
      <path
        d="M13 8 c3 -1 6 0 7 2 c-2 1 -5 1 -8 3 c-2 1.5 -3 3.5 -5.5 3 c0.5 -3.5 3 -6.5 6.5 -8 z"
        fill="#a4de6c"
        stroke="#1a1a1a"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <path
        d="M5 20 c2 -0.5 3.5 1 3.5 3 c0 2 -1.5 4 -1 6.5 c-2 0.5 -4 -1.5 -4.3 -4 c-0.3 -2.5 0.3 -4.7 1.8 -5.5 z"
        fill="#a4de6c"
        stroke="#1a1a1a"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <path
        d="M19 15 c3 -1 5 1 6.5 3 c1.2 1.6 3 1.6 3.5 3.5 c0.5 2 -1 3 -0.5 5 c0.5 2 -1 3.5 -3 3.5 c-1.5 0 -2 -1.8 -3.5 -2 c-1.8 -0.3 -3 1.5 -4.7 1 c-1.8 -0.5 -2.3 -3 -1.5 -5 c0.8 -2 -1 -3.2 -0.8 -5.2 c0.2 -2 2 -3.2 4 -3.8 z"
        fill="#a4de6c"
        stroke="#1a1a1a"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <path d="M6 8 A16 16 0 0 1 19 7" fill="none" stroke="#1a1a1a" strokeWidth={2.4} strokeLinecap="round" />
      <path d="M8 37 A16 16 0 0 0 32 30" fill="none" stroke="#1a1a1a" strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={34.5} cy={33.5} r={1} fill="#1a1a1a" />
      <path
        d="M34 4 a7 7 0 0 1 5.2 11.7 L34.5 23 a0.9 0.9 0 0 1 -1.4 0 l-4.5 -7.3 A7 7 0 0 1 34 4 z"
        fill="#e0566c"
        stroke="#1a1a1a"
        strokeWidth={2}
      />
      <circle cx={34} cy={10.5} r={3} fill="#fff" stroke="#1a1a1a" strokeWidth={1.8} />
    </svg>
  );
}

function BodyMindIcon() {
  return (
    <svg {...CATEGORY_SVG_PROPS} aria-hidden="true" focusable="false">
      <path
        d="M22 36 C9 27.5 5 19 9.5 13 C13 8.3 20.5 9.3 22 15.5 C23.5 9.3 31 8.3 34.5 13 C39 19 35 27.5 22 36 Z"
        fill="#f2555c"
        stroke="#1a1a1a"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <path
        d="M9 21 H16.5 L18.5 15.5 L22 27 L25.5 17.5 L27.5 21 H33"
        fill="none"
        stroke="#fff"
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SpeechIcon() {
  return (
    <svg {...CATEGORY_SVG_PROPS} aria-hidden="true" focusable="false">
      <path
        d="M6 8 h32 a2.5 2.5 0 0 1 2.5 2.5 v16 a2.5 2.5 0 0 1 -2.5 2.5 H19 l-8 7 v-7 H6 a2.5 2.5 0 0 1 -2.5 -2.5 v-16 A2.5 2.5 0 0 1 6 8 z"
        fill="#ffd873"
        stroke="#1a1a1a"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <text
        x={22}
        y={20.5}
        fontSize={15}
        fontWeight={900}
        textAnchor="middle"
        fill="#1a1a1a"
        fontFamily="'Noto Sans Tibetan', sans-serif"
      >
        ཀུ་ཟུ
      </text>
    </svg>
  );
}

function DiningIcon() {
  return (
    <svg {...CATEGORY_SVG_PROPS} aria-hidden="true" focusable="false">
      <path d="M4 22 a18 13 0 0 1 36 0 z" fill="#e8b84b" stroke="#1a1a1a" strokeWidth={2.2} />
      <circle cx={12} cy={15} r={1.3} fill="#fff" />
      <circle cx={22} cy={11} r={1.3} fill="#fff" />
      <circle cx={32} cy={15} r={1.3} fill="#fff" />
      <circle cx={17} cy={18} r={1.3} fill="#fff" />
      <circle cx={27} cy={18} r={1.3} fill="#fff" />
      <rect x={3} y={22} width={38} height={4.5} fill="#8bc24a" stroke="#1a1a1a" strokeWidth={1.8} />
      <rect x={2.5} y={27} width={39} height={6} rx={3} fill="#a5673f" stroke="#1a1a1a" strokeWidth={2} />
      <rect x={2.5} y={34.5} width={39} height={5.5} rx={3} fill="#e8b84b" stroke="#1a1a1a" strokeWidth={2} />
    </svg>
  );
}

function SingerIcon() {
  return (
    <svg width={58} height={58} viewBox="0 -10 44 54" aria-hidden="true" focusable="false">
      <polygon points="9,18 14.2,18 17.2,41 14,41" fill="#e0362f" stroke="#7a1a1a" strokeWidth={1.2} strokeLinejoin="round" />
      <polygon points="14.2,18 19.4,18 20.4,41 17.2,41" fill="#fdf6ee" stroke="#7a1a1a" strokeWidth={1.2} strokeLinejoin="round" />
      <polygon points="19.4,18 24.6,18 23.6,41 20.4,41" fill="#e0362f" stroke="#7a1a1a" strokeWidth={1.2} strokeLinejoin="round" />
      <polygon points="24.6,18 29.8,18 26.8,41 23.6,41" fill="#fdf6ee" stroke="#7a1a1a" strokeWidth={1.2} strokeLinejoin="round" />
      <polygon points="29.8,18 35,18 30,41 26.8,41" fill="#e0362f" stroke="#7a1a1a" strokeWidth={1.2} strokeLinejoin="round" />
      <path d="M9 18 h26 l-1.6 3 h-22.8 z" fill="#c9302c" stroke="#7a1a1a" strokeWidth={1.2} />
      <circle cx={13} cy={15.5} r={5.4} fill="#fdeec2" stroke="#c9302c" strokeWidth={1.6} />
      <circle cx={11.3} cy={13.2} r={1.7} fill="#fffaf0" />
      <circle cx={19} cy={13.5} r={6} fill="#fdeec2" stroke="#c9302c" strokeWidth={1.6} />
      <circle cx={17} cy={10.8} r={1.9} fill="#fffaf0" />
      <circle cx={25.5} cy={12.5} r={6.3} fill="#fdeec2" stroke="#c9302c" strokeWidth={1.6} />
      <circle cx={23.3} cy={9.7} r={2} fill="#fffaf0" />
      <circle cx={31.5} cy={14.5} r={5.6} fill="#fdeec2" stroke="#c9302c" strokeWidth={1.6} />
      <circle cx={29.6} cy={12} r={1.8} fill="#fffaf0" />
      <circle cx={15} cy={7.5} r={5.6} fill="#fdeec2" stroke="#c9302c" strokeWidth={1.6} />
      <circle cx={13} cy={5} r={1.8} fill="#fffaf0" />
      <circle cx={21} cy={5} r={6} fill="#fdeec2" stroke="#c9302c" strokeWidth={1.6} />
      <circle cx={18.8} cy={2.3} r={1.9} fill="#fffaf0" />
      <circle cx={27.5} cy={5.5} r={6} fill="#fdeec2" stroke="#c9302c" strokeWidth={1.6} />
      <circle cx={25.3} cy={2.8} r={1.9} fill="#fffaf0" />
      <circle cx={32.5} cy={8.5} r={5} fill="#fdeec2" stroke="#c9302c" strokeWidth={1.6} />
      <circle cx={30.6} cy={6.2} r={1.6} fill="#fffaf0" />
      <circle cx={19} cy={-1.5} r={4.6} fill="#fdeec2" stroke="#c9302c" strokeWidth={1.6} />
      <circle cx={17.2} cy={-3.8} r={1.5} fill="#fffaf0" />
      <circle cx={25} cy={-2.3} r={4.8} fill="#fdeec2" stroke="#c9302c" strokeWidth={1.6} />
      <circle cx={23.1} cy={-4.6} r={1.5} fill="#fffaf0" />
      <circle cx={11} cy={-6.5} r={1.3} fill="#e0362f" />
      <circle cx={34} cy={-4.5} r={1.3} fill="#e0362f" />
    </svg>
  );
}

const BILL_PATH = "M3 2 Q0 14 3 26 Q11 29 19 26 Q22 14 19 2 Q11 -1 3 2 Z";

function Bill({ transform, fill, stroke }: { transform: string; fill: string; stroke: string }) {
  return (
    <g transform={transform}>
      <path d={BILL_PATH} fill={fill} stroke={stroke} strokeWidth={1.6} strokeLinejoin="round" />
      <path
        d="M5.5 4.5 Q3 14 5.5 23.5 Q11 26 16.5 23.5 Q19 14 16.5 4.5 Q11 2 5.5 4.5 Z"
        fill="none"
        stroke={stroke}
        strokeWidth={1}
        strokeDasharray="1.6 1.6"
        opacity={0.8}
      />
      <circle cx={11} cy={14} r={6} fill={stroke} />
      <text x={11} y={17.5} fontSize={8} fontWeight={700} textAnchor="middle" fill={fill} fontFamily="Inter, sans-serif">
        $
      </text>
      <circle cx={6.5} cy={5.5} r={1.2} fill={stroke} />
      <circle cx={15.5} cy={22.5} r={1.2} fill={stroke} />
    </g>
  );
}

function NoteIcon() {
  return (
    <svg {...CATEGORY_SVG_PROPS} aria-hidden="true" focusable="false">
      <Bill transform="translate(21,3) rotate(20)" fill="#7ec8d8" stroke="#2f7d92" />
      <Bill transform="translate(3,13) rotate(-24)" fill="#8fd19e" stroke="#4e9b62" />
      <Bill transform="translate(13,17) rotate(-6)" fill="#f0d876" stroke="#b89a2e" />
    </svg>
  );
}

const SHAPE_COMPONENTS: Record<CategoryShape, () => React.JSX.Element> = {
  column: ColumnIcon,
  atom: AtomIcon,
  paw: PawIcon,
  globe: GlobeIcon,
  bodymind: BodyMindIcon,
  speech: SpeechIcon,
  dining: DiningIcon,
  singer: SingerIcon,
  note: NoteIcon,
};

export function CategoryIcon({ shape }: { shape: CategoryShape }) {
  const Shape = SHAPE_COMPONENTS[shape];
  return <Shape />;
}
