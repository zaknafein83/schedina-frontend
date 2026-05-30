import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import {
  bootstrapOpenGiornata, createScommessa,
  setMatchResult, closeGiornata, processGiornata, resolveScommessa,
} from './helpers/seed'

test.describe('Flusso Calendario/Schedina', () => {
  test('admin vede la giornata creata', async ({ page }) => {
    const { giornataName } = await bootstrapOpenGiornata()
    await loginAs(page, 'admin')
    await page.goto('/admin/giornate')
    await expect(page.getByText(giornataName)).toBeVisible()
  })

  test('utente compila la schedina (1X2 + U/O) e risulta vincente dopo elaborazione', async ({ page }) => {
    const { token, giornataId, matchId, giornataName, homeName, awayName } = await bootstrapOpenGiornata()

    // L'utente compila e conferma la schedina via UI
    await loginAs(page, 'mario')
    await page.goto('/giornate')
    await expect(page.getByText(giornataName)).toBeVisible()
    await page.getByText(giornataName).click()

    await page.waitForURL(`**/giornate/${giornataId}`)
    await expect(page.getByText(`${homeName} – ${awayName}`)).toBeVisible()

    // Pronostico: esito 1 + Over (coerenti col punteggio 3-0)
    await page.getByRole('button', { name: '1', exact: true }).click()
    await page.getByRole('button', { name: /^Over/ }).click()
    await page.getByRole('button', { name: /Conferma schedina/ }).click()

    await page.waitForURL('**/schedine')
    await expect(page.getByText(/Schedina #/).first()).toBeVisible()

    // L'admin inserisce il punteggio (3-0 → esito 1, Over 2.5), chiude ed elabora
    await setMatchResult(token, matchId, 3, 0)
    await closeGiornata(token, giornataId)
    await processGiornata(token, giornataId)

    // La schedina dell'utente deve risultare vincente (2 pronostici corretti)
    await page.reload()
    await expect(page.getByText('Vincente').first()).toBeVisible()
  })

  test('admin riapre una giornata chiusa', async ({ page }) => {
    const { token, giornataId } = await bootstrapOpenGiornata()
    await closeGiornata(token, giornataId)

    await loginAs(page, 'admin')
    await page.goto(`/admin/giornate/${giornataId}`)
    await expect(page.getByText('CLOSED')).toBeVisible()
    await page.getByRole('button', { name: /Riapri/ }).click()
    await expect(page.getByText('OPEN')).toBeVisible()
  })

  test('scommessa extra di giornata: giocata e risoluzione manuale', async ({ page }) => {
    const { token, giornataId } = await bootstrapOpenGiornata()
    const bet = await createScommessa(token, {
      scope: 'GIORNATA', giornataId, label: 'Gol / No gol giornata', market: 'GOAL_NOGOAL',
    })

    await loginAs(page, 'giulia')
    await page.goto('/scommesse')
    await expect(page.getByText('Gol / No gol giornata')).toBeVisible()
    await page.getByRole('button', { name: 'Gol', exact: true }).click()
    await expect(page.getByText('La tua giocata è registrata')).toBeVisible()

    // L'admin risolve la scommessa con esito GOAL
    await resolveScommessa(token, bet.id, 'GOAL')

    // La giocata dell'utente deve risultare corretta
    await page.reload()
    await expect(page.getByText('Gol / No gol giornata').first()).toBeVisible()
  })
})
