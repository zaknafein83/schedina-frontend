import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, error, id, className = '', ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gds-dark"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        {...props}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-gds-dark
          placeholder:text-gray-400 bg-white outline-none transition-colors
          focus:ring-2 focus:ring-gds-pink focus:border-gds-pink
          ${error ? 'border-red-500' : 'border-gray-200'}
          ${className}`}
      />
      {error && (
        <p className="text-xs text-red-600 mt-0.5">{error}</p>
      )}
    </div>
  )
})

export default Input
