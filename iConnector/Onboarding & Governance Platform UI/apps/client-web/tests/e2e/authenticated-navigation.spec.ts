import { expect, test, type Page } from "@playwright/test";

async function signInAs(page: Page, role: "participant" | "admin") {
  await page.addInitScript((nextRole) => {
    window.localStorage.setItem("e2e.auth.role", nextRole);
  }, role);
}

test("participant can open the landing page and does not see admin navigation", async ({ page }) => {
  await signInAs(page, "participant");
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Welcome to the DataSpace Onboarding Console" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start Onboarding" })).toBeVisible();
  await expect(page.getByText("Participant", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Governance" })).toHaveCount(0);
});

test("participant can enter wizard step one and validation controls progression", async ({ page }) => {
  await signInAs(page, "participant");
  await page.goto("/wizard");

  await expect(page.getByText("Step 1 of 6")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Organisation Details" }).first()).toBeVisible();

  const continueButton = page.getByRole("button", { name: "Continue to Verification Method Keys" });
  await expect(continueButton).toBeDisabled();

  await page.getByLabel("Organization Name").fill("Acme Data Services");
  await page.getByRole("radio", { name: /Provider/ }).check();
  await page.getByLabel("Intended Use in DataSpace").fill("Publish compliant mobility data products.");

  await expect(continueButton).toBeEnabled();
});

test("participant is redirected away from admin routes", async ({ page }) => {
  await signInAs(page, "participant");
  await page.goto("/admin");

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Welcome to the DataSpace Onboarding Console" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Data Space Governance Dashboard" })).toHaveCount(0);
});

test("admin can access governance dashboard", async ({ page }) => {
  await signInAs(page, "admin");
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Data Space Governance Dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Participant Admission" })).toBeVisible();
  await expect(page.getByRole("link", { name: "VC Issuance" })).toBeVisible();
});
