const fs = require("fs");
const { PDFParse } = require("pdf-parse");

(async () => {
    const pdfPath = "downloads/file-170.pdf";

    console.log("📄 Reading:", pdfPath);

    if (!fs.existsSync(pdfPath)) {
        throw new Error("❌ PDF not found.");
    }

    const buffer = fs.readFileSync(pdfPath);

    const parser = new PDFParse({
        data: buffer
    });

    const result = await parser.getText();

    console.log("=================================");
    console.log("PDF TEXT");
    console.log("=================================");
    console.log(result.text);
    fs.writeFileSync(
        "pdf-170-text.txt",
        result.text,
        "utf8"
    );

    console.log("💾 Text saved to pdf-170-text.txt");
    console.log("=================================");
    console.log("Pages:", result.total);
    console.log("Characters:", result.text.length);
    console.log("=================================");

    await parser.destroy();
})();