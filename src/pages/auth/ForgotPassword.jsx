import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authApi } from '../../api/client'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { Copy, CheckCircle } from 'lucide-react'

export default function ForgotPassword() {
  const [result, setResult] = useState(null)
  const [serverError, setServerError] = useState('')
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  async function onSubmit(data) {
    setServerError('')
    setResult(null)
    try {
      const res = await authApi.forgotPassword(data.email)
      setResult(res.data)
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          'Richiesta fallita. Controlla l\'email inserita.'
      )
    }
  }

  function handleCopy() {
    if (result?.resetToken) {
      navigator.clipboard.writeText(result.resetToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gds-gray-light flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl font-black text-gds-pink tracking-tight">
            SCHEDINA
          </span>
          <p className="text-gds-gray text-sm mt-1">Recupera password</p>
        </div>

        {!result ? (
          <>
            <p className="text-sm text-gds-gray mb-4">
              Inserisci la tua email. Riceverai un token per reimpostare la
              password.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="nome@email.com"
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email obbligatoria',
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: 'Email non valida',
                  },
                })}
              />

              {serverError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {serverError}
                </p>
              )}

              <Button type="submit" loading={isSubmitting} className="w-full">
                Invia token
              </Button>
            </form>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg px-4 py-3">
              <CheckCircle size={18} />
              <span className="text-sm font-medium">{result.message}</span>
            </div>

            {result.resetToken && (
              <div className="bg-gds-pink-light border border-gds-pink/20 rounded-lg p-4">
                <p className="text-xs font-semibold text-gds-pink uppercase tracking-wide mb-2">
                  Token di reset
                </p>
                <div className="flex items-start gap-2">
                  <code className="flex-1 text-sm text-gds-dark break-all font-mono bg-white rounded px-2 py-1.5 border border-gds-pink/20">
                    {result.resetToken}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 p-1.5 rounded hover:bg-gds-pink/10 transition-colors text-gds-pink"
                    title="Copia token"
                  >
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                {result.expiresAt && (
                  <p className="text-xs text-gds-gray mt-2">
                    Scade il:{' '}
                    {new Date(result.expiresAt).toLocaleString('it-IT')}
                  </p>
                )}
              </div>
            )}

            <Link
              to={`/reset-password${result.resetToken ? `?token=${result.resetToken}` : ''}`}
              className="block"
            >
              <Button className="w-full">Reimposta password</Button>
            </Link>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gds-gray">
          <Link
            to="/login"
            className="text-gds-pink hover:text-gds-pink-dark font-medium"
          >
            Torna al login
          </Link>
        </p>
      </div>
    </div>
  )
}
