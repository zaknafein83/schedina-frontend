import Spinner from '../Spinner'

const variants = {
  primary:
    'bg-gds-pink text-white hover:bg-gds-pink-dark focus:ring-gds-pink disabled:opacity-60',
  secondary:
    'bg-white text-gds-dark border border-gray-200 hover:bg-gds-gray-light focus:ring-gray-300 disabled:opacity-60',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:opacity-60',
  ghost:
    'bg-transparent text-gds-gray hover:bg-gds-gray-light focus:ring-gray-300 disabled:opacity-60',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  ...props
}) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1
        ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
