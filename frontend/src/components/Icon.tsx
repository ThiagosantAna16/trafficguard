import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// Minimal single-stroke line icons — no filled glyphs, no emoji.
// Every icon shares the same visual language: 24x24 viewBox, round caps/joins.

export function HomeIcon({ size = 20, color = '#EEF1F5', strokeWidth = 1.6 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 11 12 4l8 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 10v9h5v-5h2v5h5v-9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function RouteIcon({ size = 20, color = '#EEF1F5', strokeWidth = 1.6 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={7} cy={6} r={2} stroke={color} strokeWidth={strokeWidth} />
      <Circle cx={17} cy={18} r={2} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M7 8v3a4 4 0 0 0 4 4h2a4 4 0 0 1 4 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function BellIcon({ size = 20, color = '#EEF1F5', strokeWidth = 1.6 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 16v-4a6 6 0 0 1 12 0v4l1.5 2.5h-15z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 20a2 2 0 0 0 4 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function PersonIcon({ size = 20, color = '#EEF1F5', strokeWidth = 1.6 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={3.2} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M5 20c1.2-4 4-6 7-6s5.8 2 7 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function SearchIcon({ size = 16, color = '#0A0E13', strokeWidth = 1.8 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={10.5} cy={10.5} r={6} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M15 15l5 5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function EditIcon({ size = 15, color = '#EEF1F5', strokeWidth = 1.6 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckIcon({ size = 17, color = '#0A0E13', strokeWidth = 1.9 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12l5 5L20 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MailIcon({ size = 15, color = '#5B646F', strokeWidth = 1.5 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={14} rx={1} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M3 6l9 7 9-7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LockIcon({ size = 15, color = '#74B3DE', strokeWidth = 1.5 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={10} width={14} height={10} rx={1.5} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M8 10V7a4 4 0 0 1 8 0v3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function LogOutIcon({ size = 15, color = '#EEF1F5', strokeWidth = 1.7 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11 12h9m0 0-3-3m3 3-3 3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
