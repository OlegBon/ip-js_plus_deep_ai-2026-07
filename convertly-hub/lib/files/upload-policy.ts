export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOAD_SIZE_LABEL = "10 MB";

export const IMAGE_FILE_ACCEPT: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

export const DOCUMENT_FILE_ACCEPT: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

export const SUPPORTED_SOURCE_MIME_TYPES = new Set([
  ...Object.keys(IMAGE_FILE_ACCEPT),
  ...Object.keys(DOCUMENT_FILE_ACCEPT),
]);

export const SUPPORTED_TARGET_FORMATS = new Set(["jpg", "png", "pdf"]);
