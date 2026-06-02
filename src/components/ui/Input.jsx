import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const Input = forwardRef(function Input(
  { label, error, id, className = '', type = 'text', ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const isPassword = type === 'password'
  const [showPassword, setShowPassword] = useState(false)
  const effectiveType = isPassword && showPassword ? 'text' : type

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gds-white"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
          {...props}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-gds-white
            placeholder:text-gds-gray bg-gds-surface outline-none transition-colors
            focus:ring-2 focus:ring-gds-pink focus:border-gds-pink
            ${isPassword ? 'pr-10' : ''}
            ${error ? 'border-red-500' : 'border-gds-border'}
            ${className}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
            className="absolute inset-y-0 right-0 flex items-center px-3
              text-gds-gray hover:text-gds-white transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-0.5">{error}</p>
      )}
    </div>
  )
})

export default Input
