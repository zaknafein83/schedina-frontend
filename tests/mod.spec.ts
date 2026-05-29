import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { bootstrapOpenContest } from './helpers/seed'

test.describe('Mod — navigazione', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'mod')
  })

  test('login mod approda su /mod/contests', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('**/mod/contests', { timeout: 5_000 })
    await expect(page.getByRole('heading', { name: 'Concorsi' })).toBeVisible()
  })

  test('apre /mod/coupons (schedine area mod)', async ({ page }) => {
    await page.goto('/mod/coupons')
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('text=/errore/i')).toHaveCount(0)
  })

  test('apre /mod/players', async ({ page }) => {
    await page.goto('/mod/players')
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('text=/errore/i')).toHaveCount(0)
  })

  test('apre /mod/season-pools', async ({ page }) => {
    await page.goto('/mod/season-pools')
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('text=/errore/i')).toHaveCount(0)
  })

  test('apre /listini e /aiuto (condivisi)', async ({ page }) => {
    await page.goto('/listini')
    await expect(page.locator('text=/errore/i')).toHaveCount(0)
    await page.goto('/aiuto')
    await expect(page.locator('text=/errore/i')).toHaveCount(0)
  })

  test('mod NON può accedere a /admin/leagues', async ({ page }) => {
    await page.goto('/admin/leagues')
    // ProtectedRoute lo redirige da qualche parte (non rimane su /admin/leagues)
    await page.waitForLoadState('networkidle')
    expect(page.url()).not.toContain('/admin/leagues')
  })
})

test.describe('Mod — concorsi', () => {
  let contestId: number
  let contestName: string

  test.beforeAll(async () => {
    const seed = await bootstrapOpenContest({ matches: 2 })
    contestId = seed.contestId
    // Recupero il nome dal listing admin
    const res = await fetch('http://localhost:8081/admin/contests', {
      headers: { Authorization: `Bearer ${seed.token}` },
    })
    const list = await res.json()
    contestName = list.find((c: any) => c.id === contestId)?.name || ''
  })

  test('vede il concorso seedato in /mod/contests', async ({ page }) => {
    await loginAs(page, 'mod')
    await page.goto('/mod/contests')
    await expect(page.getByText(contestName)).toBeVisible()
    // Lo stato è OPEN dopo bootstrap
    await expect(page.getByText('Aperto').first()).toBeVisible()
  })

  test('apre la pagina di dettaglio /mod/contests/:id', async ({ page }) => {
    await loginAs(page, 'mod')
    await page.goto(`/mod/contests/${contestId}`)
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('text=/errore/i')).toHaveCount(0)
    // Mostra il nome del concorso da qualche parte
    await expect(page.getByText(contestName)).toBeVisible()
  })
})
