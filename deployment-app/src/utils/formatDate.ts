/**
 * Format a date as a relative time (e.g. 1h ago, 2m ago)
 * @param {Date} date - The date to format
 * @return {string} - The formatted date
 */
export const formatTimeAgo = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (hours > 24) return `${Math.floor(hours / 24)}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${minutes}m ago`;
};

