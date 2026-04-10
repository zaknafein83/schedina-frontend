import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../context/AuthContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  async function onSubmit(data) {
    setServerError('')
    try {
      const user = await login(data.email, data.password)
      // ProtectedRoute mostrerà uno spinner mentre user si carica,
      // poi renderizzerà la pagina corretta
      navigate(user.role === 'ADMIN' ? '/admin' : '/contests', { replace: true })
    } catch (err) {
      setServerError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Credenziali non valide. Riprova.'
      )
    }
  }

  return (
    <div className="min-h-screen bg-gds-gray-light flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl font-black text-gds-pink tracking-tight">
            SCHEDINA
          </span>
          <p className="text-gds-gray text-sm mt-1">Accedi al tuo account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="nome@email.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email obbligatoria',
              pattern: { value: /\S+@\S+\.\S+/, message: 'Email non valida' },
            })}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', { required: 'Password obbligatoria' })}
          />

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full mt-2">
            Accedi
          </Button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <Link
            to="/forgot-password"
            className="text-sm text-gds-pink hover:text-gds-pink-dark transition-colors block"
          >
            Password dimenticata?
          </Link>
          <p className="text-sm text-gds-gray">
            Non hai un account?{' '}
            <Link
              to="/register"
              className="text-gds-pink hover:text-gds-pink-dark font-medium"
            >
              Registrati
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
