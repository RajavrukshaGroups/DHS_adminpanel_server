import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

export const createMergedPdf = async (files) => {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    // IMAGE FILES
    if (file.mimetype.startsWith("image/")) {
      const imageBuffer = await sharp(file.buffer).jpeg().toBuffer();

      const image = await pdfDoc.embedJpg(imageBuffer);

      const page = pdfDoc.addPage([image.width, image.height]);

      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }

    // PDF FILES
    else if (file.mimetype === "application/pdf") {
      const existingPdf = await PDFDocument.load(file.buffer);

      const copiedPages = await pdfDoc.copyPages(
        existingPdf,
        existingPdf.getPageIndices(),
      );

      copiedPages.forEach((page) => pdfDoc.addPage(page));
    }
  }

  const mergedPdf = await pdfDoc.save();

  return Buffer.from(mergedPdf);
};
