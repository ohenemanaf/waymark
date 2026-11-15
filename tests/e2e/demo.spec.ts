import path from "node:path"
import { expect, test, type Page } from "@playwright/test"

const photo = path.join(process.cwd(), "public", "demo", "fairy.jpg")

async function startDemo(page: Page) {
  await page.goto("/")
  await page.evaluate(async () => {
    localStorage.clear()
    await new Promise((r) => {
      const req = indexedDB.deleteDatabase("waymark-demo")
      req.onsuccess = req.onerror = req.onblocked = r
    })
  })
  await page.reload()
  await page.getByRole("button", { name: "Explore the demo" }).click()
  await expect(page.getByRole("heading", { level: 1, name: /Ama$/ })).toBeVisible()
}

const journalLinks = (page: Page, name: string) => page.locator("main a[href^='/memories/']:visible", { hasText: name })

test("explains the product and opens the demo", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Keep the places that stayed with you.")
  await startDemo(page)
  await expect(page.getByText("21 memories in 4 trips")).toBeVisible()
})

test("adds a memory with a place and a photo, then edits and finds it", async ({ page }) => {
  await startDemo(page)
  await page.goto("/memories/new")

  await page.getByRole("button", { name: "Save memory" }).click()
  await expect(page.getByText(/^Add a place/)).toBeVisible()

  await page.getByRole("textbox", { name: "Place name" }).fill("Jamestown Lighthouse")
  await page.locator("input[type=file]").setInputFiles(photo)
  await page.getByRole("button", { name: "Save memory" }).click()

  await expect(page).toHaveURL(/\/memories\/.+\?saved=1/)
  await expect(page.getByRole("heading", { level: 1, name: "Jamestown Lighthouse" })).toBeVisible()
  await expect(page.getByRole("status").filter({ hasText: "Saved to your journal" })).toBeVisible()

  await page.getByRole("link", { name: "Edit" }).click()
  await page.getByRole("textbox", { name: /A few words/ }).fill("Climbed to the top at golden hour.")
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(page.getByText("Climbed to the top at golden hour.")).toBeVisible()

  await page.goto("/journal?q=golden+hour")
  await expect(journalLinks(page, "Jamestown Lighthouse")).toHaveCount(1)
})

test("searches and filters, then clears back to the full journal", async ({ page }) => {
  await startDemo(page)
  await page.getByLabel("Search memories").fill("kyoto")
  await expect(page.getByText("4 of 21 memories")).toBeVisible()
  await page.getByRole("button", { name: "Clear filters" }).click()
  await expect(page.getByText(/of 21 memories/)).toHaveCount(0)

  await page.getByRole("button", { name: "Filters" }).click()
  await page.getByRole("button", { name: "temple" }).click()
  await expect(page.getByText("2 of 21 memories")).toBeVisible()
})

test("deletes a memory with undo", async ({ page }) => {
  await startDemo(page)
  await page.goto("/memories/m-bled")
  await page.getByRole("button", { name: "Delete" }).click()
  await page.getByRole("button", { name: "Delete memory" }).click()
  await expect(page).toHaveURL(/\/journal$/)
  await expect(journalLinks(page, "Lake Bled")).toHaveCount(0)
  await page.getByRole("button", { name: "Undo" }).click()
  await expect(journalLinks(page, "Lake Bled").first()).toBeVisible()
})

test("creates a suggested trip and moves a memory between trips", async ({ page }) => {
  await startDemo(page)
  await page.goto("/trips")
  await page.getByRole("button", { name: "Create this trip" }).click()
  await expect(page.getByRole("link", { name: /Cape Coast trip/ })).toBeVisible()

  await page.goto("/trips/trip-kyoto")
  await page.getByRole("button", { name: "Move Nishiki Market" }).click()
  await page.getByRole("menuitem", { name: "Isle of Skye" }).click()
  await expect(page.getByRole("region", { name: "Journal" }).locator("ol > li")).toHaveCount(3)
})

test("shows memories on the map with a preview", async ({ page }) => {
  await startDemo(page)
  await page.goto("/map")
  await page.getByRole("button", { name: /Belém Tower/ }).first().click()
  const preview = page.getByRole("dialog", { name: "Preview of Belém Tower" })
  await expect(preview).toBeVisible()
  await preview.getByRole("link", { name: "Open memory" }).click()
  await expect(page.getByRole("heading", { level: 1, name: "Belém Tower" })).toBeVisible()
})

test("works one-handed on a phone @mobile", async ({ page }) => {
  await startDemo(page)
  const tabBar = page.getByRole("navigation", { name: "Main" }).last()
  await expect(tabBar.getByRole("link", { name: "Add a memory" })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await tabBar.getByRole("link", { name: "Map" }).click()
  await page.getByRole("button", { name: "Places" }).click()
  await expect(page.getByRole("region", { name: "Places on the map" })).toBeVisible()
})
