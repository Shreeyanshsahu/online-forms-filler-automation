# 🤖 Online Forms Filler Automation

A local AI-powered automation system for extracting structured data from PDF documents and automatically filling, verifying, and submitting online forms.

Built with **Node.js**, **Playwright**, **Ollama**, and **pdf-parse**.

The project was created to eliminate repetitive manual data-entry work where information must be read from PDF documents and entered into online forms containing many fields.

Instead of manually opening every PDF, reading its contents, copying values, filling dozens of inputs, checking them, submitting the form, and repeating the process, this project automates the complete workflow.

> **AI interprets the document. Deterministic code validates, controls, verifies, and submits the form.**

---
## 📌 The Problem

This project started from a real-world data-entry workflow encountered by
one of my friends while working as a data-entry operator/freelancer.

The task involved processing product information from PDF documents and
manually entering that information into an online form. Each record
contained **37 fields** that had to be read, interpreted, entered, and
checked before submission.

For a fast operator, completing a single form could take approximately
**20–30 minutes**.

The process was essentially:

1. Open the webpage for a record.
2. Open or download the associated PDF.
3. Read the product information from the PDF.
4. Find the required values among the PDF's contents.
5. Identify the corresponding field in the web form.
6. Manually enter the value.
7. Repeat this for all 37 fields.
8. Check the entered information.
9. Submit the form.
10. Move to the next record.
11. Repeat the same process hundreds of times.

The work itself required relatively little creativity once the workflow
was understood. Most of the time was spent repeatedly reading,
copying, pasting, checking, and submitting information.

For a freelancer or data-entry operator, this meant spending several
hours performing essentially the same sequence of actions.

### Why Automate It?

The repetitive nature of the work made it a good candidate for
automation.

The original workload was expected to be completed within a limited
deadline (approximately **5 days**), which meant that a large number of
forms had to be processed manually within that period.

Instead of having a person spend 20–30 minutes on every form, the goal
was to build a system that could handle the repetitive parts
automatically while still validating the information before submission.

The result was this automation pipeline.

### The Result

The automation reduced the manual interaction required for each form
from roughly **20–30 minutes to under a minute per form** in the tested
workflow.

In a real test batch, **6 forms were processed and successfully
submitted in 4 minutes 20.49 seconds**, averaging approximately
**43 seconds per form**, including:

- PDF download
- PDF text extraction
- Local AI processing
- Data validation
- Form filling
- Verification of all 37 fields
- Form submission

A larger batch can therefore be processed in a few hours rather than
requiring many hours of continuous manual data entry.

The automation is not intended to replace the reasoning involved in
designing the workflow. Instead, it removes the repetitive execution
that makes this type of work slow and tedious.

> **The goal is simple: let the computer perform the repetitive data
> entry while keeping validation and correctness as deterministic as
> possible.**
## 💡 The Solution

The automation combines a **local Large Language Model** with deterministic browser automation.

The LLM is used only where interpretation is useful: understanding semi-structured PDF text and converting it into structured JSON.

JavaScript then handles the critical operations:

- Data normalization
- Schema validation
- Field mapping
- Browser interaction
- Form filling
- Field verification
- Submission
- Result logging
- Failure handling

This separation makes the workflow considerably more reliable than allowing an AI model to directly control every step.

## 🌐 Adapting the Automation to Another Website

This project was originally designed around a specific type of
PDF-to-form data-entry website.

It is therefore **not a plug-and-play automation for every website**.

The overall architecture can be reused, but websites differ in their
HTML structure, authentication, PDF locations, form fields, and
submission behavior.

If you want to use this project with another website, the main parts
that need to be customized are described below.

### 1. `schema.js` — Document Fields and Mapping

This file contains the structure of the information that the AI is
expected to extract from the PDF.

If your PDFs contain different information, update the fields in the
schema.

For example, the original workflow may contain fields such as:

```text
Product Name
Brand
Manufacturer
Product Price
Country of Origin
...
---

## ⚙️ How It Works

```text
                ┌───────────────┐
                │   Web Page    │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │ Download PDF  │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │ Extract Text  │
                │   pdf-parse   │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │    Ollama     │
                │   Local LLM   │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │Structured JSON│
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │   Normalize   │
                │   + Validate  │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │  Field Map    │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │  Playwright   │
                │   Fill Form   │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │ Verify Fields │
                └───────┬───────┘
                        │
                  PASS  │  FAIL
                   ┌────┴────┐
                   ▼         ▼
              ┌────────┐ ┌────────┐
              │ Submit │ │  Skip  │
              └────┬───┘ └────┬───┘
                   │           │
                   └─────┬─────┘
                         ▼
                  ┌─────────────┐
                  │ Log Result  │
                  └─────────────┘
```

---

## ✨ Features

- 📄 Automatic PDF downloading
- 🔍 PDF text extraction
- 🧠 Local AI-powered information extraction
- 🔒 Data stays local when using a local Ollama model
- 📦 Strict structured JSON output
- 🧹 Deterministic data normalization
- ✅ Schema validation before form interaction
- 🗺️ PDF-to-HTML field mapping
- 🌐 Automated browser interaction with Playwright
- 🔎 Verification of filled fields before submission
- 🚀 Automatic form submission
- ⏭️ Invalid records can be skipped
- 📝 Success and failure logging
- 🔁 Batch processing
- 🛑 Protection against continuing after an uncertain submission
- 🔧 Designed to be adapted to different forms and workflows

---

# 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Main automation runtime |
| Playwright | Browser automation |
| Ollama | Running the LLM locally |
| Qwen 2.5 7B | Default local language model |
| pdf-parse | Extracting text from PDFs |
| Axios | Downloading PDF files |
| dotenv | Loading credentials/configuration |

---

# 📋 Requirements

Before starting, install:

- **Node.js**
- **npm**
- **Ollama**
- A Playwright-supported browser

The project was developed using the Ollama model:

```text
qwen2.5:7b
```

Other models can be used, but extraction quality and structured-output behavior may differ.

---

# 🚀 Installation

## 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/online-forms-filler-automation.git
cd online-forms-filler-automation
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## 2. Install dependencies

```bash
npm install
```

If Playwright's browser is not already installed:

```bash
npx playwright install chromium
```

---

## 3. Install Ollama

Install Ollama for your operating system from the official Ollama website.

After installation, download the model:

```bash
ollama pull qwen2.5:7b
```

Check that it is available:

```bash
ollama list
```

You should see `qwen2.5:7b` in the installed models.

---

## 4. Configure environment variables

Create a `.env` file in the project root.

You can copy the provided example:

```bash
cp .env.example .env
```

Then configure your credentials:

```env
USERNAME=your_username
PASSWORD=your_password
```

> [!IMPORTANT]
> Never commit your real `.env` file or credentials to GitHub.

Your `.gitignore` should contain:

```gitignore
.env
auth.json
node_modules/
downloads/
results.log
```

---

# 📁 Project Structure

A typical project structure looks like:

```text
online-forms-filler-automation/
│
├── batch.js
├── schema.js
├── package.json
├── package-lock.json
│
├── .env.example
├── .gitignore
├── README.md
│
├── downloads/
│   └── ...
│
└── results.log
```

### `batch.js`

Controls the automation workflow:

- Browser startup
- Authentication
- Page navigation
- PDF downloading
- PDF extraction
- Ollama communication
- Form filling
- Verification
- Submission
- Batch processing
- Logging

### `schema.js`

Contains the expected PDF fields, AI output schema, validation rules, and mapping between extracted data and website form fields.

---

# 🧠 Structured AI Extraction

One of the most important parts of the project is requiring the LLM to return structured data.

A normal LLM response can unexpectedly omit fields, rename properties, return `null`, or include additional text.

Instead, the project defines the expected output structure and requests structured JSON from Ollama.

Conceptually:

```js
const AI_SCHEMA = {
    type: "object",
    properties: {
        "Product Name": { type: "string" },
        "Brand": { type: "string" },
        "Manufacturer": { type: "string" }
    },
    required: [
        "Product Name",
        "Brand",
        "Manufacturer"
    ],
    additionalProperties: false
};
```

The actual schema should contain every field required by your workflow.

The generated object is validated **before the browser is allowed to submit anything**.

---

# 🧹 Data Normalization

LLMs should not be responsible for every business rule.

Rules that can be expressed deterministically should remain in code.

For example:

```js
for (const key of Object.keys(data)) {
    if (typeof data[key] === "string") {
        data[key] = data[key].replace(
            /^Not applicable$/i,
            "N/A"
        );
    }
}
```

In the original workflow, rules included:

| PDF Value | Final Value |
|---|---|
| `Not applicable` | `N/A` |
| `Not specified` | `Not specified` |
| `Not available` | `Not available` |
| Completely missing field | `N/A` |

`null` values are not accepted.

Your own workflow may require different normalization rules.

---

# 🗺️ Mapping PDF Fields to Website Fields

This is one of the main parts you must customize when adapting the project to another website.

Suppose the PDF contains:

```text
Product Name: Blue Cotton Shirt
Brand: Example Brand
```

and the website contains:

```html
<input name="product_name">
<input name="brand_name">
```

Your mapping could look like:

```js
const FIELD_MAP = {
    "Product Name": "product_name",
    "Brand": "brand_name"
};
```

The **left side** represents the structured field extracted from the document.

The **right side** represents the corresponding HTML field used by the website.

---

# 🔍 Finding Form Field Names

Open the website you want to automate.

Right-click an input and select:

```text
Inspect
```

You might see:

```html
<input
    type="text"
    name="product_name"
>
```

The important part is:

```text
name="product_name"
```

Playwright can target it with:

```js
page.locator('input[name="product_name"]')
```

Repeat this process for each field and build your own `FIELD_MAP`.

> [!NOTE]
> Some websites use IDs, custom components, iframes, dynamically generated selectors, dropdowns, or JavaScript-controlled inputs. In those cases, the selectors and filling logic will need to be adapted.

---

# 🌐 Adapting the Project to Your Website

This repository demonstrates the architecture of the automation.

It is **not a universal script that can be pointed at any website without modification**.

Different websites have different authentication systems, document locations, fields, selectors, and submission behavior.

When adapting it, review the following components.

## 1. Authentication

Modify the login logic to match your website.

Your site may use:

- Username/password
- Email/password
- Existing browser sessions
- SSO
- Multi-step authentication

Do not attempt to bypass authentication, CAPTCHAs, access controls, or other security mechanisms.

---

## 2. Target URL

Change the target URL and record iteration logic.

For example, a system might use:

```text
https://example.com/form?id=100
https://example.com/form?id=101
https://example.com/form?id=102
```

Your application may use an entirely different structure.

---

## 3. PDF Location

The included PDF download logic assumes the document can be discovered from the target page.

If your application:

- Uses direct download links
- Uses iframes
- Requires an authenticated request
- Uses another document format

modify the download logic accordingly.

---

## 4. Expected Document Fields

Change the AI schema to represent the information you need from your own documents.

For example:

```js
const REQUIRED_FIELDS = [
    "Customer Name",
    "Invoice Number",
    "Invoice Date",
    "Total Amount"
];
```

Do not retain the example product schema if your documents contain unrelated information.

---

## 5. Field Mapping

Map each structured document property to its corresponding website input.

```js
const FIELD_MAP = {
    "Customer Name": "customer_name",
    "Invoice Number": "invoice_number",
    "Invoice Date": "invoice_date",
    "Total Amount": "total"
};
```

---

## 6. Submission Button

The original workflow uses a submit button selector.

For example:

```js
page.locator('button[type="submit"]')
```

Your website may use a different selector.

Inspect the actual element and modify the selector accordingly.

---

## 7. Submission Confirmation

This is extremely important.

Do **not** assume that clicking a submit button means the operation succeeded.

Your application should identify a reliable success condition, such as:

- A known success message
- A redirect to a known page
- A confirmed record status
- Another deterministic response from the application

Customize the submission confirmation logic for your website.

---

# 🛡️ Validation and Safe Submission

The automation follows a simple principle:

> **Never submit data merely because the AI returned an answer.**

The workflow is:

```text
AI output
   ↓
Schema validation
   ↓
Normalization
   ↓
Field mapping
   ↓
Fill form
   ↓
Read values back
   ↓
Verify expected values
   ↓
Submit
```

If validation fails, the record should not be submitted.

If form verification fails, the record should not be submitted.

If the result of a submission is uncertain, stopping the automation is safer than automatically retrying and potentially creating a duplicate submission.

---

# 🔎 Form Verification

After filling the form, the automation reads the fields back from the page.

Conceptually:

```js
const actualValue = await page
    .locator('input[name="product_name"]')
    .inputValue();

if (actualValue !== expectedValue) {
    throw new Error("Field verification failed");
}
```

Only after all expected fields pass verification should submission occur.

This provides an additional safety layer between AI extraction and the final website operation.

---

# 🔁 Batch Processing

Configure the range of records you want to process in `batch.js`.

For example:

```js
const START_FILE = 175;
const END_FILE = 180;
```

The automation processes each record sequentially.

For a larger batch:

```js
const START_FILE = 181;
const END_FILE = 500;
```

> [!CAUTION]
> Always test your configuration on a small batch before running hundreds of records.

---

# ▶️ Running the Automation

Make sure Ollama is running and the required model is installed.

Then run:

```bash
node batch.js
```

Before executing a modified script, you can also perform a Node.js syntax check:

```bash
node --check batch.js
```

If the syntax is valid, this command normally produces no output.

---

# 📊 Example Output

A successful batch can look like:

```text
BATCH RUN STARTED

FILE 175 — SUBMITTED — 37/37 VERIFIED
FILE 176 — SUBMITTED — 37/37 VERIFIED
FILE 177 — SUBMITTED — 37/37 VERIFIED
FILE 178 — SUBMITTED — 37/37 VERIFIED
FILE 179 — SUBMITTED — 37/37 VERIFIED
FILE 180 — SUBMITTED — 37/37 VERIFIED
```

This means that each record:

1. Was processed successfully
2. Passed data validation
3. Had all 37 website fields filled
4. Had all 37 fields verified
5. Was successfully submitted

---

# 📝 Logging

Batch results are written to a log so that successful and failed records can be reviewed later.

Example:

```text
FILE 175 — SUBMITTED — 37/37 VERIFIED
FILE 176 — SUBMITTED — 37/37 VERIFIED
FILE 177 — FAILED — VALIDATION ERROR
```

Logging becomes particularly useful when processing large batches because individual failures can be investigated without losing the results of previously completed records.

---

# ❌ Failure Handling

A record can fail for several reasons:

```text
PDF download failed
        ↓
      SKIP

PDF extraction failed
        ↓
      SKIP

AI output invalid
        ↓
      SKIP

Required field missing
        ↓
      SKIP

Form filling failed
        ↓
      SKIP

Field verification failed
        ↓
      SKIP
```

Submission failures require additional care.

If it is known that the submission did not occur, the record can be logged as failed.

If the submission request may have reached the server but the result cannot be confirmed, the safest behavior is to **stop the batch** rather than automatically retry and risk duplicate data.

---

# 🔐 Privacy

The document interpretation in this project is performed through a local Ollama model.

This means the extracted PDF text does not need to be sent to a third-party cloud LLM API as part of the AI extraction process.

However, the automation still communicates with whatever website you configure it to use, and other dependencies or modifications may have their own privacy implications.

Review your environment and data requirements before processing sensitive information.

---

# ⚠️ Important

This project is intended for legitimate automation of systems that you own or are authorized to access and automate.

Before using it on a website:

- Make sure you have permission to automate the workflow.
- Respect the website's policies and applicable terms.
- Do not bypass CAPTCHAs, authentication, rate limits, or security controls.
- Test with a small number of records first.
- Verify the results before starting a large batch.
- Keep credentials out of source control.

---

# 🧪 Recommended Development Workflow

When adapting the project to a new system, do not enable automatic submission immediately.

A safer development process is:

```text
1. Test PDF download
          ↓
2. Test text extraction
          ↓
3. Inspect AI JSON
          ↓
4. Validate schema
          ↓
5. Test field mapping
          ↓
6. Fill form WITHOUT submitting
          ↓
7. Verify every field
          ↓
8. Test one controlled submission
          ↓
9. Run a small batch
          ↓
10. Enable the full batch
```

This makes debugging significantly easier and reduces the risk of submitting incorrect data.

---

# 🧩 Why Local AI?

PDF documents are often only semi-structured.

Simple parsing works well when every document follows an identical machine-readable format, but becomes difficult when:

- Labels vary
- Fields appear in different locations
- Values contain natural language
- Some fields are missing
- Multiple pieces of text need to be combined

A local LLM can interpret this information and transform it into a predictable structure.

At the same time, operations that require exact behavior — such as validation and form submission — remain deterministic JavaScript code.

```text
             BEST AT
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
      LLM              CODE
        │                │
 Interpretation      Validation
 Extraction          Normalization
 Understanding       Field Mapping
        │             Verification
        │             Submission
        └───────┬────────┘
                │
                ▼
             AUTOMATION
```

---

# 🐛 Troubleshooting

## Ollama model not found

Check installed models:

```bash
ollama list
```

If necessary:

```bash
ollama pull qwen2.5:7b
```

---

## Playwright browser missing

Run:

```bash
npx playwright install chromium
```

---

## Environment variables are undefined

Make sure `.env` exists:

```text
.env
```

and contains:

```env
USERNAME=...
PASSWORD=...
```

Also ensure your application loads dotenv.

---

## AI returns incomplete data

Check:

- The extracted PDF text
- Your prompt
- Your structured-output schema
- The `required` properties
- Your chosen model

Do not simply allow missing properties to pass validation.

---

## Form fields are not being filled

Inspect the website and verify that your selectors match the actual elements.

A mapping such as:

```js
"Product Name": "product_name"
```

only works if the website actually contains the expected field:

```html
<input name="product_name">
```

---

## Submission takes a long time

Do not assume a slow submission has failed.

Set appropriate Playwright timeouts and wait for a reliable success condition from the target application.

Avoid blindly retrying a submission when the previous request may already have succeeded.

---

# 🚧 Limitations

This project does not automatically understand every website.

Adapting it to another system may require changes to:

- Authentication
- Navigation
- PDF discovery
- Document schema
- AI prompt
- Normalization rules
- Field mapping
- Input selectors
- Dropdown/checkbox handling
- Submission behavior
- Success detection

The project should therefore be treated as an **automation architecture and implementation that can be customized**, rather than a universal form-filling bot.

---

# 🔮 Possible Future Improvements

Potential improvements include:

- Configuration-driven field mapping
- CLI arguments for batch ranges
- Automatic retry for safe pre-submission failures
- Better error reports
- Screenshot capture on failures
- Resume-from-last-success support
- Multiple document formats
- Multiple local LLM models
- Support for dropdowns, checkboxes, and radio buttons
- Dry-run mode
- Automated test suite
- Web dashboard for monitoring batches
- Parallel document extraction with controlled sequential submission

---

# 🤝 Contributing

Contributions are welcome.

If you want to improve the project:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test them on a controlled workflow.
5. Open a pull request.

When contributing changes related to form submission, please prioritize verification and safe failure handling.

---

# 📄 License

This project can be distributed under the **MIT License**.

Add a `LICENSE` file to the repository if you want others to freely use, modify, and distribute the project under the MIT terms.

---

## ⭐ Support

If this project helped you automate a repetitive workflow, consider starring the repository.

The main idea behind the project is simple:

> **Use AI for interpretation. Use deterministic code for correctness. Automate the repetitive work.**