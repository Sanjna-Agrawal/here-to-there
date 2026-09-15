const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  viewBox: '0 0 24 24',
};

export const HomeIcon = () => (
  <svg width="22" height="22" strokeWidth={2} {...base}>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-5h4v5" />
  </svg>
);

export const TickIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} strokeWidth={3} {...base}>
    <path d="M5 12l5 5 9-10" />
  </svg>
);

export const OutIcon = () => (
  <svg width="16" height="16" strokeWidth={2.4} {...base}>
    <path d="M14 5h5v5" />
    <path d="M19 5l-8 8" />
    <path d="M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4" />
  </svg>
);
