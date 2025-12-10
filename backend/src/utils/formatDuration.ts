
export const formatDuration = (secondsInput: string | number): string => {
  const seconds = typeof secondsInput === "string" ? parseInt(secondsInput, 10) : secondsInput;

  if (isNaN(seconds) || seconds < 0) return "0s";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
};