import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authApi } from '../../api/client'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function Register() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()

  const password = watch('password')

  async function onSubmit(data) {
    setServerError('')
    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Registrazione fallita. Riprova.'
      )
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gds-gray-light flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 w-full max-w-sm text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-gds-dark mb-2">
            Registrazione completata!
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
          <p className="text-gds-gray text-sm mt-1">Crea il tuo account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nome"
              placeholder="Mario"
              error={errors.firstName?.message}
              {...register('firstName', { required: 'Nome obbligatorio' })}
            />
            <Input
              label="Cognome"
              placeholder="Rossi"
              error={errors.lastName?.message}
              {...register('lastName', { required: 'Cognome obbligatorio' })}
            />
          </div>

          <Input
            label="Username"
            placeholder="mariorossi99"
            error={errors.username?.message}
            {...register('username', {
              required: 'Username obbligatorio',
              minLength: { value: 3, message: 'Minimo 3 caratteri' },
            })}
          />

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
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', {
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
            Registrati
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gds-gray">
          Hai già un account?{' '}
          <Link
            to="/login"
            className="text-gds-pink hover:text-gds-pink-dark font-medium"
          >
            Accedi
          </Link>
        </p>
      </div>
    </div>
  )
}
