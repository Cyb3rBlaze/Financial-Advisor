import { PDFParse } from "pdf-parse";

export type ExtractedDocument = {
  name: string;
  type: string;
  size: number;
  text: string;
};

const supportedTextTypes = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/xml",
  "text/xml"
]);

const maxTextCharsPerFile = 70_000;

export async function extractDocuments(files: File[]): Promise<ExtractedDocument[]> {
  const extracted: ExtractedDocument[] = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const type = file.type || inferType(file.name);
    const text = await extractText(file.name, type, buffer);

    extracted.push({
      name: file.name,
      type,
      size: file.size,
      text: text.slice(0, maxTextCharsPerFile)
    });
  }

  return extracted;
}

async function extractText(fileName: string, type: string, buffer: Buffer) {
  if (type === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    return parsed.text.trim();
  }

  if (supportedTextTypes.has(type) || /\.(txt|md|csv|json|xml)$/i.test(fileName)) {
    return buffer.toString("utf8").trim();
  }

  throw new Error(`Unsupported document type for ${fileName}. Upload PDF, TXT, MD, CSV, JSON, or XML.`);
}

function inferType(fileName: string) {
  if (fileName.toLowerCase().endsWith(".pdf")) return "application/pdf";
  if (fileName.toLowerCase().endsWith(".csv")) return "text/csv";
  if (fileName.toLowerCase().endsWith(".json")) return "application/json";
  if (fileName.toLowerCase().endsWith(".md")) return "text/markdown";
  return "text/plain";
}
