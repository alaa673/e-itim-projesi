import clsx from 'clsx';
import { useId } from 'react';

/**
 * Night landscape at the foot of the sidebar: layered hills, pines and a glowing path to the summit.
 * Tinted with the role's sidebar tokens; `school` places a lit school on the summit (administrator).
 */
export function SidebarLandscape({ variant = 'star', className }: { variant?: 'star' | 'school'; className?: string }) {
  const id = useId();
  const hill = 'rgb(var(--sidebar-hill))';
  return (
    <svg aria-hidden viewBox="0 0 288 300" preserveAspectRatio="xMidYMax slice" className={clsx('pointer-events-none block w-full', className)}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--sidebar))" stopOpacity="0" />
          <stop offset="1" stopColor="rgb(var(--sidebar-2))" />
        </linearGradient>
        <linearGradient id={`${id}-path`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FFB547" stopOpacity="0.15" />
          <stop offset="0.55" stopColor="#FFC56B" />
          <stop offset="1" stopColor="#FFE29A" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.68" cy="0.28" r="0.4">
          <stop offset="0" stopColor="#FFD27A" stopOpacity="0.35" />
          <stop offset="1" stopColor="#FFD27A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="288" height="300" fill={`url(#${id}-sky)`} />
      <rect width="288" height="300" fill={`url(#${id}-glow)`} />
      {/* distant ridge */}
      <path d="M0 150 38 118 70 140 112 96 150 132 186 104 226 138 262 112 288 128V300H0z" fill={hill} opacity=".45" />
      {/* mid hills */}
      <path d="M0 196c30-26 62-34 96-20 26 11 46 8 70-6 30-18 64-22 122 6V300H0z" fill={hill} opacity=".75" />
      {/* summit hill */}
      <path d="M118 300c8-70 36-132 78-148 30-11 58 6 92 38V300z" fill="rgb(var(--sidebar-hover))" />
      <path d="M150 300c10-58 30-104 62-118" stroke="rgb(var(--sidebar-hill))" strokeWidth="10" strokeLinecap="round" fill="none" opacity=".45" />
      {/* pines */}
      {[
        [18, 238, 1],
        [40, 246, 0.8],
        [60, 236, 1.1],
        [84, 252, 0.75],
        [252, 236, 0.9],
        [272, 244, 0.7],
      ].map(([x, y, s]) => (
        <path
          key={`${x}-${y}`}
          transform={`translate(${x} ${y}) scale(${s})`}
          d="M0-34 9-16H5l9 14H8l10 14H-18l10-14h-6l9-14h-4z"
          fill="rgb(var(--sidebar-2))"
        />
      ))}
      {/* glowing path */}
      <path
        d="M54 300c18-22 52-26 64-44 12-18-22-30-6-48 14-16 52-10 66-26 10-12 6-26 22-38"
        fill="none"
        stroke={`url(#${id}-path)`}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {variant === 'school' ? (
        <g transform="translate(176 118)">
          <path d="M6 30h52v24H6z" fill="#FFE7A8" opacity=".95" />
          <path d="M0 32 32 14l32 18z" fill="#F4C46B" />
          {[12, 24, 36, 48].map((x) => (
            <rect key={x} x={x} y="38" width="6" height="8" rx="1" fill="rgb(var(--sidebar-2))" opacity=".55" />
          ))}
          <path d="M32 14V-6" stroke="#E9D6A8" strokeWidth="1.6" />
          <path d="M32-6h14l-4 5 4 5H32z" fill="#FFC53D" />
        </g>
      ) : (
        <g transform="translate(206 112)">
          <path d="M0 40V0" stroke="#E9D6A8" strokeWidth="1.6" />
          <path d="M0-12c.9 6 4 9 10 10-6 1-9.1 4-10 10-.9-6-4-9-10-10 6-1 9.1-4 10-10Z" fill="#FFC53D" className="motion-safe:animate-twinkle" style={{ transformOrigin: '0px -2px' }} />
        </g>
      )}
      {/* stars */}
      {[
        [30, 70, 1.6],
        [120, 52, 1.2],
        [248, 64, 1.4],
        [94, 92, 1],
      ].map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#FFFFFF" opacity=".55" />
      ))}
    </svg>
  );
}
