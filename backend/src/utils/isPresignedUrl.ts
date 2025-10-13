// utils/isPresignedUrl.ts
export function isPresignedUrl(url: string | undefined): boolean {
  if (!url) return false;
  // Check for common S3 presigned URL query parameters
  return url.includes("AWSAccessKeyId") && url.includes("Signature") && url.includes("Expires");
}