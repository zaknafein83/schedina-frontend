import { Page } from '@playwright/test'
import { login } from './api'

/** Credenziali degli utenti seed (V6 + V7 del backend). */
export const USERS = {
  admin:  { email: 'admin@schedina.it',  password: '12345678', role: 'ADMIN' },
  mod:    { email: 'mod@schedina.it',    password: 'mod1234',  role: 'MOD'   },
  mario:  { email: 'mario@schedina.it',  password: 'user1234', role: 'USER'  },
  giulia: { email: 'giulia@schedina.it', password: 'user1234', role: 'USER'  },
} as const

export type SeedRole = keyof typeof USERS

/**
 * Login via API + iniezione del token in localStorage del Page.
 * Più veloce e affidabile della compilazione del form di login.
 * Naviga su `/` prima di scrivere in localStorage per evitare
 * SecurityError su origin opaca.
 */
export async function loginAs(page: Page, role: SeedRole): Promise<string> {
  const u = USERS[role]
  const token = await login(u.email, u.password)
  await page.goto('/')
  await page.evaluate((t) => localStorage.setItem('token', t), token)
  return token
}
