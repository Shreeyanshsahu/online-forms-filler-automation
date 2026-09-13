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

const START_FILE = 180;
const END_FILE = 500;

const BASE_URL =
    "https://theapexdatasolution.com";

const LOG_FILE =
    path.join(__dirname, "results.log");


// ============================================================
// LOGGING
// ============================================================

function logResult(message) {

    console.log(message);

    fs.appendFileSync(
        LOG_FILE,
        message + "\n"
    );
}


// Start a fresh log
fs.writeFileSync(
    LOG_FILE,
    `BATCH RUN STARTED: ${new Date().toISOString()}\n\n`
);


// ============================================================
// AI EXTRACTION
// ============================================================

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

    const AI_SCHEMA = {
        type: "object",

        properties: Object.fromEntries(
            fields.map(field => [
                field,
                {
                    type: "string"
                }
            ])
        ),

        required: fields,

        additionalProperties: false
    };

    const prompt = `
Extract product information from the PDF text.

IMPORTANT:
You MUST return EVERY field listed below.

RULES:

1. "Not applicable" → "N/A".
2. "Not specified" → "Not specified".
3. If a requested field does not exist anywhere in the PDF → "N/A".
4. Never return null.
5. Never invent information.
6. Preserve the exact wording from the PDF whenever possible.
7. "Not available" must remain "Not available".
8. Purchase Code must be "N/A" unless explicitly provided.
9. NEVER use Item Number as Purchase Code.
10. Combine all Product Features entries into one string.
11. Preserve the COMPLETE No. of Colors Available value.
12. Preserve the COMPLETE No. Of Sizes Available value.
13. If a field exists in the PDF, copy its value.
14. Every field must have a string value.
15. Do not omit any field.

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
                format: AI_SCHEMA,

                options: {
                    temperature: 0
                }
            })
        }
    );

    if (!response.ok) {

        throw new Error(
            `Ollama error: ${response.status}`
        );
    }

    const result =
        await response.json();

    const data =
        JSON.parse(result.response);


    // Deterministic normalization
    for (
        const key of Object.keys(data)
    ) {

        if (
            typeof data[key] === "string"
        ) {

            data[key] =
                data[key].replace(
                    /^Not applicable$/i,
                    "N/A"
                );
        }
    }

    return data;
}


// ============================================================
// DOWNLOAD PDF
// ============================================================

async function downloadPDF(
    page,
    context,
    fileId
) {

    const iframeSrc =
        await page
            .locator("iframe")
            .first()
            .getAttribute("src");

    if (!iframeSrc) {

        throw new Error(
            "PDF iframe not found"
        );
    }

    const pdfUrl =
        new URL(
            iframeSrc.split("#")[0],
            page.url()
        ).href;

    console.log(
        "📄 PDF:",
        pdfUrl
    );


    const downloadsDir =
        path.join(
            __dirname,
            "downloads"
        );

    fs.mkdirSync(
        downloadsDir,
        {
            recursive: true
        }
    );


    const outputPath =
        path.join(
            downloadsDir,
            `file-${fileId}.pdf`
        );


    const cookies =
        await context.cookies();

    const cookieHeader =
        cookies
            .map(
                c =>
                    `${c.name}=${c.value}`
            )
            .join("; ");


    const response =
        await axios.get(
            pdfUrl,
            {
                responseType:
                    "arraybuffer",

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
        `✅ PDF downloaded`
    );


    return outputPath;
}


// ============================================================
// PDF TEXT
// ============================================================

async function extractPDFText(
    pdfPath
) {

    const { PDFParse } =
        require("pdf-parse");


    const buffer =
        fs.readFileSync(
            pdfPath
        );


    const parser =
        new PDFParse({
            data: buffer
        });


    const result =
        await parser.getText();


    await parser.destroy();


    return result.text;
}


// ============================================================
// LOGIN
// ============================================================

async function loginIfRequired(page) {

    const username =
        page.locator(
            'input[name="username"]'
        );


    if (
        await username.count() === 0
    ) {

        console.log(
            "✅ Already logged in."
        );

        return;
    }


    console.log(
        "🔐 Login required."
    );


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


    console.log(
        "✅ Login successful."
    );
}


// ============================================================
// SUBMIT FORM
// ============================================================

async function submitForm(
    page,
    fileId
) {

    console.log(
        `📤 Submitting file ${fileId}...`
    );


    const submitButton =
        page.locator(
            'button[type="submit"]'
        ).filter({
            hasText: "Submit Details"
        });


    if (
        await submitButton.count() === 0
    ) {

        throw new Error(
            "Submit Details button not found"
        );
    }


    /*
     * We first make sure the button is actually
     * visible and enabled.
     */

    await submitButton.waitFor({
        state: "visible",
        timeout: 10000
    });


    if (
        await submitButton.isDisabled()
    ) {

        throw new Error(
            "Submit Details button is disabled"
        );
    }


    console.log(
        "⏳ Submitting — please wait..."
    );


    const urlBefore =
        page.url();


    /*
     * Watch for navigation while clicking.
     *
     * A long timeout is intentional because you
     * said submission takes time.
     */

    let navigationOccurred = false;

    const navigationPromise =
        page.waitForNavigation({
            waitUntil: "domcontentloaded",
            timeout: 120000
        })
        .then(() => {
            navigationOccurred = true;
        })
        .catch(() => {
            // No navigation within timeout.
        });


    await submitButton.click();


    await navigationPromise;


    /*
     * Give the resulting page a little time to
     * finish rendering/server-side processing.
     */

    await page.waitForTimeout(5000);


    const urlAfter =
        page.url();


    console.log(
        "📍 URL after submit:",
        urlAfter
    );


    /*
     * If the site navigated away from the form,
     * treat that as successful completion.
     */

    if (
        navigationOccurred &&
        urlAfter !== urlBefore
    ) {

        console.log(
            `✅ Submission completed for file ${fileId}`
        );

        return true;
    }


    /*
     * Some forms submit without navigation.
     * Look for a success message.
     */

    const bodyText =
        await page
            .locator("body")
            .innerText();


    const text =
        bodyText.toLowerCase();


    const successPatterns = [
        "submitted successfully",
        "details submitted successfully",
        "saved successfully",
        "successfully submitted",
        "submission successful"
    ];


    const success =
        successPatterns.some(
            pattern =>
                text.includes(pattern)
        );


    if (success) {

        console.log(
            `✅ Submission confirmed for file ${fileId}`
        );

        return true;
    }


    /*
     * Do NOT automatically retry here.
     *
     * The click may have reached the server even
     * though we couldn't confirm the result.
     */

    throw new Error(
        "SUBMISSION UNCERTAIN — could not confirm server response"
    );
}


// ============================================================
// PROCESS ONE FILE
// ============================================================

async function processFile(
    page,
    context,
    fileId
) {

    console.log("\n");

    console.log(
        "========================================"
    );

    console.log(
        `🚀 PROCESSING FILE ${fileId}`
    );

    console.log(
        "========================================"
    );


    try {

        // ----------------------------------------------------
        // OPEN
        // ----------------------------------------------------

        const targetUrl =
            `${BASE_URL}/user/submit?file=${fileId}`;


        await page.goto(
            targetUrl,
            {
                waitUntil:
                    "domcontentloaded"
            }
        );


        console.log(
            "📍 URL:",
            page.url()
        );


        // ----------------------------------------------------
        // DOWNLOAD PDF
        // ----------------------------------------------------

        const pdfPath =
            await downloadPDF(
                page,
                context,
                fileId
            );


        // ----------------------------------------------------
        // EXTRACT PDF
        // ----------------------------------------------------

        console.log(
            "📖 Extracting PDF text..."
        );


        const pdfText =
            await extractPDFText(
                pdfPath
            );


        console.log(
            `✅ Extracted ${pdfText.length} characters`
        );


        // ----------------------------------------------------
        // AI
        // ----------------------------------------------------

        console.log(
            "🤖 Sending data to Ollama..."
        );


        const data =
            await extractWithAI(
                pdfText
            );


        // ----------------------------------------------------
        // VALIDATE
        // ----------------------------------------------------

        const validation =
            validateData(data);


        if (
            !validation.valid
        ) {

            console.error(
                "❌ VALIDATION FAILED"
            );


            validation.errors.forEach(
                error =>
                    console.error(
                        "   -",
                        error
                    )
            );


            logResult(
                `FILE ${fileId} — FAILED — VALIDATION — ${validation.errors.join("; ")}`
            );


            return {
                success: false,
                fileId,
                reason: "validation"
            };
        }


        console.log(
            "✅ AI validation passed."
        );


        // ----------------------------------------------------
        // MAP
        // ----------------------------------------------------

        const websiteData =
            convertToWebsiteFields(
                data
            );


        console.log(
            "🎨 Color 1:",
            websiteData.hobbies
        );


        console.log(
            "🎨 Color 2:",
            websiteData.totalcomp
        );


        // ----------------------------------------------------
        // FILL
        // ----------------------------------------------------

        console.log(
            "📝 Filling form..."
        );


        let filled = 0;


        const totalFields =
            Object.keys(
                websiteData
            ).length;


        for (
            const [
                name,
                value
            ]
            of Object.entries(
                websiteData
            )
        ) {

            const input =
                page.locator(
                    `form input[name="${name}"]`
                );


            if (
                await input.count() === 0
            ) {

                throw new Error(
                    `Input not found: ${name}`
                );
            }


            await input.fill(
                value
            );


            filled++;
        }


        console.log(
            `✅ Filled ${filled}/${totalFields}`
        );


        // ----------------------------------------------------
        // VERIFY
        // ----------------------------------------------------

        console.log(
            "🔍 Verifying fields..."
        );


        let verified = 0;


        for (
            const [
                name,
                expected
            ]
            of Object.entries(
                websiteData
            )
        ) {

            const input =
                page.locator(
                    `form input[name="${name}"]`
                );


            if (
                await input.count() === 0
            ) {

                throw new Error(
                    `Input disappeared: ${name}`
                );
            }


            const actual =
                await input.inputValue();


            if (
                actual === expected
            ) {

                verified++;

            } else {

                throw new Error(
                    `MISMATCH ${name} | expected="${expected}" | actual="${actual}"`
                );
            }
        }


        console.log(
            `✅ Verified ${verified}/${totalFields}`
        );


        // ----------------------------------------------------
        // SAFETY CHECK
        // ----------------------------------------------------

        if (
            filled !== totalFields ||
            verified !== totalFields
        ) {

            throw new Error(
                `Safety check failed: ${filled}/${totalFields} filled, ${verified}/${totalFields} verified`
            );
        }


        console.log(
            `🟢 FILE ${fileId} READY — ${verified}/${totalFields}`
        );


        // ----------------------------------------------------
        // SUBMIT
        // ----------------------------------------------------

        try {

            const submitted =
                await submitForm(
                    page,
                    fileId
                );


            if (
                submitted
            ) {

                logResult(
                    `FILE ${fileId} — SUBMITTED — ${verified}/${totalFields} VERIFIED`
                );


                console.log(
                    `✅ FILE ${fileId} — SUBMITTED`
                );


                return {
                    success: true,
                    fileId,
                    submitted: true
                };
            }


        } catch (error) {

            console.error(
                `❌ FILE ${fileId} — SUBMISSION ERROR`
            );


            console.error(
                error.message
            );


            logResult(
                `FILE ${fileId} — SUBMISSION ERROR — ${error.message}`
            );


            /*
             * Critical:
             *
             * If we cannot tell whether the server
             * received the submission, STOP.
             *
             * We must not reload and submit again.
             */

            if (
                error.message.includes(
                    "SUBMISSION UNCERTAIN"
                )
            ) {

                throw error;
            }


            /*
             * A definite submission error:
             * skip this file and continue.
             */

            return {
                success: false,
                fileId,
                reason: "submission"
            };
        }


        return {
            success: false,
            fileId,
            reason: "submission"
        };


    } catch (error) {

        console.error(
            `💥 FILE ${fileId} FAILED`
        );


        console.error(
            error.message
        );


        logResult(
            `FILE ${fileId} — FAILED — ${error.message}`
        );


        /*
         * An uncertain submission is special.
         * Stop the entire batch to prevent a possible
         * duplicate submission.
         */

        if (
            error.message.includes(
                "SUBMISSION UNCERTAIN"
            )
        ) {

            throw error;
        }


        return {
            success: false,
            fileId,
            reason: "processing"
        };
    }
}


// ============================================================
// MAIN
// ============================================================

(async () => {

    const browser =
        await chromium.launch({
            headless: false
        });


    const context =
        await browser.newContext();


    const page =
        await context.newPage();


    try {

        console.log(
            "🚀 Starting batch"
        );


        console.log(
            `📦 Files: ${START_FILE} → ${END_FILE}`
        );


        // ----------------------------------------------------
        // LOGIN ONCE
        // ----------------------------------------------------

        await page.goto(
            `${BASE_URL}/user/submit?file=${START_FILE}`,
            {
                waitUntil:
                    "domcontentloaded"
            }
        );


        await loginIfRequired(
            page
        );


        // ----------------------------------------------------
        // PROCESS FILES
        // ----------------------------------------------------

        const results = [];


        for (
            let fileId = START_FILE;
            fileId <= END_FILE;
            fileId++
        ) {

            const result =
                await processFile(
                    page,
                    context,
                    fileId
                );


            results.push(
                result
            );


            /*
             * If submission became uncertain,
             * processFile throws and the outer
             * try/finally closes the browser.
             *
             * We deliberately don't continue.
             */

            await page.waitForTimeout(
                1000
            );
        }


        // ----------------------------------------------------
        // SUMMARY
        // ----------------------------------------------------

        console.log("\n");


        console.log(
            "========================================"
        );


        console.log(
            "🏁 BATCH FINISHED"
        );


        console.log(
            "========================================"
        );


        for (
            const result of results
        ) {

            if (
                result.success &&
                result.submitted
            ) {

                console.log(
                    `✅ ${result.fileId} — SUBMITTED`
                );

            } else {

                console.log(
                    `❌ ${result.fileId} — ${result.reason || "FAILED"}`
                );
            }
        }


        console.log(
            "========================================"
        );


        console.log(
            `📄 Log: ${LOG_FILE}`
        );


    } catch (error) {

        console.error("\n");

        console.error(
            "🛑 BATCH STOPPED"
        );

        console.error(
            error.message
        );


        logResult(
            `BATCH STOPPED — ${error.message}`
        );

    } finally {

        await page.waitForTimeout(
            5000
        );

        await browser.close();
    }

})();