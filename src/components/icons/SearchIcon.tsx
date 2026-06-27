import Svg, { Path } from 'react-native-svg'

export function SearchIcon({ size = 24, color = '#000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1028 1028" fill="none">
      <Path
        d="M899.5 899.5L713.604 713.603"
        stroke={color}
        strokeWidth={80}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M471.167 813.833C660.416 813.833 813.833 660.416 813.833 471.167C813.833 281.917 660.416 128.5 471.167 128.5C281.917 128.5 128.5 281.917 128.5 471.167C128.5 660.416 281.917 813.833 471.167 813.833Z"
        stroke={color}
        strokeWidth={80}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
