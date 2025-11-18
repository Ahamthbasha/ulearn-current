export function isPresignedUrl(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.includes("AWSAccessKeyId") &&
    url.includes("Signature") &&
    url.includes("Expires")
  );
}
