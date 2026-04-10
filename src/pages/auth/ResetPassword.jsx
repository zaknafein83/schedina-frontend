import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authApi } from '../../api/client'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { CheckCircle } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token') || ''
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { token: tokenFromUrl },
  })

  const password = watch('newPassword')

  async function onSubmit(data) {
    setServerError('')
    try {
      await authApi.resetPassword(data.token, data.newPassword)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          'Reset fallito. Il token potrebbe essere scaduto.'
      )
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gds-gray-light flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 w-full max-w-sm text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gds-dark mb-2">
            Password reimpostata!
          </h2>
          <p className="text-gds-gray text-sm">
            Reindirizzamento al login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gds-gray-light flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl font-black text-gds-pink tracking-tight">
            SCHEDINA
          </span>
          <p className="text-gds-gray text-sm mt-1">Reimposta password</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Token di reset"
            placeholder="Incolla il token ricevuto"
            error={errors.token?.message}
            {...register('token', { required: 'Token obbligatorio' })}
          />

          <Input
            label="Nuova password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.newPassword?.message}
            {...register('newPassword', {
              required: 'Password obbligatoria',
              minLength: { value: 8, message: 'Minimo 8 caratteri' },
            })}
          />

          <Input
            label="Conferma password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Conferma la password',
              validate: (v) => v === password || 'Le password non coincidono',
            })}
          />

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full mt-2">
            Reimposta password
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gds-gray">
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
