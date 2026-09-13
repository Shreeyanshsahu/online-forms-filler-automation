require("dotenv").config();

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { chromium } = require("playwright");

const {
    validateData,
    convertToWebsiteFields
} = require("./schema");

const MODEL = "qwen2.5:7b";

const FILE_ID = 176;

const BASE_URL =
    "https://theapexdatasolution.com";

const TARGET_URL =
    `${BASE_URL}/user/submit?file=${FILE_ID}`;


async function extractWithAI(pdfText) {

    const fields = [
        "Product Name",
        "Men Style Code",
        "Ladies Style Code",
        "Kids Style Code",
        "Brand",
        "Manufacturer",
        "Product Price",
        "Product Features",
        "No. of Colors Available",
        "Product",
        "Country of Origin",
        "Department",
        "Care Instruction",
        "Net Quantity",
        "Available Stock",
        "Manufacturing Date",
        "Item Number",
        "Discount In %",
        "Neckline",
        "Sleeve Style",
        "Returns Days Policy",
        "Minimum Order Qty",
        "Maximum Order Qty",
        "Product Details",
        "Occasion Type",
        "Product Dimensions",
        "Men Product Price",
        "Ladies Product Price",
        "Kids Product Price",
        "Fabric/Materials",
        "No. Of Sizes Available",
        "Length",
        "Generic Name",
        "Packers",
        "Payment Mode",
        "Purchase Code"
    ];

    const prompt = `
Extract product information from the PDF text.

RULES:

1. "Not applicable" → "N/A".
2. "Not specified" → "Not specified".
3. If a requested field does not exist in the PDF → "N/A".
4. Never return null.
5. Never invent information.
6. Preserve the PDF wording.
7. "Not available" must remain "Not available".
8. Purchase Code must be "N/A" unless explicitly provided.
9. Never use Item Number as Purchase Code.
10. Combine all Product Features into one string.
11. Preserve the complete No. of Colors Available value.
12. Preserve the complete No. Of Sizes Available value.

Return ONLY valid JSON.

FIELDS:

${fields.map(x => `"${x}"`).join(",\n")}

PDF TEXT:
----------------
${pdfText}
----------------
`;

    const response = await fetch(
        "http://localhost:11434/api/generate",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: MODEL,
                prompt,
                stream: false,
                format: "json"
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            `Ollama error: ${response.status}`
        );
    }

    const result = await response.json();

    return JSON.parse(result.response);
}


async function downloadPDF(page, context) {

    const iframeSrc = await page
        .locator("iframe")
        .first()
        .getAttribute("src");

    if (!iframeSrc) {
        throw new Error("❌ PDF iframe not found.");
    }

    const pdfUrl = new URL(
        iframeSrc.split("#")[0],
        page.url()
    ).href;

    console.log("📄 PDF:", pdfUrl);

    const downloadsDir =
        path.join(__dirname, "downloads");

    fs.mkdirSync(downloadsDir, {
        recursive: true
    });

    const outputPath =
        path.join(
            downloadsDir,
            `file-${FILE_ID}.pdf`
        );

    const cookies = await context.cookies();

    const cookieHeader = cookies
        .map(c => `${c.name}=${c.value}`)
        .join("; ");

    const response = await axios.get(
        pdfUrl,
        {
            responseType: "arraybuffer",
            headers: {
                Cookie: cookieHeader
            }
        }
    );

    fs.writeFileSync(
        outputPath,
        response.data
    );

    console.log(
        `✅ PDF downloaded: ${outputPath}`
    );

    return outputPath;
}


async function extractPDFText(pdfPath) {

    const { PDFParse } =
        require("pdf-parse");

    const buffer =
        fs.readFileSync(pdfPath);

    const parser =
        new PDFParse({
            data: buffer
        });

    const result =
        await parser.getText();

    await parser.destroy();

    return result.text;
}


async function loginIfRequired(page) {

    const username =
        page.locator(
            'input[name="username"]'
        );

    if (await username.count() === 0) {
        return;
    }

    console.log("🔐 Login required.");

    await username.fill(
        process.env.USERNAME
    );

    await page
        .locator(
            'input[name="password"]'
        )
        .fill(
            process.env.PASSWORD
        );

    await page
        .locator(
            'button[type="submit"], input[type="submit"]'
        )
        .first()
        .click();

    await page.waitForLoadState(
        "domcontentloaded"
    );

    console.log("✅ Login successful.");

    await page.goto(
        TARGET_URL,
        {
            waitUntil: "domcontentloaded"
        }
    );
}


(async () => {

    const browser =
        await chromium.launch({
            headless: false
        });

    const context =
        await browser.newContext();

    const page =
        await context.newPage();

    console.log(
        `🚀 Opening file ${FILE_ID}...`
    );

    await page.goto(
        TARGET_URL,
        {
            waitUntil: "domcontentloaded"
        }
    );

    await loginIfRequired(page);

    console.log(
        "📍 Current URL:",
        page.url()
    );

    // -----------------------------
    // DOWNLOAD PDF
    // -----------------------------

    const pdfPath =
        await downloadPDF(
            page,
            context
        );

    // -----------------------------
    // EXTRACT PDF
    // -----------------------------

    console.log("📖 Extracting PDF text...");

    const pdfText =
        await extractPDFText(pdfPath);

    console.log(
        `✅ Extracted ${pdfText.length} characters`
    );

    // -----------------------------
    // AI
    // -----------------------------

    console.log(
        "🤖 Sending data to Ollama..."
    );

    let data =
        await extractWithAI(pdfText);

    // Deterministic normalization.
    // Never rely only on the AI to perform this conversion.
    for (const key of Object.keys(data)) {
        if (typeof data[key] === "string") {
            data[key] = data[key].replace(
                /^Not applicable$/i,
                "N/A"
            );
        }
    }

    // -----------------------------
    // VALIDATE
    // -----------------------------

    const validation =
        validateData(data);

    if (!validation.valid) {

        console.error(
            "❌ VALIDATION FAILED"
        );

        validation.errors.forEach(
            error =>
                console.error(" -", error)
        );

        await browser.close();

        process.exit(1);
    }

    console.log(
        "✅ AI validation passed."
    );

    // -----------------------------
    // MAP TO WEBSITE
    // -----------------------------

    const websiteData =
        convertToWebsiteFields(data);
        console.log(
    "🎨 Color 1 (hobbies):",
    websiteData.hobbies
);

console.log(
    "🎨 Color 2 (totalcomp):",
    websiteData.totalcomp
);
    console.log("\n🎨 Checking color fields...");

    const colorElements = await page.locator(
        '[name="hobbies"], [name="totalcomp"]'
    ).evaluateAll(elements =>
        elements.map((el, index) => ({
            index,
            tag: el.tagName,
            type: el.type,
            name: el.name,
            value: el.value,
            outerHTML: el.outerHTML
        }))
    );

    console.log(
        JSON.stringify(colorElements, null, 2)
    );
    // -----------------------------
    // FILL FORM
    // -----------------------------

    console.log(
        "📝 Filling form..."
    );

    let filled = 0;

    for (
        const [name, value]
        of Object.entries(websiteData)
    ) {

        const input =
            page.locator(
                `form input[name="${name}"]`
            );

        if (
            await input.count() === 0
        ) {

            console.error(
                `❌ NOT FOUND: ${name}`
            );

            continue;
        }

        await input.fill(value);

        filled++;
    }

    console.log(
        `✅ Filled ${filled}/${Object.keys(websiteData).length}`
    );

    // -----------------------------
    // VERIFY
    // -----------------------------

    console.log(
        "🔍 Verifying fields..."
    );

    let verified = 0;

    for (
        const [name, expected]
        of Object.entries(websiteData)
    ) {

        const input =
            page.locator(
                `form input[name="${name}"]`
            );

        if (
            await input.count() === 0
        ) {
            continue;
        }

        const actual =
            await input.inputValue();

        if (actual === expected) {
            verified++;
        } else {

            console.error(
                `❌ MISMATCH ${name}:`,
                {
                    expected,
                    actual
                }
            );
        }
    }

    console.log(
        `✅ Verified ${verified}/${filled}`
    );

    console.log("\n=================================");
    console.log("🛑 TEST STOPPED BEFORE SUBMIT");
    console.log("=================================");
    console.log(
        "Inspect the browser manually."
    );
    console.log(
        "DO NOT click Submit yet."
    );
    console.log("=================================");

    // Keep browser open
    await page.waitForTimeout(300000);

    await browser.close();

})();