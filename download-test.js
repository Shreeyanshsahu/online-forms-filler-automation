require("dotenv").config();

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { chromium } = require("playwright");

(async () => {
    const browser = await chromium.launch({
        headless: false
    });

    const context = await browser.newContext();

    const page = await context.newPage();

    const targetUrl =
        "https://theapexdatasolution.com/user/submit?file=170";

    console.log("Opening file 170...");

    await page.goto(targetUrl, {
        waitUntil: "domcontentloaded"
    });

    // Login if necessary
    const usernameInput = page.locator('input[name="username"]');

    if (await usernameInput.count() > 0) {
        console.log("🔐 Logging in...");

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

        console.log("✅ Login successful.");

        // Login redirects to home, so return to file
        await page.goto(targetUrl, {
            waitUntil: "domcontentloaded"
        });
    }

    await page.waitForTimeout(2000);

    console.log("Current URL:", page.url());

    // Get PDF URL from iframe
    const iframeSrc = await page.locator("iframe").first().getAttribute("src");

    if (!iframeSrc) {
        throw new Error("❌ PDF iframe not found.");
    }

    // Convert relative URL to absolute URL
    const pdfUrl = new URL(
        iframeSrc.split("#")[0],
        page.url()
    ).href;

    console.log("📄 iframe src:", iframeSrc);
    console.log("📄 Full PDF URL:", pdfUrl);

    // Create downloads folder
    const downloadsDir = path.join(__dirname, "downloads");

    if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
    }

    const outputPath = path.join(
        downloadsDir,
        "file-170.pdf"
    );

    console.log("⬇️ Downloading PDF...");

    // Use the browser's authenticated cookies
    const cookies = await context.cookies();

    const cookieHeader = cookies
        .map(cookie => `${cookie.name}=${cookie.value}`)
        .join("; ");

    const response = await axios.get(pdfUrl, {
        responseType: "arraybuffer",
        headers: {
            Cookie: cookieHeader
        }
    });

    fs.writeFileSync(outputPath, response.data);

    console.log("=================================");
    console.log("✅ PDF DOWNLOADED");
    console.log("=================================");
    console.log("File:", outputPath);
    console.log("Size:", response.data.length, "bytes");
    console.log("=================================");

    await page.waitForTimeout(5000);

    await browser.close();
})();