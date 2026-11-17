import React from 'react';
import type { PoseId } from '@/features/cat/types';
import { cn } from '@/lib/cn';

export interface CatAccessoryProps {
  outfitId: string | null;
  poseId?: PoseId;
  catId?: string;
  className?: string;
}

/**
 * Procedural vector accessory overlay component.
 * Renders on top of the cat body in standard 320x320 viewBox coordinates.
 * Adjusts layout coordinates for standard poses vs dynamic stretch/nap poses.
 * Customized palette accents for Mochi (cream tabby) and Chai (warm calico).
 */
export const CatAccessory: React.FC<CatAccessoryProps> = ({
  outfitId,
  poseId = 'idle_happy',
  catId = 'mochi',
  className = '',
}) => {
  if (!outfitId || outfitId === 'none') {
    return null;
  }

  const isChai = catId === 'chai';
  const isStretch = poseId === 'stretch';
  const isNap = poseId === 'break_nap';

  // Palette definitions tailored to character coats
  const palette = {
    glasses: {
      stroke: isChai ? '#8C6838' : '#65554D',
      glint: 'rgba(255, 255, 255, 0.45)',
    },
    scarf: {
      main: isChai ? '#2C6456' : '#B23B2A',
      shadow: isChai ? '#1F473D' : '#8A2D1F',
      accent: isChai ? '#E29578' : '#FFF5EA',
      stroke: '#4A3E3D',
    },
    beanie: {
      main: isChai ? '#A8482E' : '#D9953B',
      cuff: isChai ? '#8A3B25' : '#BD7E2E',
      pom: '#FFF5EA',
      stroke: '#4A3E3D',
    },
    bow: {
      main: isChai ? '#E26D5C' : '#E57373',
      shadow: isChai ? '#BF5343' : '#C45757',
      stroke: '#4A3E3D',
    },
    headphones: {
      band: '#4A3E3D',
      cushion: isChai ? '#EAE2D5' : '#E8E2D8',
      accent: isChai ? '#E29578' : '#D9953B',
      stroke: '#4A3E3D',
    },
  };

  return (
    <svg
      viewBox="0 0 320 320"
      width="100%"
      height="100%"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('pointer-events-none drop-shadow-xs select-none', className)}
      aria-hidden="true"
      data-testid={`accessory-layer-${outfitId}`}
      data-outfit-id={outfitId}
      data-pose-id={poseId}
      data-cat-id={catId}
    >
      {/* 1. Wire Glasses */}
      {outfitId === 'glasses' && !isStretch && !isNap && (
        <g id="accessory-glasses">
          {/* Spectacle frames */}
          <circle
            cx="142"
            cy="116"
            r="16"
            stroke={palette.glasses.stroke}
            strokeWidth="3.5"
            fill="none"
          />
          <circle
            cx="178"
            cy="116"
            r="16"
            stroke={palette.glasses.stroke}
            strokeWidth="3.5"
            fill="none"
          />
          {/* Bridge */}
          <line
            x1="158"
            y1="116"
            x2="162"
            y2="116"
            stroke={palette.glasses.stroke}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Temples extending toward ears */}
          <path
            d="M126 116 L108 110"
            stroke={palette.glasses.stroke}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M194 116 L212 110"
            stroke={palette.glasses.stroke}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Subtle reflection glints */}
          <path
            d="M136 109 Q142 105 147 109"
            stroke={palette.glasses.glint}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M172 109 Q178 105 183 109"
            stroke={palette.glasses.glint}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      )}

      {outfitId === 'glasses' && isStretch && (
        <g id="accessory-glasses-stretch">
          <circle
            cx="110"
            cy="196"
            r="13"
            stroke={palette.glasses.stroke}
            strokeWidth="3"
            fill="none"
          />
          <circle
            cx="140"
            cy="196"
            r="13"
            stroke={palette.glasses.stroke}
            strokeWidth="3"
            fill="none"
          />
          <line
            x1="123"
            y1="196"
            x2="127"
            y2="196"
            stroke={palette.glasses.stroke}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M97 196 L82 191"
            stroke={palette.glasses.stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      )}

      {outfitId === 'glasses' && isNap && (
        <g id="accessory-glasses-nap">
          {/* Folded resting spectacles beside sleeping cat */}
          <ellipse
            cx="100"
            cy="215"
            rx="10"
            ry="7"
            stroke={palette.glasses.stroke}
            strokeWidth="2.5"
            fill="none"
          />
          <ellipse
            cx="120"
            cy="215"
            rx="10"
            ry="7"
            stroke={palette.glasses.stroke}
            strokeWidth="2.5"
            fill="none"
          />
          <line
            x1="110"
            y1="215"
            x2="110"
            y2="215"
            stroke={palette.glasses.stroke}
            strokeWidth="2.5"
          />
        </g>
      )}

      {/* 2. Cozy Knit Scarf */}
      {outfitId === 'scarf' && !isStretch && !isNap && (
        <g id="accessory-scarf">
          {/* Hanging tails first (behind neck loop) */}
          <path
            d="M172 176 L175 224 L193 224 L190 176 Z"
            fill={palette.scarf.main}
            stroke={palette.scarf.stroke}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* Fringe on tail */}
          <line
            x1="177"
            y1="224"
            x2="177"
            y2="230"
            stroke={palette.scarf.accent}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="184"
            y1="224"
            x2="184"
            y2="230"
            stroke={palette.scarf.accent}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="191"
            y1="224"
            x2="191"
            y2="230"
            stroke={palette.scarf.accent}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Main neck wrap */}
          <path
            d="M116 164 C120 182 150 188 160 188 C170 188 200 182 204 164 C206 156 195 152 160 152 C125 152 114 156 116 164 Z"
            fill={palette.scarf.main}
            stroke={palette.scarf.stroke}
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          {/* Cozy rib folds */}
          <path
            d="M135 158 Q140 178 145 186"
            stroke={palette.scarf.shadow}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M160 155 Q162 176 163 187"
            stroke={palette.scarf.shadow}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M182 158 Q179 178 177 186"
            stroke={palette.scarf.shadow}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      )}

      {outfitId === 'scarf' && isStretch && (
        <g id="accessory-scarf-stretch">
          <path
            d="M92 232 C96 244 120 248 135 248 C150 248 162 244 165 232 C167 225 155 220 135 220 C115 220 90 225 92 232 Z"
            fill={palette.scarf.main}
            stroke={palette.scarf.stroke}
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </g>
      )}

      {outfitId === 'scarf' && isNap && (
        <g id="accessory-scarf-nap">
          <path
            d="M90 220 C95 235 125 240 145 240 C165 240 185 235 190 220 Z"
            fill={palette.scarf.main}
            stroke={palette.scarf.stroke}
            strokeWidth="4"
          />
        </g>
      )}

      {/* 3. Slouchy Beanie */}
      {outfitId === 'beanie' && !isStretch && !isNap && (
        <g id="accessory-beanie">
          {/* Slouch cap body */}
          <path
            d="M116 88 C110 52 145 42 165 42 C185 42 208 55 204 88 Z"
            fill={palette.beanie.main}
            stroke={palette.beanie.stroke}
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          {/* Slouch fold crease */}
          <path
            d="M138 60 Q162 52 186 64"
            stroke={palette.beanie.cuff}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Folded ribbed brim band */}
          <rect
            x="110"
            y="82"
            width="100"
            height="14"
            rx="7"
            fill={palette.beanie.cuff}
            stroke={palette.beanie.stroke}
            strokeWidth="4"
          />
          {/* Pom-pom top puff */}
          <circle
            cx="165"
            cy="36"
            r="8"
            fill={palette.beanie.pom}
            stroke={palette.beanie.stroke}
            strokeWidth="3.5"
          />
        </g>
      )}

      {outfitId === 'beanie' && isStretch && (
        <g id="accessory-beanie-stretch">
          <path
            d="M90 178 C86 150 115 142 130 142 C145 142 162 152 158 178 Z"
            fill={palette.beanie.main}
            stroke={palette.beanie.stroke}
            strokeWidth="3.5"
          />
          <rect
            x="86"
            y="173"
            width="76"
            height="11"
            rx="5.5"
            fill={palette.beanie.cuff}
            stroke={palette.beanie.stroke}
            strokeWidth="3"
          />
          <circle
            cx="130"
            cy="137"
            r="6"
            fill={palette.beanie.pom}
            stroke={palette.beanie.stroke}
            strokeWidth="3"
          />
        </g>
      )}

      {outfitId === 'beanie' && isNap && (
        <g id="accessory-beanie-nap">
          <ellipse
            cx="135"
            cy="170"
            rx="28"
            ry="18"
            fill={palette.beanie.main}
            stroke={palette.beanie.stroke}
            strokeWidth="3.5"
          />
        </g>
      )}

      {/* 4. Silk Ribbon Bow */}
      {outfitId === 'bow' && !isStretch && !isNap && (
        <g id="accessory-bow">
          {/* Ribbon tails */}
          <path
            d="M158 174 L146 198 L155 194 L161 176 Z"
            fill={palette.bow.shadow}
            stroke={palette.bow.stroke}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M162 174 L174 198 L165 194 L159 176 Z"
            fill={palette.bow.shadow}
            stroke={palette.bow.stroke}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Left loop */}
          <path
            d="M160 171 C142 158 132 170 144 179 C152 184 158 176 160 171 Z"
            fill={palette.bow.main}
            stroke={palette.bow.stroke}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Right loop */}
          <path
            d="M160 171 C178 158 188 170 176 179 C168 184 162 176 160 171 Z"
            fill={palette.bow.main}
            stroke={palette.bow.stroke}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Center knot */}
          <circle
            cx="160"
            cy="172"
            r="4.5"
            fill={palette.bow.shadow}
            stroke={palette.bow.stroke}
            strokeWidth="3"
          />
        </g>
      )}

      {outfitId === 'bow' && isStretch && (
        <g id="accessory-bow-stretch">
          <circle
            cx="125"
            cy="242"
            r="4"
            fill={palette.bow.shadow}
            stroke={palette.bow.stroke}
            strokeWidth="2.5"
          />
          <ellipse
            cx="115"
            cy="242"
            rx="8"
            ry="5"
            fill={palette.bow.main}
            stroke={palette.bow.stroke}
            strokeWidth="2.5"
          />
          <ellipse
            cx="135"
            cy="242"
            rx="8"
            ry="5"
            fill={palette.bow.main}
            stroke={palette.bow.stroke}
            strokeWidth="2.5"
          />
        </g>
      )}

      {outfitId === 'bow' && isNap && (
        <g id="accessory-bow-nap">
          <circle
            cx="140"
            cy="234"
            r="4"
            fill={palette.bow.shadow}
            stroke={palette.bow.stroke}
            strokeWidth="2.5"
          />
        </g>
      )}

      {/* 5. Studio Headphones */}
      {outfitId === 'headphones' && !isStretch && !isNap && (
        <g id="accessory-headphones">
          {/* Outer metal headband arch */}
          <path
            d="M106 126 C100 68 135 52 160 52 C185 52 220 68 214 126"
            stroke={palette.headphones.band}
            strokeWidth="5.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Top padded leather comfort strap */}
          <path
            d="M132 58 C144 54 156 54 168 54 C178 54 186 58 188 60"
            stroke={palette.headphones.accent}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Left earcup outer housing */}
          <rect
            x="96"
            y="108"
            width="14"
            height="28"
            rx="7"
            fill={palette.headphones.cushion}
            stroke={palette.headphones.stroke}
            strokeWidth="4"
          />
          <ellipse
            cx="103"
            cy="122"
            rx="3"
            ry="8"
            fill={palette.headphones.accent}
          />
          {/* Right earcup outer housing */}
          <rect
            x="210"
            y="108"
            width="14"
            height="28"
            rx="7"
            fill={palette.headphones.cushion}
            stroke={palette.headphones.stroke}
            strokeWidth="4"
          />
          <ellipse
            cx="217"
            cy="122"
            rx="3"
            ry="8"
            fill={palette.headphones.accent}
          />
        </g>
      )}

      {outfitId === 'headphones' && isStretch && (
        <g id="accessory-headphones-stretch">
          <path
            d="M80 196 C76 150 105 138 125 138 C145 138 174 150 170 196"
            stroke={palette.headphones.band}
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
          <rect
            x="72"
            y="184"
            width="12"
            height="22"
            rx="6"
            fill={palette.headphones.cushion}
            stroke={palette.headphones.stroke}
            strokeWidth="3.5"
          />
          <rect
            x="166"
            y="184"
            width="12"
            height="22"
            rx="6"
            fill={palette.headphones.cushion}
            stroke={palette.headphones.stroke}
            strokeWidth="3.5"
          />
        </g>
      )}

      {outfitId === 'headphones' && isNap && (
        <g id="accessory-headphones-nap">
          {/* Headphones resting beside resting cat */}
          <ellipse
            cx="155"
            cy="235"
            rx="16"
            ry="10"
            fill={palette.headphones.cushion}
            stroke={palette.headphones.stroke}
            strokeWidth="3"
          />
        </g>
      )}
    </svg>
  );
};

export default CatAccessory;
