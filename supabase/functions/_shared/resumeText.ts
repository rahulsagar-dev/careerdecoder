// Shared resume text extraction (PDF via unpdf, DOCX via fflate, plain text fallback).
export async function extractResumeText(bytes: Uint8Array): Promise<string> {
  try {
    const headerSample = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 8));

    if (headerSample.startsWith("%PDF")) {
      try {
        const { extractText, getDocumentProxy } = await import("https://esm.sh/unpdf@0.12.1");
        const pdf = await getDocumentProxy(bytes);
        const { text } = await extractText(pdf, { mergePages: true });
        return (Array.isArray(text) ? text.join("\n") : text).replace(/\s+/g, " ").trim();
      } catch (pdfErr) {
        console.error("unpdf failed, falling back:", pdfErr);
        const rawText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
        const parts: string[] = [];
        const regex = /\(([^)]*)\)/g;
        let match;
        while ((match = regex.exec(rawText)) !== null) {
          const t = match[1].replace(/\\n/g, "\n").replace(/\\\(/g, "(").replace(/\\\)/g, ")");
          if (t.trim().length > 1) parts.push(t.trim());
        }
        return parts.join(" ").replace(/\s+/g, " ").trim();
      }
    }

    if (headerSample.startsWith("PK")) {
      try {
        const { unzipSync, strFromU8 } = await import("https://esm.sh/fflate@0.8.2");
        const files = unzipSync(bytes);
        const docXml = files["word/document.xml"];
        if (docXml) {
          return strFromU8(docXml).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        }
      } catch (docxErr) {
        console.error("DOCX extraction failed:", docxErr);
      }
      return "";
    }

    return new TextDecoder("utf-8", { fatal: false }).decode(bytes).replace(/\s+/g, " ").trim();
  } catch (e) {
    console.error("Text extraction error:", e);
    return "";
  }
}
