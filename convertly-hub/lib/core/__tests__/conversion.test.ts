/** @jest-environment node */

import sharp from "sharp";
import { convertFile, CoreConversionError, validateCoreConversion } from "../conversion";

describe("conversion core", () => {
  const input = {
    sourceFileName: "photo.jpg",
    sourceMimeType: "image/jpeg",
    targetFormat: "png",
  };

  afterEach(() => jest.restoreAllMocks());

  it("converts JPEG to PNG with sharp", async () => {
    const source = await sharp({ create: { width: 1, height: 1, channels: 3, background: "#ff0000" } })
      .jpeg()
      .toBuffer();

    const result = await convertFile({ ...input, data: source });

    expect(result).toEqual(expect.objectContaining({ fileName: "photo.png", mimeType: "image/png" }));
    await expect(sharp(result.data).metadata()).resolves.toEqual(expect.objectContaining({ format: "png" }));
  });

  it("rejects spoofed image content before sharp processes it", () => {
    expect(() => validateCoreConversion({ ...input, data: Buffer.from("not a jpeg") })).toThrow(
      new CoreConversionError("The file content does not match its declared type.", "INVALID_FILE"),
    );
  });

  it("delegates DOCX to Gotenberg and verifies its PDF response", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(Buffer.from("%PDF-1.7\nconverted"), { status: 200 }),
    );

    const result = await convertFile({
      data: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]),
      sourceFileName: "report.docx",
      sourceMimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      targetFormat: "pdf",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/forms/libreoffice/convert",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toEqual(expect.objectContaining({ fileName: "report.pdf", mimeType: "application/pdf" }));
  });

  it("keeps PDF to DOCX unavailable", () => {
    expect(() =>
      validateCoreConversion({
        data: Buffer.from("%PDF-1.7"),
        sourceFileName: "report.pdf",
        sourceMimeType: "application/pdf",
        targetFormat: "docx",
      }),
    ).toThrow("This source and target format combination is not supported.");
  });
});
