const colorMap = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  blue: 'bg-blue-100 text-blue-700',
  pink: 'bg-gds-pink-light text-gds-pink',
  gray: 'bg-gray-100 text-gds-gray',
  dark: 'bg-gds-dark text-white',
}

export default function Badge({ children, color = 'gray', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold
        ${colorMap[color] ?? colorMap.gray} ${className}`}
    >
      {children}
    </span>
  )
}
