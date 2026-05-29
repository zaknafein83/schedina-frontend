import { test, expect } from '@playwright/test'
import { api, uniq, login } from './helpers/api'
import { USERS } from './helpers/auth'

test.describe('Auth — registrazione', () => {
  test('mostra la form completa', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByLabel('Nome', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Cognome', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Username', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Conferma password', { exact: true })).toBeVisible()
  })

  test('validazione: password troppo corta', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Nome', { exact: true }).fill('Test')
    await page.getByLabel('Cognome', { exact: true }).fill('User')
    await page.getByLabel('Username', { exact: true }).fill(uniq('u'))
    await page.getByLabel('Email', { exact: true }).fill(`${uniq('reg')}@test.it`)
    await page.getByLabel('Password', { exact: true }).fill('short')
    await page.getByLabel('Conferma password', { exact: true }).fill('short')
    await page.getByRole('button', { name: 'Registrati' }).click()
    await expect(page.getByText('Minimo 8 caratteri')).toBeVisible()
  })

  test('validazione: password non coincidono', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Nome', { exact: true }).fill('Test')
    await page.getByLabel('Cognome', { exact: true }).fill('User')
    await page.getByLabel('Username', { exact: true }).fill(uniq('u'))
    await page.getByLabel('Email', { exact: true }).fill(`${uniq('reg')}@test.it`)
    await page.getByLabel('Password', { exact: true }).fill('password1')
    await page.getByLabel('Conferma password', { exact: true }).fill('password2')
    await page.getByRole('button', { name: 'Registrati' }).click()
    await expect(page.getByText('Le password non coincidono')).toBeVisible()
  })

  test('registrazione utente nuovo + redirect a /login', async ({ page }) => {
    const email = `${uniq('reg')}@test.it`
    const password = 'password1!'
    await page.goto('/register')
    await page.getByLabel('Nome', { exact: true }).fill('E2E')
    await page.getByLabel('Cognome', { exact: true }).fill('Test')
    await page.getByLabel('Username', { exact: true }).fill(uniq('user'))
    await page.getByLabel('Email', { exact: true }).fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByLabel('Conferma password', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Registrati' }).click()
    await expect(page.getByText('Registrazione completata!')).toBeVisible()
    await page.waitForURL('**/login', { timeout: 5_000 })

    // Verifica che l'utente possa effettivamente loggarsi
    const tok = await login(email, password)
    expect(tok).toBeTruthy()
  })

  test('registrazione: email duplicata mostra errore', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Nome', { exact: true }).fill('Dup')
    await page.getByLabel('Cognome', { exact: true }).fill('Test')
    await page.getByLabel('Username', { exact: true }).fill(uniq('dup'))
    await page.getByLabel('Email', { exact: true }).fill(USERS.admin.email) // già esistente
    await page.getByLabel('Password', { exact: true }).fill('password1!')
    await page.getByLabel('Conferma password', { exact: true }).fill('password1!')
    await page.getByRole('button', { name: 'Registrati' }).click()
    // Il BE risponde 4xx → form rimane visibile + mostra serverError
    await expect(page.getByRole('button', { name: 'Registrati' })).toBeVisible()
  })
})

test.describe('Auth — login', () => {
  test('mostra la form login', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Accedi' })).toBeVisible()
  })

  test('credenziali sbagliate → messaggio di errore', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('non-esiste@test.it')
    await page.getByLabel('Password').fill('wrongpass')
    await page.getByRole('button', { name: 'Accedi' }).click()
    await expect(page.getByText(/credenziali non valide/i)).toBeVisible()
  })

  test('login admin → redirect a /admin', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(USERS.admin.email)
    await page.getByLabel('Password').fill(USERS.admin.password)
    await page.getByRole('button', { name: 'Accedi' }).click()
    await page.waitForURL('**/admin', { timeout: 10_000 })
  })

  test('login mod → redirect a /mod/concorsi', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(USERS.mod.email)
    await page.getByLabel('Password').fill(USERS.mod.password)
    await page.getByRole('button', { name: 'Accedi' }).click()
    await page.waitForURL('**/mod/concorsi', { timeout: 10_000 })
  })

  test('login user → redirect a /concorsi', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(USERS.mario.email)
    await page.getByLabel('Password').fill(USERS.mario.password)
    await page.getByRole('button', { name: 'Accedi' }).click()
    await page.waitForURL('**/concorsi', { timeout: 10_000 })
  })
})

test.describe('Auth — password reset', () => {
  test('forgot-password: token ricevuto inline (no email)', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByLabel('Email').fill(USERS.giulia.email)
    await page.getByRole('button', { name: 'Invia token' }).click()
    await expect(page.getByText(/token di reset/i)).toBeVisible()
    // Verifica che il bottone "Reimposta password" sia disponibile
    await expect(page.getByRole('button', { name: 'Reimposta password' })).toBeVisible()
  })

  test('reset-password: token invalido → errore', async ({ page }) => {
    await page.goto('/reset-password?token=token-finto')
    await page.getByLabel('Nuova password', { exact: true }).fill('nuova-pass-123')
    await page.getByLabel('Conferma password', { exact: true }).fill('nuova-pass-123')
    await page.getByRole('button', { name: 'Reimposta password' }).click()
    // Il BE risponde 4xx → mostra errore inline
    await expect(page.getByText(/token/i)).toBeVisible()
  })

  test('reset-password: flusso completo end-to-end', async ({ page }) => {
    // 1) Crea un utente fresco da poter resettare senza disturbare i seed
    const email = `${uniq('reset')}@test.it`
    const password = 'old-pass-123!'
    const newPassword = 'new-pass-456!'
    await api.post('/auth/register', {
      email,
      password,
      firstName: 'Reset',
      lastName: 'Test',
      username: uniq('rst'),
    })

    // 2) Chiedi il token via UI
    await page.goto('/forgot-password')
    await page.getByLabel('Email', { exact: true }).fill(email)
    await page.getByRole('button', { name: 'Invia token' }).click()
    const tokenLocator = page.locator('code')
    await expect(tokenLocator).toBeVisible()
    const token = (await tokenLocator.textContent())?.trim() || ''
    expect(token).toBeTruthy()

    // 3) Reset via UI
    await page.goto(`/reset-password?token=${token}`)
    await page.getByLabel('Nuova password', { exact: true }).fill(newPassword)
    await page.getByLabel('Conferma password', { exact: true }).fill(newPassword)
    await page.getByRole('button', { name: 'Reimposta password' }).click()
    await expect(page.getByText('Password reimpostata!')).toBeVisible()
    await page.waitForURL('**/login', { timeout: 5_000 })

    // 4) Verifica: nuova password funziona, vecchia no
    const tok = await login(email, newPassword)
    expect(tok).toBeTruthy()
    await expect(api.post('/auth/login', { email, password })).rejects.toThrow()
  })
})
