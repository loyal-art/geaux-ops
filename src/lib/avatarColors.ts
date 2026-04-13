export const AVATAR_COLORS: Record<string, { bg: string; color: string }> = {
  gold:   { bg: 'rgba(200,164,78,0.20)',  color: '#C8A44E' },
  green:  { bg: 'rgba(74,222,128,0.20)',  color: '#4ADE80' },
  blue:   { bg: 'rgba(96,165,250,0.20)',  color: '#60A5FA' },
  purple: { bg: 'rgba(167,139,250,0.20)', color: '#A78BFA' },
  orange: { bg: 'rgba(251,146,60,0.20)',  color: '#FB923C' },
  red:    { bg: 'rgba(248,113,113,0.20)', color: '#F87171' },
  teal:   { bg: 'rgba(45,212,191,0.20)',  color: '#2DD4BF' },
  pink:   { bg: 'rgba(244,114,182,0.20)', color: '#F472B6' },
}

export function getAvatarStyle(avatarUrl: string | null | undefined): { bg: string; color: string } {
  return AVATAR_COLORS[avatarUrl ?? ''] ?? AVATAR_COLORS.gold
}
