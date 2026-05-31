import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { bootstrapOpenConcorso, bootstrapSeasonBet, setMatchResult, closeConcorso, processConcorso } from './helpers/seed'

test.describe('Flusso Concorso/Schedina (redesign #3)', () => {
  test('admin vede il concorso creato', async ({ page }) => {
    const { concorsoName } = await bootstrapOpenConcorso()
    await loginAs(page, 'admin')
    await page.goto('/admin/concorsi')
    await expect(page.getByText(concorsoName)).toBeVisible()
  })

  test('utente compila la schedina e risulta vincente dopo elaborazione', async ({ page }) => {
    const { token, concorsoId, matchId, concorsoName, homeName, awayName } = await bootstrapOpenConcorso()

    await loginAs(page, 'mario')
    await page.goto('/concorsi')
    await expect(page.getByText(concorsoName)).toBeVisible()
    await page.getByText(concorsoName).click()

    await page.waitForURL(`**/concorsi/${concorsoId}`)
    await expect(page.getByText(`${homeName} – ${awayName}`)).toBeVisible()
    await page.getByRole('button', { name: '1', exact: true }).click()
    await page.getByRole('button', { name: /^Over/ }).click()
    await page.getByRole('button', { name: /Conferma schedina/ }).click()

    await page.waitForURL('**/schedine')
    await expect(page.getByText(/Schedina #/).first()).toBeVisible()

    // admin: punteggio 2-1 (1, Over) → chiude → elabora
    await setMatchResult(token, matchId, 2, 1)
    await closeConcorso(token, concorsoId)
    await processConcorso(token, concorsoId)

    await page.reload()
    await expect(page.getByText('Vincente').first()).toBeVisible()
  })

  test('admin riapre un concorso chiuso', async ({ page }) => {
    const { token, concorsoId } = await bootstrapOpenConcorso()
    await closeConcorso(token, concorsoId)
    await loginAs(page, 'admin')
    await page.goto(`/admin/concorsi/${concorsoId}`)
    await expect(page.getByText('CLOSED')).toBeVisible()
    await page.getByRole('button', { name: /Riapri/ }).click()
    await expect(page.getByText('OPEN')).toBeVisible()
  })

  test('utente gioca una scommessa di partita (Vincitore)', async ({ page }) => {
    const { giornataId, matchId, homeName, awayName } = await bootstrapOpenConcorso()

    await loginAs(page, 'giulia')
    await page.goto('/scommesse')
    await page.getByRole('button', { name: 'Di partita' }).click()
    // seleziona la giornata e la partita (per value = id)
    await page.locator('select').first().selectOption(String(giornataId))
    const matchSelect = page.locator('select').nth(1)
    await expect(matchSelect).toBeEnabled()
    await matchSelect.selectOption(String(matchId))
    // tipo Vincitore + previsione squadra di casa
    await page.getByRole('button', { name: 'Vincitore' }).click()
    await page.getByRole('button', { name: homeName, exact: true }).click()
    await page.getByRole('button', { name: /Conferma giocata/ }).click()
    // la giocata appare tra "le mie giocate di partita"
    await expect(page.getByText('Previsione:', { exact: false })).toBeVisible()
  })

  test('utente gioca una scommessa di fine campionato (Capocannoniere, self-service)', async ({ page }) => {
    const { leagueId, playerId, playerName } = await bootstrapSeasonBet()

    await loginAs(page, 'giulia')
    await page.goto('/scommesse')
    // tab "Fine campionato" è il default; select: 0=Lega, 1=Mercato (Capocannoniere), 2=bersaglio
    await page.locator('select').first().selectOption(String(leagueId))
    const targetSelect = page.locator('select').nth(2)
    await expect(targetSelect).toBeVisible()
    await targetSelect.selectOption(String(playerId))
    await page.getByRole('button', { name: /Conferma giocata/ }).click()
    // la giocata appare tra "Le mie giocate" col nome del giocatore scelto (univoco per run).
    // exact: true così matcha lo <strong> della card e non l'<option> (testo più lungo) del select.
    await expect(page.getByText(playerName, { exact: true })).toBeVisible()
  })
})
