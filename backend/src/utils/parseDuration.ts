export function parseDurationStringToSeconds(durationStr: string): number {
  const timeParts = durationStr.match(/(\d+h)?\s*(\d+m)?\s*(\d+s)?/);
  if (!timeParts) return 0;

  const hours = timeParts[1] ? parseInt(timeParts[1]) : 0;
  const minutes = timeParts[2] ? parseInt(timeParts[2]) : 0;
  const seconds = timeParts[3] ? parseInt(timeParts[3]) : 0;

  return hours * 3600 + minutes * 60 + seconds;
}
