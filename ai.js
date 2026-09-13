const fs = require("fs");

const MODEL = "qwen2.5:7b";
const {
    validateData,
    convertToWebsiteFields
} = require("./schema");

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

async function extractData(pdfText) {

    const prompt = `
You are extracting structured product information from a PDF.

Extract the values for the fields listed below.

IMPORTANT RULES:

1. If the PDF explicitly says "Not applicable", return "N/A".
2. If the PDF explicitly says "Not specified", return exactly "Not specified".
3. If a field exists in our requested list but the PDF does not provide that field at all, return "N/A".
4. Never return null.
5. Never invent information.
6. Preserve the PDF's wording and values.
7. "Not available" is NOT the same as "Not applicable".
   If the PDF says "Not available", preserve "Not available".
8. Purchase Code must be "N/A" unless a Purchase Code is explicitly provided.
9. Do NOT use Item Number as Purchase Code.
10. Product Features must combine all Product Features entries into one string.
11. No. of Colors Available must preserve the complete PDF value, including the number and color names.
12. No. Of Sizes Available must preserve the complete PDF value, including the number/list of sizes.

Return ONLY valid JSON.

Required fields:

${fields.map(field => `"${field}"`).join(",\n")}

PDF TEXT:
----------------
${pdfText}
----------------
`;

    const response = await fetch("http://localhost:11434/api/generate", {
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
    });

    if (!response.ok) {
        throw new Error(
            `Ollama request failed: ${response.status} ${response.statusText}`
        );
    }

    const result = await response.json();

    return JSON.parse(result.response);
}
function normalizeData(data) {
    for (const key of Object.keys(data)) {
        if (typeof data[key] === "string") {
            data[key] = data[key].replace(
                /^Not applicable$/i,
                "N/A"
            );
        }
    }

    return data;
}
(async () => {

    const pdfTextPath = "pdf-170-text.txt";

    if (!fs.existsSync(pdfTextPath)) {
        throw new Error(
            `❌ ${pdfTextPath} not found.`
        );
    }

    const pdfText = fs.readFileSync(
        pdfTextPath,
        "utf8"
    );

    console.log("🤖 Sending PDF text to Ollama...");
    console.log("Model:", MODEL);

    let data = await extractData(pdfText);

    data = normalizeData(data);

    const validation = validateData(data);

    if (!validation.valid) {
        console.error("❌ VALIDATION FAILED");

        for (const error of validation.errors) {
            console.error(" -", error);
        }

        process.exit(1);
    }

    console.log("✅ AI DATA VALIDATION PASSED");

    const websiteData = convertToWebsiteFields(data);

    console.log("\n=================================");
    console.log("WEBSITE FIELD DATA");
    console.log("=================================");

    console.log(
        JSON.stringify(websiteData, null, 2)
    );

    console.log("\n=================================");
    console.log("AI EXTRACTED DATA");
    console.log("=================================");

    console.log(
        JSON.stringify(data, null, 2)
    );

    console.log("=================================");
})();