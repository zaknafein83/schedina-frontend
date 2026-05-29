import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { uniq, api } from './helpers/api'
import {
  bootstrapOpenContest,
  createLeague,
  createTeam,
  createRule,
  getAdminToken,
} from './helpers/seed'

test.describe('Admin — navigazione & dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin')
  })

  test('login admin approda su /admin (dashboard)', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('**/admin', { timeout: 5_000 })
    // La dashboard mostra titoli/sezioni
    await expect(page.locator('text=/dashboard/i').first()).toBeVisible()
    await expect(page.locator('text=/errore/i')).toHaveCount(0)
  })

  for (const [path, name] of [
    ['/admin', 'Dashboard'],
    ['/admin/contests', 'Concorsi'],
    ['/admin/coupons', 'Schedine'],
    ['/admin/seasons', 'Stagioni'],
    ['/admin/tournaments', 'Tornei'],
    ['/admin/season-pools', 'Pool stagionali'],
    ['/admin/leagues', 'Leghe'],
    ['/admin/teams', 'Squadre'],
    ['/admin/players', 'Giocatori'],
    ['/admin/rules', 'Regole'],
    ['/admin/users', 'Utenti'],
    ['/admin/notifications', 'Notifiche'],
  ] as const) {
    test(`apre ${path}`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      // Niente errore visualizzato
      await expect(page.locator('text=/errore/i')).toHaveCount(0)
      // Header presente (matchando in modo lasco perché alcune dashboard
      // hanno strutture diverse)
      const hasHeader = await page.getByRole('heading').count()
      expect(hasHeader).toBeGreaterThan(0)
    })
  }
})

test.describe('Admin — CRUD leghe', () => {
  test('crea + modifica + elimina lega via UI', async ({ page }) => {
    await loginAs(page, 'admin')
    const name = uniq('Lega-UI')
    const renamed = `${name}-edit`

    await page.goto('/admin/leagues')
    // CREATE
    await page.getByRole('button', { name: 'Nuova lega' }).click()
    await page.getByLabel('Nome', { exact: true }).fill(name)
    await page.getByLabel('Paese', { exact: true }).fill('Italia')
    await page.getByRole('button', { name: 'Crea' }).click()
    await expect(page.getByText(name).first()).toBeVisible()

    // EDIT — clicco l'icona di modifica della riga creata
    const row = page.getByRole('row').filter({ hasText: name })
    await row.locator('button[title="Modifica"]').click()
    await page.getByLabel('Nome', { exact: true }).fill(renamed)
    await page.getByRole('button', { name: 'Salva' }).click()
    await expect(page.getByText(renamed).first()).toBeVisible()

    // DELETE
    page.once('dialog', (d) => d.accept())
    const newRow = page.getByRole('row').filter({ hasText: renamed })
    await newRow.locator('button[title="Elimina"]').click()
    await expect(page.getByText(renamed)).toHaveCount(0)
  })
})

test.describe('Admin — CRUD squadre', () => {
  test('crea + elimina squadra via UI', async ({ page }) => {
    // Servono almeno una lega preesistente
    const token = await getAdminToken()
    const league = await createLeague(token, uniq('LegaTeam'))

    await loginAs(page, 'admin')
    const name = uniq('Team-UI')
    await page.goto('/admin/teams')
    await page.getByRole('button', { name: 'Nuova squadra' }).click()
    // La label nel modal è "Nome squadra"
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Nome squadra').fill(name)
    // Il select della lega vive dentro il modal
    await dialog.locator('select').selectOption({ label: league.name })
    await page.getByRole('button', { name: 'Crea' }).click()
    await expect(page.getByText(name).first()).toBeVisible()

    page.once('dialog', (d) => d.accept())
    const row = page.getByRole('row').filter({ hasText: name })
    await row.locator('button').filter({ has: page.locator('svg') }).last().click()
    await expect(page.getByText(name)).toHaveCount(0)
  })
})

test.describe('Admin — CRUD regole', () => {
  test('crea regola via UI', async ({ page }) => {
    const token = await getAdminToken()
    const league = await createLeague(token, uniq('LegaRule'))

    await loginAs(page, 'admin')
    const name = uniq('Regola-UI')
    await page.goto('/admin/rules')
    await page.getByRole('button', { name: 'Nuova regola' }).click()
    await page.getByLabel('Nome', { exact: true }).fill(name)
    await page.locator('select').first().selectOption({ label: league.name })
    await page.getByLabel('Partite richieste').fill('5')
    await page.getByLabel('Soglie vincita (separare con virgola)').fill('5')
    await page.getByRole('button', { name: 'Crea' }).click()
    await expect(page.getByText(name).first()).toBeVisible()
  })
})

test.describe('Admin — CRUD tornei e stagioni', () => {
  test('apre e crea torneo via UI', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/admin/tournaments')
    await page.waitForLoadState('networkidle')
    // Il bottone "Nuovo" può variare nel testo; cerco "Nuovo torneo" o simile
    const newBtn = page.getByRole('button', { name: /nuovo torneo/i })
    if (await newBtn.count()) {
      await newBtn.first().click()
      const name = uniq('Torneo-UI')
      await page.getByLabel('Nome', { exact: true }).fill(name)
      await page.getByRole('button', { name: /crea|salva/i }).first().click()
      await expect(page.getByText(name).first()).toBeVisible()
    }
  })

  test('apre e crea stagione via UI', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/admin/seasons')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Nuova stagione' }).click()
    const label = uniq('Stag')
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Etichetta').fill(label)
    await page.getByRole('button', { name: 'Crea' }).click()
    await expect(page.getByText(label).first()).toBeVisible()
  })
})

test.describe('Admin — ciclo di vita concorso', () => {
  test('crea contest DRAFT, aggiunge match, apre, chiude, processa', async ({ page }) => {
    // Pre-setup via API (più affidabile della UI per la creazione di
    // anagrafiche multiple). La UI test verifica i passaggi di stato.
    const token = await getAdminToken()
    const league = await createLeague(token, uniq('LegaLifecycle'))
    const teamA = await createTeam(token, league.id, uniq('TeamA'))
    const teamB = await createTeam(token, league.id, uniq('TeamB'))
    const rule = await createRule(token, league.id, 1)

    // Creo il contest DRAFT direttamente via API
    const contestName = uniq('ContestUI')
    const openAt = new Date(Date.now() - 60_000).toISOString()
    const closeAt = new Date(Date.now() + 60_000 * 60 * 24).toISOString()
    const contest = await api.post('/admin/contests', {
      name: contestName,
      description: 'Lifecycle UI',
      leagueId: league.id,
      ruleId: rule.id,
      openAt,
      closeAt,
    }, { token })

    // Aggiungo una partita via API (UI può complicarsi con datetime-local)
    const scheduledAt = new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString()
    const match = await api.post('/admin/matches', {
      homeTeamId: teamA.id,
      awayTeamId: teamB.id,
      leagueId: league.id,
      contestId: contest.id,
      scheduledAt,
      betType: 'RESULT_1X2',
    }, { token })

    // Adesso la UI: apri lista, vedi DRAFT
    await loginAs(page, 'admin')
    await page.goto('/admin/contests')
    await expect(page.getByText(contestName)).toBeVisible()

    // Apro il dettaglio
    await page.goto(`/admin/contests/${contest.id}`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=/errore/i')).toHaveCount(0)

    // OPEN, CLOSE, RESULT, PROCESS tramite API → poi verifico stato via UI
    await api.post(`/admin/contests/${contest.id}/open`, undefined, { token })
    await api.post(`/admin/contests/${contest.id}/close`, undefined, { token })
    await api.put(`/admin/matches/${match.id}/result`, {
      homeScore: 2, awayScore: 1,
    }, { token })
    await api.post(`/admin/contests/${contest.id}/process`, undefined, { token })

    // Verifico nella UI che lo stato finale sia Elaborato
    await page.goto('/admin/contests')
    await page.waitForLoadState('networkidle')
    const row = page.getByRole('row').filter({ hasText: contestName })
    await expect(row).toContainText(/elaborato|processed/i)
  })
})

test.describe('Admin — area schedine, utenti, notifiche, season pools', () => {
  test('vede tab Schedine in /admin/coupons dopo creazione', async ({ page }) => {
    // Seed: bootstrap + crea coupon via API
    const seed = await bootstrapOpenContest({ matches: 2 })
    const userTok = await api.post('/auth/login', {
      email: 'mario@schedina.it', password: 'user1234',
    })
    await api.post('/coupons', {
      contestId: seed.contestId,
      predictions: seed.matchIds.map((id) => ({ matchId: id, choices: ['1'] })),
    }, { token: userTok.accessToken })

    await loginAs(page, 'admin')
    await page.goto('/admin/coupons')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=/errore/i')).toHaveCount(0)
  })

  test('lista utenti contiene admin + mod + user seed', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
    // Restringo alla tabella per evitare match nella sidebar
    const table = page.getByRole('table')
    await expect(table.getByText('admin@schedina.it')).toBeVisible()
    await expect(table.getByText('mod@schedina.it')).toBeVisible()
    await expect(table.getByText('mario@schedina.it')).toBeVisible()
  })

  test('notifiche admin: pagina carica', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/admin/notifications')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=/errore/i')).toHaveCount(0)
  })

  test('season pools admin: pagina carica', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/admin/season-pools')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=/errore/i')).toHaveCount(0)
  })
})
