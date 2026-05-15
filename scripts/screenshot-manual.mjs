import { chromium } from 'playwright'
import fs from 'fs/promises'
import path from 'path'

const URL = process.env.MANUAL_URL || 'https://fantarole.zaknafein.ovh'
const OUT = path.resolve('public/aiuto')

const ACCOUNTS = {
  admin: { email: 'admin@schedina.it',  password: '12345678' },
  mod:   { email: 'mod@schedina.it',    password: 'mod1234' },
  user:  { email: 'mario@schedina.it',  password: 'user1234' },
}

async function login(page, role) {
  const { email, password } = ACCOUNTS[role]
  await page.goto(URL + '/login', { waitUntil: 'networkidle' })
  await page.fill('input[type=email]', email)
  await page.fill('input[type=password]', password)
  await Promise.all([
    page.waitForURL((u) => !u.toString().endsWith('/login'), { timeout: 10000 }),
    page.click('button[type=submit]'),
  ])
  await page.waitForLoadState('networkidle')
}

async function logout(page) {
  // Funziona per tutti i layout: cerca un button con "Esci" visibile
  const btn = page.locator('button:has-text("Esci")').first()
  if (await btn.isVisible().catch(() => false)) {
    await btn.click()
    await page.waitForURL(/\/login/, { timeout: 5000 }).catch(() => {})
    await page.waitForLoadState('networkidle')
  } else {
    // Pulizia hard
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.goto(URL + '/login', { waitUntil: 'networkidle' })
  }
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  console.log('  ✓ ' + name + '.png')
}

async function safeClick(page, selector) {
  const loc = page.locator(selector).first()
  if (await loc.count()) {
    await loc.click()
    await page.waitForLoadState('networkidle').catch(() => {})
    return true
  }
  console.log('  ⚠ selector not found: ' + selector)
  return false
}

;(async () => {
  await fs.mkdir(OUT, { recursive: true })
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 } })
  const page = await ctx.newPage()

  console.log('--- 01 login page ---')
  await page.goto(URL + '/login', { waitUntil: 'networkidle' })
  await shot(page, '01-login')

  console.log('--- USER flow ---')
  await login(page, 'user')
  // Aspetta che TanStack Query carichi la lista
  await page.waitForSelector('a[href^="/contests/"]', { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(500)
  await shot(page, '02-user-concorsi')

  // Entra nel primo concorso visibile
  const firstContestLink = page.locator('a[href^="/contests/"]').first()
  if (await firstContestLink.count()) {
    await firstContestLink.click()
    await page.waitForLoadState('networkidle')
    // Clicca un paio di "1" per illustrare la scelta
    const btns1 = page.locator('button:has-text("1")').filter({ hasNot: page.locator('svg') })
    const n = await btns1.count()
    for (let i = 0; i < Math.min(2, n); i++) {
      await btns1.nth(i).click().catch(() => {})
    }
    await page.waitForTimeout(200)
    await shot(page, '03-user-pronostico')

    // Scroll in fondo per vedere il bottone Conferma
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)
    await shot(page, '04-user-conferma')
  } else {
    console.log('  ⚠ nessun concorso aperto disponibile')
  }

  // My coupons
  await page.goto(URL + '/my-coupons', { waitUntil: 'networkidle' })
  await shot(page, '05-user-mie-schedine')

  await logout(page)

  console.log('--- MOD flow ---')
  await login(page, 'mod')
  await shot(page, '10-mod-dashboard')
  // Stessa pagina mostra anche i bottoni di azione; uso lo stesso shot per "11-mod-chiudi"
  await shot(page, '11-mod-chiudi')

  // Per il risultato: entra in un concorso (anche se OPEN, mostra la struttura)
  const firstModContest = page.locator('a[href^="/mod/contests/"]').first()
  if (await firstModContest.count()) {
    await firstModContest.click()
    await page.waitForLoadState('networkidle')
    await shot(page, '12-mod-risultato')
  }

  await logout(page)

  console.log('--- ADMIN flow ---')
  await login(page, 'admin')
  // Dashboard fa una fetch /admin/dashboard: aspetto contenuto reale
  await page.waitForFunction(() => !document.querySelector('[class*="animate-spin"]'), { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(800)
  await shot(page, '26-admin-dashboard')

  // Leghe + modal Nuova lega
  await page.goto(URL + '/admin/leagues', { waitUntil: 'networkidle' })
  await safeClick(page, 'button:has-text("Nuova lega")')
  await page.waitForTimeout(300)
  await shot(page, '20-admin-lega')
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(200)

  // Squadre + modal Nuova squadra
  await page.goto(URL + '/admin/teams', { waitUntil: 'networkidle' })
  await safeClick(page, 'button:has-text("Nuova squadra")')
  await page.waitForTimeout(300)
  await shot(page, '21-admin-squadra')
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(200)

  // Regole + modal Nuova regola
  await page.goto(URL + '/admin/rules', { waitUntil: 'networkidle' })
  await safeClick(page, 'button:has-text("Nuova regola")')
  await page.waitForTimeout(300)
  await shot(page, '22-admin-regola')
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(200)

  // Concorsi list (anche per 25-admin-apri)
  await page.goto(URL + '/admin/contests', { waitUntil: 'networkidle' })
  await shot(page, '25-admin-apri')
  await safeClick(page, 'button:has-text("Nuovo concorso")')
  await page.waitForTimeout(300)
  await shot(page, '23-admin-concorso')
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(200)

  // Dettaglio concorso (mostra tabella partite)
  const firstAdminContest = page.locator('a[href^="/admin/contests/"]').first()
  if (await firstAdminContest.count()) {
    await firstAdminContest.click()
    await page.waitForLoadState('networkidle')
    await shot(page, '24-admin-partite')
  }

  // Users
  await page.goto(URL + '/admin/users', { waitUntil: 'networkidle' })
  await shot(page, '27-admin-utenti')

  await browser.close()
  console.log('\nDone. PNGs saved in: ' + OUT)
})().catch((err) => {
  console.error('ERROR:', err.message)
  process.exit(1)
})
