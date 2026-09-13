require("dotenv").config();

const { chromium } = require("playwright");

(async () => {
    const browser = await chromium.launch({
        headless: false
    });

    const context = await browser.newContext();

    const page = await context.newPage();

    console.log("Opening website...");

    await page.goto(
        "https://theapexdatasolution.com/user/submit?file=170",
        {
            waitUntil: "domcontentloaded"
        }
    );

    console.log("Current URL:", page.url());

    // Check whether login page is shown
    const usernameInput = page.locator('input[name="username"]');

    if (await usernameInput.count() > 0) {
        console.log("🔐 Login page detected.");

        await page.locator('input[name="username"]').fill(
            process.env.USERNAME
        );

        await page.locator('input[name="password"]').fill(
            process.env.PASSWORD
        );

        // Find and click the login/submit button
        await page.locator('button[type="submit"], input[type="submit"]').first().click();

        // Wait for login/navigation
        await page.waitForLoadState("domcontentloaded");

        console.log("Login attempted.");
        console.log("New URL:", page.url());
    }

    console.log("=================================");
    console.log("FINAL URL:", page.url());
    console.log("=================================");

    await page.waitForTimeout(10000);

    await browser.close();
})();