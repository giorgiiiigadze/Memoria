export const fontWeight = {
  regular: '400',  // body, secondary text, metadata
  bold: '800',     // headings, names, key labels, CTAs
} as const

export const fontSize = {
  xs: 12,   // timestamps, metadata
  sm: 14,   // secondary text
  md: 16,   // body (default)
  lg: 18,   // emphasized body, list titles
  xl: 22,   // section headings
  '2xl': 28, // screen titles
} as const

export const lineHeight = {
  tight: 1.15,  // headings — BeReal sets these snug
  normal: 1.4,  // body
  relaxed: 1.6, // longer reading passages
} as const