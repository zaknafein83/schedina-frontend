import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { bootstrapOpenContest } from './helpers/seed'

test.describe('User — navigazione', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'mario')
  })

  test('apre /contests dopo il login', async ({ page }) => {
    await page.goto('/contests')
    await expect(page.getByRole('heading', { name: 'Concorsi aperti' })).toBeVisible()
  })

  test('apre /my-coupons', async ({ page }) => {
    await page.goto('/my-coupons')
    await expect(page.getByRole('heading', { name: /schedine/i }).first()).toBeVisible()
  })

  test('apre /notifications', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page.getByRole('heading', { name: 'Notifiche' })).toBeVisible()
  })

  test('apre /season-pool', async ({ page }) => {
    await page.goto('/season-pool')
    // La pagina carica senza errori. Non sappiamo se ci siano pool aperti.
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('text=/errore/i')).toHaveCount(0)
  })

  test('apre /my-season-coupons', async ({ page }) => {
    await page.goto('/my-season-coupons')
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('text=/errore/i')).toHaveCount(0)
  })

  test('apre /listini', async ({ page }) => {
    await page.goto('/listini')
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('text=/errore/i')).toHaveCount(0)
  })

  test('apre /aiuto (guida)', async ({ page }) => {
    await page.goto('/aiuto')
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('text=/errore/i')).toHaveCount(0)
  })

  test('logout pulisce il token e reindirizza al login', async ({ page }) => {
    await page.goto('/contests')
    await page.getByRole('button', { name: 'Esci' }).first().click()
    await page.waitForURL('**/login', { timeout: 5_000 })
    const token = await page.evaluate(() => localStorage.getItem('token'))
    expect(token).toBeNull()
  })
})

test.describe('User — concorsi e compilazione schedina', () => {
  // Concorso seedato una volta per tutto il describe per evitare lentezza
  let contestId: number
  let matchIds: number[]
  let contestName: string

  test.beforeAll(async () => {
    const seed = await bootstrapOpenContest({ matches: 3 })
    contestId = seed.contestId
    matchIds = seed.matchIds
    // Recupero il nome dal listing (per cercarlo poi nell'UI)
    const res = await fetch('http://localhost:8081/contests', {
      headers: { Authorization: `Bearer ${seed.token}` },
    })
    const list = await res.json()
    contestName = list.find((c: any) => c.id === contestId)?.name || ''
  })

  test('il concorso seedato compare nella lista /contests', async ({ page }) => {
    await loginAs(page, 'mario')
    await page.goto('/contests')
    await expect(page.getByText(contestName)).toBeVisible()
  })

  test('apre la pagina di dettaglio del concorso', async ({ page }) => {
    await loginAs(page, 'mario')
    await page.goto(`/contests/${contestId}`)
    await expect(page.getByRole('heading', { name: 'Compila la schedina' })).toBeVisible()
    // 3 partite seedate
    const matchRows = page.locator('text=/\\bvs\\b/')
    await expect(matchRows).toHaveCount(3)
  })

  test('submit senza selezioni mostra errore', async ({ page }) => {
    await loginAs(page, 'mario')
    await page.goto(`/contests/${contestId}`)
    await page.getByRole('button', { name: 'Invia schedina' }).click()
    await expect(page.getByText(/devi selezionare almeno un esito/i)).toBeVisible()
  })

  test('compila, invia una schedina e la ritrova via API', async ({ page }) => {
    // Uso giulia per non collidere con mario
    const token = await loginAs(page, 'giulia')
    await page.goto(`/contests/${contestId}`)
    await expect(page.getByRole('heading', { name: 'Compila la schedina' })).toBeVisible()

    // Per ogni partita seleziono "1"
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: '1', exact: true }).nth(i).click()
    }
    await page.getByRole('button', { name: 'Invia schedina' }).click()
    await page.waitForURL('**/my-coupons', { timeout: 10_000 })

    // Verifico tramite API: la coupon esiste per il contestId
    const res = await fetch('http://localhost:8081/coupons', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const coupons = await res.json()
    expect(Array.isArray(coupons)).toBe(true)
    expect(coupons.find((c: any) => c.contestId === contestId)).toBeTruthy()

    // E /my-coupons non mostra errori
    await expect(page.locator('text=/errore/i')).toHaveCount(0)
  })
})
