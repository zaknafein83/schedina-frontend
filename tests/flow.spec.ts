import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { bootstrapOpenConcorso, closeConcorso, resolveScommessa, processConcorso } from './helpers/seed'

test.describe('Flusso Scommessa/Schedina', () => {
  test('admin vede il concorso creato', async ({ page }) => {
    const { concorsoName } = await bootstrapOpenConcorso()
    await loginAs(page, 'admin')
    await page.goto('/admin/concorsi')
    await expect(page.getByText(concorsoName)).toBeVisible()
  })

  test('utente compila la schedina e risulta vincente dopo elaborazione', async ({ page }) => {
    const { token, concorsoId, betId, concorsoName } = await bootstrapOpenConcorso()

    // L'utente compila e conferma la schedina via UI
    await loginAs(page, 'mario')
    await page.goto('/concorsi')
    await expect(page.getByText(concorsoName)).toBeVisible()
    await page.getByText(concorsoName).click()

    await page.waitForURL(`**/concorsi/${concorsoId}`)
    await expect(page.getByText('Gol / No gol')).toBeVisible()
    await page.getByRole('button', { name: 'Gol', exact: true }).click()
    await page.getByRole('button', { name: /Conferma schedina/ }).click()

    await page.waitForURL('**/schedine')
    await expect(page.getByText(/Schedina #/).first()).toBeVisible()

    // L'admin chiude, risolve la scommessa (GOAL) ed elabora
    await closeConcorso(token, concorsoId)
    await resolveScommessa(token, betId, 'GOAL')
    await processConcorso(token, concorsoId)

    // La schedina dell'utente deve risultare vincente
    await page.reload()
    await expect(page.getByText('Vincente').first()).toBeVisible()
  })
})
