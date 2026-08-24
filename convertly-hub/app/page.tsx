"use client";

import FileDropzone from "@/components/core/FileDropzone";
import {
  DOCUMENT_FILE_ACCEPT,
  IMAGE_FILE_ACCEPT,
  MAX_UPLOAD_SIZE_LABEL,
} from "@/lib/files/upload-policy";

export default function Home() {
  // Placeholder for the actual upload logic
  const handleUpload = async (file: File) => {
    console.log(`Uploading ${file.name}...`);
    // Simulate an API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Simulate a random error
    if (Math.random() < 0.2) {
      throw new Error("A simulated network error occurred.");
    }
    console.log(`${file.name} uploaded successfully!`);
  };

  return (
    <div className="flex flex-grow flex-col items-center justify-center p-4">
      <div className="container mx-auto px-4">
        <section className="mb-12 text-center">
          <h1 className="text-text-primary mb-2 text-4xl font-bold">
            Seamless File Conversion
          </h1>
          <p className="text-text-secondary mx-auto max-w-2xl text-lg">
            Quickly and easily convert your files. Drag and drop to get started.
            No registration required for basic conversions.
          </p>
        </section>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          <FileDropzone
            title="Image Converter"
            description={`JPG ↔ PNG · up to ${MAX_UPLOAD_SIZE_LABEL}`}
            accept={IMAGE_FILE_ACCEPT}
            onUpload={handleUpload}
          />
          <FileDropzone
            title="Document Converter"
            description={`DOCX → PDF · PDF → DOCX planned · up to ${MAX_UPLOAD_SIZE_LABEL}`}
            accept={DOCUMENT_FILE_ACCEPT}
            onUpload={handleUpload}
          />
        </div>
      </div>
    </div>
  );
}
