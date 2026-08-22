import { expect, test } from '@playwright/test'

test('demo user can navigate and log a workout set', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /explore the interactive demo/i }).click()
  await expect(page.getByRole('heading', { name: /there/i })).toBeVisible()
  await page.getByRole('link', { name: /train/i }).first().click()
  await page.getByRole('button', { name: /^start$/i }).click()
  const reps = page.getByLabel(/set 1 reps/i).first()
  await reps.fill('10')
  await page.getByRole('button', { name: /mark .* set 1 complete/i }).first().click()
  await expect(page.getByText(/1\/12 sets/i)).toBeVisible()
})

test('food totals and life goals are reachable', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /explore the interactive demo/i }).click()
  await page.getByRole('link', { name: /food/i }).first().click()
  await expect(page.getByText(/calories today/i)).toBeVisible()
  await page.getByRole('link', { name: /life/i }).first().click()
  await expect(page.getByRole('heading', { name: /active goals/i })).toBeVisible()
})
