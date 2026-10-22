import React from 'react';
import { AVATAR_STYLES, SKIN_TONES, HAIRSTYLES, BACKGROUNDS } from '../constants/avatarPresets';

/**
 * Pure SVG On-Chain Avatar Renderer.
 * Deterministically renders any combination of (style, skin, hair, bg).
 * Safely normalizes BigInt values from ethers v6.
 */
export default function AvatarPreview({
  styleId = 0,
  skinToneId = 0,
  hairstyleId = 0,
  backgroundId = 0,
  size = 160,
  className = "",
  rounded = true,
}) {
  const numStyle = Number(styleId ?? 0);
  const numSkin = Number(skinToneId ?? 0);
  const numHair = Number(hairstyleId ?? 0);
  const numBg = Number(backgroundId ?? 0);

  const safeStyle = AVATAR_STYLES[numStyle] ? numStyle : 0;
  const safeSkin = SKIN_TONES[numSkin] ? numSkin : 0;
  const safeHair = HAIRSTYLES[numHair] ? numHair : 0;
  const safeBg = BACKGROUNDS[numBg] ? numBg : 0;

  const skin = SKIN_TONES[safeSkin].color;
  const hair = HAIRSTYLES[safeHair].color;
  const bg = BACKGROUNDS[safeBg];

  const uniqueId = `vart-avatar-${safeStyle}-${safeSkin}-${safeHair}-${safeBg}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={`vart-avatar ${className}`}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <defs>
        {/* Background Gradient */}
        <linearGradient id={`${uniqueId}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bg.primary} />
          <stop offset="100%" stopColor={bg.secondary} />
        </linearGradient>

        {/* Glow Filters */}
        <filter id={`${uniqueId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background Frame */}
      <rect
        width="200"
        height="200"
        rx={rounded ? "32" : "0"}
        fill={`url(#${uniqueId}-bg)`}
      />
      <rect
        width="200"
        height="200"
        rx={rounded ? "32" : "0"}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="2"
      />

      {/* Style 4: Synth Aura Glow Behind Body */}
      {safeStyle === 4 && (
        <circle
          cx="100"
          cy="100"
          r="68"
          fill="none"
          stroke="#a855f7"
          strokeWidth="3"
          strokeDasharray="6 4"
          opacity="0.6"
          filter={`url(#${uniqueId}-glow)`}
        />
      )}

      {/* Shoulders & Clothing */}
      {safeStyle === 0 && (
        // Explorer classic jacket
        <g>
          <path d="M40 200 C45 155 70 145 100 145 C130 145 155 155 160 200 Z" fill="#334155" />
          <path d="M85 145 L100 175 L115 145 Z" fill="#0284c7" />
        </g>
      )}

      {safeStyle === 1 && (
        // Cyborg tech armor
        <g>
          <path d="M40 200 C45 150 70 142 100 142 C130 142 155 150 160 200 Z" fill="#1e293b" />
          <path d="M75 160 L125 160 L100 190 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="100" y1="142" x2="100" y2="160" stroke="#38bdf8" strokeWidth="2" />
        </g>
      )}

      {safeStyle === 2 && (
        // Automaton mechanical chassis
        <g>
          <path d="M44 200 C48 152 75 142 100 142 C125 142 152 152 156 200 Z" fill="#475569" />
          <rect x="80" y="155" width="40" height="25" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="100" cy="167" r="4" fill="#10b981" />
        </g>
      )}

      {safeStyle === 3 && (
        // Astro Pilot flight suit
        <g>
          <path d="M38 200 C42 148 70 140 100 140 C130 140 158 148 162 200 Z" fill="#f8fafc" />
          <path d="M82 142 L100 168 L118 142 Z" fill="#0284c7" />
          <line x1="60" y1="170" x2="140" y2="170" stroke="#94a3b8" strokeWidth="2" />
        </g>
      )}

      {safeStyle === 4 && (
        // Synth holographic mantle
        <g>
          <path d="M40 200 C45 150 70 144 100 144 C130 144 155 150 160 200 Z" fill="#4c1d95" opacity="0.85" />
          <polygon points="100,150 120,185 80,185" fill="none" stroke="#c084fc" strokeWidth="2" />
        </g>
      )}

      {safeStyle === 5 && (
        // Shadow high collar cloak
        <g>
          <path d="M35 200 C40 142 65 135 100 135 C135 135 160 142 165 200 Z" fill="#09090b" />
          <path d="M72 136 L60 170 L100 150 L140 170 L128 136 Z" fill="#18181b" stroke="#e11d48" strokeWidth="1" />
        </g>
      )}

      {/* Neck */}
      <rect x="88" y="122" width="24" height="28" rx="4" fill={skin} opacity="0.9" />

      {/* Head / Face */}
      <ellipse cx="100" cy="98" rx="36" ry="42" fill={skin} />

      {/* Ears */}
      <circle cx="63" cy="98" r="8" fill={skin} />
      <circle cx="137" cy="98" r="8" fill={skin} />

      {/* Eyes & Eyebrows */}
      {safeStyle === 1 ? (
        // Cyborg Visor
        <g>
          <rect x="74" y="87" width="52" height="13" rx="4" fill="#0284c7" filter={`url(#${uniqueId}-glow)`} />
          <line x1="77" y1="93" x2="123" y2="93" stroke="#e0f2fe" strokeWidth="2" />
        </g>
      ) : safeStyle === 2 ? (
        // Automaton Hex / Square Optic Sensors
        <g>
          <rect x="79" y="89" width="10" height="9" rx="2" fill="#10b981" />
          <rect x="111" y="89" width="10" height="9" rx="2" fill="#10b981" />
          <circle cx="84" cy="93" r="2" fill="#ecfdf5" />
          <circle cx="116" cy="93" r="2" fill="#ecfdf5" />
        </g>
      ) : (
        // Organic Eyes
        <g>
          {/* Left Eye */}
          <circle cx="84" cy="95" r="4.5" fill="#0f172a" />
          <circle cx="82.5" cy="93.5" r="1.5" fill="#ffffff" />
          {/* Right Eye */}
          <circle cx="116" cy="95" r="4.5" fill="#0f172a" />
          <circle cx="114.5" cy="93.5" r="1.5" fill="#ffffff" />
          {/* Eyebrows */}
          <path d="M78 86 Q84 83 90 86" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M110 86 Q116 83 122 86" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )}

      {/* Nose */}
      <path d="M100 98 L98 107 L102 107" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Mouth */}
      {safeStyle === 2 ? (
        // Automaton digital speaker grid
        <line x1="92" y1="117" x2="108" y2="117" stroke="#10b981" strokeWidth="2" strokeDasharray="3 2" />
      ) : (
        // Natural Smile
        <path d="M92 116 Q100 122 108 116" stroke="rgba(0,0,0,0.4)" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}

      {/* Style Specific Face Accents */}
      {safeStyle === 3 && (
        // Astro Pilot Comms Mic
        <path d="M62 105 Q70 125 90 123" stroke="#0284c7" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}

      {/* Hairstyles (0-7) */}
      {safeHair === 0 && (
        // Buzz Crop
        <path d="M66 84 C66 60 80 56 100 56 C120 56 134 60 134 84 C126 72 115 70 100 70 C85 70 74 72 66 84 Z" fill={hair} />
      )}

      {safeHair === 1 && (
        // Slick Modern
        <path d="M64 82 C64 54 82 50 102 50 C122 50 138 56 136 82 C132 66 116 62 100 62 C84 62 70 68 64 82 Z" fill={hair} />
      )}

      {safeHair === 2 && (
        // Side Wave
        <path d="M62 88 C62 50 85 48 108 48 C132 48 142 58 138 88 C136 68 122 62 104 62 C80 62 70 72 62 88 Z" fill={hair} />
      )}

      {safeHair === 3 && (
        // Spiky Cyber
        <g fill={hair}>
          <polygon points="70,78 74,52 86,66 94,44 104,64 116,46 124,68 132,54 134,80" />
        </g>
      )}

      {safeHair === 4 && (
        // Afro Round
        <circle cx="100" cy="80" r="44" fill={hair} />
      )}

      {safeHair === 5 && (
        // Flow Ponytail
        <g fill={hair}>
          <path d="M64 84 C64 54 82 50 100 50 C118 50 136 54 136 84 C128 68 116 64 100 64 C84 64 72 68 64 84 Z" />
          <path d="M132 80 C155 90 160 120 152 145 C146 128 142 108 130 96 Z" />
        </g>
      )}

      {safeHair === 6 && (
        // Fitted Beanie
        <g>
          <ellipse cx="100" cy="74" rx="38" ry="24" fill={hair} />
          <rect x="62" y="70" width="76" height="14" rx="4" fill={hair} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
        </g>
      )}

      {safeHair === 7 && (
        // Crown Halo
        <g>
          <path d="M66 84 C66 60 80 56 100 56 C120 56 134 60 134 84 Z" fill="#1e293b" opacity="0.3" />
          <ellipse cx="100" cy="50" rx="36" ry="10" fill="none" stroke={hair} strokeWidth="3" filter={`url(#${uniqueId}-glow)`} />
        </g>
      )}
    </svg>
  );
}
