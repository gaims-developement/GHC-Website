// Decorative SVG layers for the invitation poster: flowing light waves, a dotted globe texture,
// halo arcs around the venue and the New Delhi skyline line art.

const range = (count) => Array.from({ length: count }, (_, i) => i);

const wavePath = (i) => {
  const s = i * 11;
  return `M -60 ${620 + s} C 150 ${700 + s * 0.8}, -10 ${1160 - s * 0.4}, 120 ${1400 + s * 0.3} S 250 ${1720 + s * 0.2}, 210 ${1900}`;
};

export function FlowingWaves() {
  return (
    <svg className="gip-layer" viewBox="0 0 1200 1800" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="gip-wave" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#38BDF8" stopOpacity="0" />
          <stop offset="0.35" stopColor="#38BDF8" stopOpacity="0.55" />
          <stop offset="0.75" stopColor="#0756C9" stopOpacity="0.45" />
          <stop offset="1" stopColor="#0756C9" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[1, -1].map((side) => (
        <g key={side} transform={side === -1 ? "translate(1200 0) scale(-1 1)" : undefined} fill="none" stroke="url(#gip-wave)">
          {range(26).map((i) => (
            <path key={i} d={wavePath(i)} strokeWidth={i % 6 === 0 ? 1.4 : 0.7} opacity={0.25 + (i % 5) * 0.09} />
          ))}
        </g>
      ))}
    </svg>
  );
}

// Halo arcs sweeping behind the venue, as in an orbital light trail.
export function HaloArcs() {
  return (
    <svg className="gip-layer" viewBox="0 0 1200 1800" aria-hidden="true">
      <defs>
        <linearGradient id="gip-arc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#38BDF8" stopOpacity="0" />
          <stop offset="0.5" stopColor="#7dd3fc" stopOpacity="0.85" />
          <stop offset="1" stopColor="#38BDF8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#gip-arc)">
        <path d="M -40 520 Q 600 120 1240 470" strokeWidth="1.6" opacity="0.55" />
        <path d="M -40 560 Q 600 170 1240 515" strokeWidth="0.8" opacity="0.4" />
        <path d="M 40 300 Q 640 60 1240 300" strokeWidth="0.7" opacity="0.3" />
      </g>
    </svg>
  );
}

// Dotted globe texture: a CSS dot grid faded out radially (CSS masks survive the PNG export; SVG masks don't).
export function DotGlobe() {
  return (
    <>
      <div className="gip-dots gip-dots-main" aria-hidden="true" />
      <div className="gip-dots gip-dots-side" aria-hidden="true" />
    </>
  );
}

const minaret = (x, base, height, width) => (
  <g key={`m${x}`}>
    <path d={`M ${x - width / 2} ${base} L ${x - width / 3} ${base - height} L ${x + width / 3} ${base - height} L ${x + width / 2} ${base} Z`} />
    <path d={`M ${x - width / 2.4} ${base - height} Q ${x} ${base - height - width * 1.4} ${x + width / 2.4} ${base - height} Z`} />
    <line x1={x} y1={base - height - width * 1.1} x2={x} y2={base - height - width * 1.9} />
  </g>
);

// New Delhi line-art skyline. The QR panel covers the centre, so the landmarks sit at the edges:
// Qutub Minar and India Gate on the left, Humayun's Tomb and the Lotus Temple on the right.
export function DelhiSkyline() {
  const base = 196;
  return (
    <svg className="gip-skyline" viewBox="0 0 1200 210" aria-hidden="true">
      <defs>
        <linearGradient id="gip-sky-stroke" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e0f2fe" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id="gip-sky-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a2a5c" stopOpacity="0.55" />
          <stop offset="1" stopColor="#03152F" stopOpacity="0.95" />
        </linearGradient>
        <filter id="gip-glow" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g fill="url(#gip-sky-fill)" stroke="url(#gip-sky-stroke)" strokeWidth="1.3" strokeLinejoin="round" filter="url(#gip-glow)" opacity="0.9">
        {/* Low city line */}
        <path d={`M 0 ${base} L 0 ${base - 22} L 40 ${base - 22} L 40 ${base - 30} L 70 ${base - 30} L 70 ${base - 18} L 1200 ${base - 18} L 1200 ${base} Z`} />

        {/* Qutub Minar */}
        <g transform="translate(-36 0)">
        <path d={`M 104 ${base} L 113 ${base - 176} L 129 ${base - 176} L 138 ${base} Z`} />
        {[34, 70, 104, 140].map((h) => (
          <line key={h} x1={104 + (h / 176) * 9 - 4} y1={base - h} x2={138 - (h / 176) * 9 + 4} y2={base - h} />
        ))}
        <path d={`M 115 ${base - 176} L 117 ${base - 194} L 125 ${base - 194} L 127 ${base - 176} Z`} />
        </g>
        {/* India Gate */}
        <g transform="translate(-396 0)">
        <path d={`M 548 ${base} L 548 ${base - 118} L 652 ${base - 118} L 652 ${base} L 622 ${base} L 622 ${base - 62} Q 600 ${base - 92} 578 ${base - 62} L 578 ${base} Z`} />
        <path d={`M 540 ${base - 118} L 660 ${base - 118} L 660 ${base - 128} L 540 ${base - 128} Z`} />
        <path d={`M 566 ${base - 128} L 566 ${base - 144} L 634 ${base - 144} L 634 ${base - 128} Z`} />
        <path d={`M 586 ${base - 144} C 586 ${base - 160}, 614 ${base - 160}, 614 ${base - 144} Z`} />
        </g>
        {/* Humayun's Tomb */}
        <g transform="translate(746 0)">
        <path d={`M 196 ${base} L 196 ${base - 48} L 344 ${base - 48} L 344 ${base} Z`} />
        <path d={`M 238 ${base - 48} L 238 ${base - 70} L 302 ${base - 70} L 302 ${base - 48} Z`} />
        <path d={`M 240 ${base - 70} C 240 ${base - 118}, 300 ${base - 118}, 300 ${base - 70} Z`} />
        <line x1="270" y1={base - 108} x2="270" y2={base - 122} />
        {[214, 252, 288, 326].map((x) => (
          <path key={x} d={`M ${x - 8} ${base} L ${x - 8} ${base - 22} Q ${x} ${base - 34} ${x + 8} ${base - 22} L ${x + 8} ${base} Z`} />
        ))}
        {minaret(204, base - 48, 14, 10)}
        {minaret(336, base - 48, 14, 10)}
        </g>
        {/* Lotus Temple */}
        <g transform="translate(1140 74.5) scale(0.62) translate(-1080 0)">
        <path d={`M 1010 ${base - 18} Q 1040 ${base - 70} 1080 ${base - 108} Q 1092 ${base - 60} 1080 ${base - 18} Z`} />
        <path d={`M 1150 ${base - 18} Q 1120 ${base - 70} 1080 ${base - 108} Q 1068 ${base - 60} 1080 ${base - 18} Z`} />
        <path d={`M 1040 ${base - 18} Q 1056 ${base - 80} 1080 ${base - 120} Q 1104 ${base - 80} 1120 ${base - 18} Z`} />
        <path d={`M 990 ${base - 18} Q 1010 ${base - 48} 1040 ${base - 62} Q 1036 ${base - 36} 1046 ${base - 18} Z`} />
        <path d={`M 1170 ${base - 18} Q 1150 ${base - 48} 1120 ${base - 62} Q 1124 ${base - 36} 1114 ${base - 18} Z`} />
        </g>
      </g>
    </svg>
  );
}

// Brand marks drawn inline (lucide-react no longer ships brand icons).
export function SocialIcons() {
  const props = { width: 30, height: 30, viewBox: "0 0 24 24", fill: "none", stroke: "#e0f2fe", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  return (
    <div className="gip-socials">
      <svg {...props} aria-label="Instagram">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="0.6" fill="#e0f2fe" />
      </svg>
      <svg {...props} aria-label="LinkedIn">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <line x1="8" y1="10.5" x2="8" y2="16.5" />
        <circle cx="8" cy="7.6" r="0.5" fill="#e0f2fe" />
        <path d="M12 16.5 v-6 M12 13 c0 -1.6 1 -2.6 2.4 -2.6 c1.4 0 2.1 0.9 2.1 2.6 v3.5" />
      </svg>
      <svg {...props} aria-label="YouTube">
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
        <path d="M10 9.3 L15 12 L10 14.7 Z" fill="#e0f2fe" />
      </svg>
      <svg {...props} aria-label="X">
        <path d="M4 4 H8.6 L20 20 H15.4 Z" />
        <path d="M19.4 4 L13.3 11 M10.7 13 L4.6 20" />
      </svg>
    </div>
  );
}
