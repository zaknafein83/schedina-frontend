import Spinner from '../Spinner'

const variants = {
  primary:
    'bg-pg-gradient text-white hover:shadow-pg-glow focus:ring-gds-pink disabled:opacity-60',
  secondary:
    'bg-gds-surface text-gds-white border border-gds-border hover:border-gds-pink focus:ring-gds-pink disabled:opacity-60',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:opacity-60',
  ghost:
    'bg-transparent text-gds-gray hover:bg-gds-pink-light hover:text-gds-white focus:ring-gds-pink disabled:opacity-60',
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold
        transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gds-dark
        ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
