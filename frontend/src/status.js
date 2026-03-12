export const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED"];

export function getStatusLabel(statusValue) {
  if (statusValue === "IN_PROGRESS") {
    return "In Progress";
  }

  if (statusValue === "RESOLVED") {
    return "Closed";
  }

  if (statusValue === "OPEN") {
    return "Open";
  }

  return statusValue;
}

export function getAvailableStatuses() {
  return STATUS_OPTIONS;
}