export function formatDisplayDate(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDisplayTime(timeValue: string): string {
  const [hours, minutes] = timeValue.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function getDefaultDateValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDefaultTimeValue(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}
