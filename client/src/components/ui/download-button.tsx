import React from "react";
import { Button, ButtonProps } from "./button";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DownloadButtonProps extends ButtonProps {
  filename: string;
  data?: string | Blob | (() => Promise<string | Blob>);
  loading?: boolean;
  contentType?: string;
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
  onDownloadError?: (error: Error) => void;
  children?: React.ReactNode;
}

export function DownloadButton({
  filename,
  data,
  loading = false,
  contentType = "application/octet-stream",
  onDownloadStart,
  onDownloadComplete,
  onDownloadError,
  children,
  className,
  ...props
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async () => {
    if (isDownloading || loading || !data) return;

    try {
      setIsDownloading(true);
      if (onDownloadStart) onDownloadStart();

      let content: string | Blob;
      if (typeof data === "function") {
        content = await data();
      } else {
        content = data;
      }

      let blob: Blob;
      if (content instanceof Blob) {
        blob = content;
      } else if (typeof content === "string" && content.startsWith("data:application/pdf")) {
        // If it's a data URI, convert to Blob
        const byteString = atob(content.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        blob = new Blob([ab], { type: "application/pdf" });
      } else if (typeof content === "string") {
        blob = new Blob([content], { type: contentType });
      } else {
        throw new Error("Unsupported download data type");
      }

      // Create an object URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      
      // Append the link to the body
      document.body.appendChild(link);
      
      // Click the link to trigger the download
      link.click();
      
      // Clean up by removing the link and revoking the URL
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      if (onDownloadComplete) onDownloadComplete();
    } catch (error) {
      if (onDownloadError) onDownloadError(error as Error);
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("flex items-center gap-1", className)}
      onClick={handleDownload}
      disabled={isDownloading || loading || !data}
      {...props}
    >
      {isDownloading || loading ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-1" />
      )}
      {children || "Download"}
    </Button>
  );
}

// Export a PDF-specific download button
export function PDFDownloadButton(props: Omit<DownloadButtonProps, "contentType">) {
  return (
    <DownloadButton
      contentType="application/pdf"
      {...props}
    />
  );
}

// Export a CSV-specific download button
export function CSVDownloadButton(props: Omit<DownloadButtonProps, "contentType">) {
  return (
    <DownloadButton
      contentType="text/csv"
      {...props}
    />
  );
}

// Export a JSON-specific download button
export function JSONDownloadButton(props: Omit<DownloadButtonProps, "contentType">) {
  return (
    <DownloadButton
      contentType="application/json"
      {...props}
    />
  );
}

// Export an Excel-specific download button
export function ExcelDownloadButton(props: Omit<DownloadButtonProps, "contentType">) {
  return (
    <DownloadButton
      contentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      {...props}
    />
  );
}