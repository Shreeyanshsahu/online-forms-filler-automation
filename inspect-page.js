require("dotenv").config();

const { chromium } = require("playwright");

(async () => {
    const browser = await chromium.launch({
        headless: false
    });

    const context = await browser.newContext();

    const page = await context.newPage();

    const targetUrl =
        "https://theapexdatasolution.com/user/submit?file=170";

    console.log("Opening target page...");

    await page.goto(targetUrl, {
        waitUntil: "domcontentloaded"
    });

    console.log("Initial URL:", page.url());

    // Login if required
    const usernameInput = page.locator('input[name="username"]');

    if (await usernameInput.count() > 0) {
        console.log("🔐 Login page detected.");

        await page.locator('input[name="username"]').fill(
            process.env.USERNAME
        );

        await page.locator('input[name="password"]').fill(
            process.env.PASSWORD
        );

        await page
            .locator('button[type="submit"], input[type="submit"]')
            .first()
            .click();

        await page.waitForLoadState("domcontentloaded");

        console.log("Login completed.");
        console.log("After login URL:", page.url());

        // IMPORTANT:
        // Website sends us to /user/home after login.
        // Go back to the requested file explicitly.
        console.log("Navigating to file 170...");

        await page.goto(targetUrl, {
            waitUntil: "domcontentloaded"
        });
    }

    // Give redirects a moment to finish
    await page.waitForTimeout(2000);

    console.log("\n=================================");
    console.log("PAGE INFORMATION");
    console.log("=================================");

    console.log("FINAL URL:", page.url());
    console.log("TITLE:", await page.title());

    // Links
    const links = await page.locator("a").evaluateAll(elements =>
        elements.map(a => ({
            text: a.innerText.trim(),
            href: a.href
        }))
    );

    console.log("\n🔗 LINKS:");
    console.log(JSON.stringify(links, null, 2));

    // Buttons
    const buttons = await page.locator("button").evaluateAll(elements =>
        elements.map(button => ({
            text: button.innerText.trim(),
            type: button.type
        }))
    );

    console.log("\n🔘 BUTTONS:");
    console.log(JSON.stringify(buttons, null, 2));

    // Iframes
    const iframes = await page.locator("iframe").evaluateAll(elements =>
        elements.map(frame => ({
            src: frame.src
        }))
    );

    console.log("\n🖼️ IFRAMES:");
    console.log(JSON.stringify(iframes, null, 2));

    // Embeds
    const embeds = await page.locator("embed").evaluateAll(elements =>
        elements.map(embed => ({
            src: embed.src,
            type: embed.type
        }))
    );

    console.log("\n📄 EMBEDS:");
    console.log(JSON.stringify(embeds, null, 2));

    // Objects
    const objects = await page.locator("object").evaluateAll(elements =>
        elements.map(object => ({
            data: object.data,
            type: object.type
        }))
    );

    console.log("\n📄 OBJECTS:");
    console.log(JSON.stringify(objects, null, 2));

    console.log("\n=================================");
    console.log("Inspection complete.");
    console.log("=================================");

    // Keep browser open so you can see the page
    await page.waitForTimeout(30000);

    await browser.close();
})();