"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useSession } from "next-auth/react";
import FileDropzone from "@/components/core/FileDropzone";
import { Button } from "@/components/ui/Button";
import {
  BROWSER_DOCUMENT_FILE_ACCEPT,
  IMAGE_FILE_ACCEPT,
  MAX_UPLOAD_SIZE_LABEL,
} from "@/lib/files/upload-policy";

const conversionTargets: Record<string, { format: string; extension: string }> = {
  "image/jpeg": { format: "png", extension: "png" },
  "image/png": { format: "jpg", extension: "jpg" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { format: "pdf", extension: "pdf" },
};

function conversionSuccessMessage(file: File) {
  return `${file.name} was converted and downloaded successfully.`;
}

export default function Home() {
  const { status } = useSession();

  const handleUpload = useCallback(async (file: File) => {
    const target = conversionTargets[file.type];
    if (!target) throw new Error("This file type cannot be converted from the browser.");

    const formData = new FormData();
    formData.set("file", file);
    formData.set("targetFormat", target.format);

    const response = await fetch("/api/account/conversions", { method: "POST", body: formData });
    if (!response.ok) throw new Error(await responseError(response));

    const resultResponse = response.status === 202 ? await waitForStoredResult(await conversionId(response)) : response;
    const blob = await resultResponse.blob();
    downloadResult(blob, resultFileName(file.name, target.extension));
  }, []);

  const isAuthenticated = status === "authenticated";

  return (
    <div className="flex flex-grow flex-col items-center justify-center p-4">
      <div className="container mx-auto px-4">
        <section className="mb-12 text-center">
          <h1 className="text-text-primary mb-2 text-4xl font-bold">Seamless File Conversion</h1>
          <p className="text-text-secondary mx-auto max-w-2xl text-lg">
            Convert JPG, PNG, and DOCX files securely from your Convertly Hub account.
          </p>
        </section>

        {status === "loading" ? (
          <p className="text-text-secondary text-center">Checking your session…</p>
        ) : isAuthenticated ? (
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            <FileDropzone
              title="Image Converter"
              description={`JPG ↔ PNG · up to ${MAX_UPLOAD_SIZE_LABEL}`}
              accept={IMAGE_FILE_ACCEPT}
              onUpload={handleUpload}
              getSuccessMessage={conversionSuccessMessage}
            />
            <FileDropzone
              title="Document Converter"
              description={`DOCX → PDF · up to ${MAX_UPLOAD_SIZE_LABEL}`}
              accept={BROWSER_DOCUMENT_FILE_ACCEPT}
              onUpload={handleUpload}
              getSuccessMessage={conversionSuccessMessage}
            />
          </div>
        ) : (
          <div className="mx-auto max-w-xl rounded-xl border border-border bg-white p-8 text-center shadow-sm">
            <h2 className="text-text-primary text-xl font-semibold">Sign in to convert files</h2>
            <p className="text-text-secondary mt-3">
              Every conversion belongs to an account, so your privacy preference and result history are applied safely.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/register">Create free account</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

async function responseError(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string") return body.error;
  } catch {
    // Keep a safe generic message for malformed error responses.
  }
  return "Unable to convert the file. Please try again.";
}

async function conversionId(response: Response) {
  const body = (await response.json()) as { conversionId?: unknown };
  if (typeof body.conversionId !== "string") throw new Error("Conversion request did not return an identifier.");
  return body.conversionId;
}

async function waitForStoredResult(conversionId: string) {
  for (let attempt = 0; attempt < 35; attempt += 1) {
    const response = await fetch(`/api/account/conversions/${encodeURIComponent(conversionId)}/download`, { cache: "no-store" });
    if (response.ok) return response;
    if (response.status !== 409) throw new Error(await responseError(response));
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("The conversion is taking longer than expected. Please check your history shortly.");
}

function resultFileName(sourceFileName: string, extension: string) {
  const baseName = sourceFileName.replace(/\.[^.]+$/, "") || "converted";
  return `${baseName}.${extension}`;
}

function downloadResult(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
