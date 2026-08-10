"use client";

import FileDropzone from "@/components/core/FileDropzone";

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
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Seamless File Conversion
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Quickly and easily convert your files. Drag and drop to get started.
          No registration required for basic conversions.
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <FileDropzone
          title="Image Converter"
          description="Convert between JPG and PNG."
          accept={{
            'image/jpeg': ['.jpeg', '.jpg'],
            'image/png': ['.png'],
          }}
          onUpload={handleUpload}
        />
        <FileDropzone
          title="Document Converter"
          description="Convert between DOCX and PDF."
          accept={{
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
          }}
          onUpload={handleUpload}
        />
      </div>
    </div>
  );
}
