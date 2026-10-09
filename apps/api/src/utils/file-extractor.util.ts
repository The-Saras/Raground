export async function extractTextFromFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType?: string
): Promise<string> {
    const ext = originalName.split(".").pop()?.toLowerCase() || "";

    // 1. Plain text / Markdown / JSON / CSV
    if (
        ext === "txt" ||
        ext === "md" ||
        ext === "csv" ||
        ext === "json" ||
        mimeType?.startsWith("text/")
    ) {
        const text = fileBuffer.toString("utf-8");
        if (!text.trim()) {
            throw new Error("The uploaded text file is empty.");
        }
        return text;
    }

    // 2. PDF Documents
    if (ext === "pdf" || mimeType === "application/pdf") {
        try {
            const pdfModule = require("pdf-parse");
            if (pdfModule.PDFParse) {
                const parser = new pdfModule.PDFParse({ data: fileBuffer });
                await parser.load();
                const textResult = await parser.getText();
                const text =
                    typeof textResult === "string"
                        ? textResult
                        : textResult?.text || "";

                if (!text.trim()) {
                    throw new Error(
                        "No readable text could be extracted from the provided PDF document."
                    );
                }
                return text;
            } else if (typeof pdfModule === "function") {
                const data = await pdfModule(fileBuffer);
                if (!data.text || !data.text.trim()) {
                    throw new Error(
                        "No readable text could be extracted from the provided PDF document."
                    );
                }
                return data.text;
            } else {
                throw new Error("PDF parser initialization failed.");
            }
        } catch (err: any) {
            console.error("PDF extraction error:", err);
            throw new Error(
                `Failed to parse PDF file: ${err.message || "Corrupted or unreadable PDF"}`
            );
        }
    }

    throw new Error(
        `Unsupported file type '.${ext}'. Only .txt, .md, and .pdf files are supported.`
    );
}
