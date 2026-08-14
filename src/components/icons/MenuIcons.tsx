import React from 'react';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { colors } from '../../theme';

const SIZE = 17.993;
const VIEW_BOX = '0 0 17.9934 17.9934';
const STROKE = 1.49945;

export type MenuIconProps = {
  size?: number;
  color?: string;
};

/**
 * Glyphs on the profile menu tiles, exported from Figma (nodes 180:163686
 * onward). Sources kept at src/assets/icons/{edit,wallet-card,document,
 * message,sparkle,logout}.svg. The bell and chevron on that menu are the
 * project's existing exports, so they are not duplicated here.
 */

/** Pencil over a page (node 180:163686). */
export function EditIcon({
  size = SIZE,
  color = colors.text.inverse,
}: MenuIconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX} fill="none">
      <Defs>
        <ClipPath id="edit-clip">
          <Rect width={17.9934} height={17.9934} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#edit-clip)">
        <Path
          d="M8.24698 2.9989H2.9989C2.60122 2.9989 2.21983 3.15688 1.93863 3.43808C1.65743 3.71928 1.49945 4.10067 1.49945 4.49835V14.9945C1.49945 15.3922 1.65743 15.7736 1.93863 16.0548C2.21983 16.336 2.60122 16.4939 2.9989 16.4939H13.495C13.8927 16.4939 14.2741 16.336 14.5553 16.0548C14.8365 15.7736 14.9945 15.3922 14.9945 14.9945V9.74643"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M13.8699 1.87431C14.1682 1.57605 14.5727 1.40849 14.9945 1.40849C15.4163 1.40849 15.8208 1.57605 16.1191 1.87431C16.4173 2.17257 16.5849 2.5771 16.5849 2.9989C16.5849 3.4207 16.4173 3.82523 16.1191 4.12349L8.9967 11.2459L5.9978 11.9956L6.74752 8.9967L13.8699 1.87431Z"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

/** Payment card (node 180:163695). */
export function WalletCardIcon({
  size = SIZE,
  color = colors.text.inverse,
}: MenuIconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX} fill="none">
      <Defs>
        <ClipPath id="wallet-card-clip">
          <Rect width={17.9934} height={17.9934} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#wallet-card-clip)">
        <Path
          d="M14.9945 3.74863H2.9989C2.17078 3.74863 1.49945 4.41995 1.49945 5.24808V13.495C1.49945 14.3232 2.17078 14.9945 2.9989 14.9945H14.9945C15.8226 14.9945 16.4939 14.3232 16.4939 13.495V5.24808C16.4939 4.41995 15.8226 3.74863 14.9945 3.74863Z"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M1.49945 7.49725H16.4939"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M11.9956 11.9956C12.4097 11.9956 12.7453 11.6599 12.7453 11.2459C12.7453 10.8318 12.4097 10.4962 11.9956 10.4962C11.5815 10.4962 11.2459 10.8318 11.2459 11.2459C11.2459 11.6599 11.5815 11.9956 11.9956 11.9956Z"
          fill={color}
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

/** Page with a folded corner (node 180:163705). */
export function DocumentIcon({
  size = SIZE,
  color = colors.text.inverse,
}: MenuIconProps) {
  const line = {
    stroke: color,
    strokeWidth: STROKE,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX} fill="none">
      <Defs>
        <ClipPath id="document-clip">
          <Rect width={17.9934} height={17.9934} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#document-clip)">
        <Path
          d="M10.4962 1.49945H4.49835C4.10067 1.49945 3.71928 1.65743 3.43808 1.93863C3.15688 2.21983 2.9989 2.60122 2.9989 2.9989V14.9945C2.9989 15.3922 3.15688 15.7736 3.43808 16.0548C3.71928 16.336 4.10067 16.4939 4.49835 16.4939H13.495C13.8927 16.4939 14.2741 16.336 14.5553 16.0548C14.8365 15.7736 14.9945 15.3922 14.9945 14.9945V5.9978L10.4962 1.49945Z"
          {...line}
        />
        <Path d="M10.4962 1.49945V5.9978H14.9945" {...line} />
        <Path d="M11.9956 9.74642H5.9978" {...line} />
        <Path d="M11.9956 12.7453H5.9978" {...line} />
        <Path d="M7.49725 6.74753H6.74752H5.9978" {...line} />
      </G>
    </Svg>
  );
}

/** Speech bubble (node 180:163717). */
export function MessageIcon({
  size = SIZE,
  color = colors.text.inverse,
}: MenuIconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX} fill="none">
      <Path
        d="M15.7442 11.2459C15.7442 12.0706 15.0695 12.7453 14.2448 12.7453H5.24808L2.24918 15.7442V3.74863C2.24918 2.92393 2.92393 2.24918 3.74863 2.24918H14.2448C15.0695 2.24918 15.7442 2.92393 15.7442 3.74863V11.2459Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Radiating sun (node 180:163734). */
export function SparkleIcon({
  size = SIZE,
  color = colors.text.inverse,
}: MenuIconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX} fill="none">
      <Defs>
        <ClipPath id="sparkle-clip">
          <Rect width={17.9934} height={17.9934} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#sparkle-clip)">
        <Path
          d="M8.9967 11.2459C10.2389 11.2459 11.2459 10.2389 11.2459 8.9967C11.2459 7.75452 10.2389 6.74753 8.9967 6.74753C7.75452 6.74753 6.74753 7.75452 6.74753 8.9967C6.74753 10.2389 7.75452 11.2459 8.9967 11.2459Z"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M8.9967 0.749725V3.74863M8.9967 14.2448V17.2437M3.16384 3.16384L5.28556 5.28556M12.7078 12.7078L14.8296 14.8296M0.749725 8.9967H3.74863M14.2448 8.9967H17.2437M3.16384 14.8296L5.28556 12.7078M12.7078 5.28556L14.8296 3.16384"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

/** Door with an outbound arrow (node 180:163743). */
export function LogoutIcon({
  size = SIZE,
  color = colors.status.debit,
}: MenuIconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX} fill="none">
      <Path
        d="M6.74752 15.7442H3.74863C3.35095 15.7442 2.96956 15.5862 2.68835 15.305C2.40715 15.0238 2.24918 14.6425 2.24918 14.2448V3.74863C2.24918 3.35095 2.40715 2.96956 2.68835 2.68835C2.96956 2.40715 3.35095 2.24918 3.74863 2.24918H6.74752M11.9956 5.24808L15.7442 8.9967L11.9956 12.7453M15.7442 8.9967H6.74752"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Svg>
  );
}
