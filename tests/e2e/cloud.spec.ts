import path from "node:path"
import { expect, test } from "@playwright/test"

/**
 * Signed-in flow against a local Supabase stack. Needs the app built with NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY pointing at it; skipped otherwise.
 */
const cloud = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
const photo = path.join(process.cwd(), "public", "demo", "belem.jpg")

test.skip(!cloud, "Set NEXT_PUBLIC_SUPABASE_URL and build against a local Supabase stack to run cloud tests")

test("signs up, saves a memory with an uploaded photo, exports, and deletes the account", async ({ page }) => {
  const email = `e2e-${Date.now()}@waymark.test`

  await page.goto("/auth?mode=sign-up")
  await page.getByLabel(/Your name/).fill("Esi")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill("correct-horse-battery")
  await page.getByRole("button", { name: "Create account" }).click()

  // New account: empty journal with a guide to the first memory.
  await expect(page).toHaveURL(/\/journal/)
  await expect(page.getByRole("heading", { level: 1, name: /Esi$/ })).toBeVisible()
  await expect(page.getByText("Your journal is empty. Save your first place.")).toBeVisible()
  await expect(page.getByText("Private journal, synced to your account")).toBeVisible()

  await page.getByRole("link", { name: "Add your first memory" }).click()
  await page.getByRole("textbox", { name: "Place name" }).fill("Belém Tower")
  await page.getByRole("button", { name: "Enter coordinates manually" }).click()
  await page.getByRole("textbox", { name: "Latitude" }).fill("38.6916")
  await page.getByRole("textbox", { name: "Longitude" }).fill("-9.216")
  await page.locator("input[type=file]").setInputFiles(photo)
  await page.getByRole("button", { name: "Save memory" }).click()

  await expect(page).toHaveURL(/\/memories\/.+\?saved=1/)
  const img = page.locator("main img[alt='Belém Tower']:visible")
  await expect(img).toBeVisible()
  await expect(img).toHaveAttribute("src", /\/storage\/v1\/object\/sign\/memory-photos\//)
  expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)

  // The memory survives a reload, so it really is stored in the database.
  await page.goto("/journal")
  await page.reload()
  await expect(page.locator("main a[href^='/memories/']:visible", { hasText: "Belém Tower" }).first()).toBeVisible()

  await page.goto("/settings")
  const download = page.waitForEvent("download")
  await page.getByRole("button", { name: "Export as JSON" }).click()
  const file = await (await download).path()
  const exported = JSON.parse(await (await import("node:fs/promises")).readFile(file!, "utf-8"))
  expect(exported.memories).toHaveLength(1)
  expect(exported.memories[0].placeName).toBe("Belém Tower")

  await page.getByRole("button", { name: "Delete my account" }).click()
  const confirm = page.getByRole("button", { name: "Delete account" })
  await expect(confirm).toBeDisabled()
  await page.getByLabel(/Type DELETE to confirm/).fill("DELETE")
  await confirm.click()
  await expect(page).toHaveURL(/\/$/)

  // The account is gone: signing in again fails.
  await page.goto("/auth")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill("correct-horse-battery")
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page.getByRole("alert").filter({ hasText: /invalid/i })).toBeVisible()
})
