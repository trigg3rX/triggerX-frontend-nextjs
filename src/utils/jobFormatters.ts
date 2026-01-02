/** Maps internal job type identifiers to human-readable labels. */
export const mapJobType = (type: string) => {
  const types: { [key: string]: string } = {
    PRICE_MONITOR: "Price Monitor",
    GAS_MONITOR: "Gas Monitor",
  };
  return types[type] || type;
};

/** Truncates long text to a specified length. */
export const truncateText = (text: string, maxLength: number = 50) => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

/** Formats a seconds string to a friendly duration (days/hours/minutes/seconds). */
export const formatTimeframe = (secondsString: string) => {
  const seconds = parseInt(secondsString, 10);
  if (isNaN(seconds)) return secondsString;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const totalMinutes = (seconds % 3600) / 60;
  const mins = Math.floor(totalMinutes);
  const secs = seconds % 60;

  if (days > 0) {
    const remainingHours = Math.floor((seconds % 86400) / 3600);
    if (remainingHours > 0) {
      return `${days} day${days > 1 ? "s" : ""} ${remainingHours} hour${remainingHours > 1 ? "s" : ""}`;
    }
    return `${days} day${days > 1 ? "s" : ""}`;
  }
  if (hours > 0) {
    if (mins > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ${mins} min${mins !== 1 ? "s" : ""}`;
    }
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  if (totalMinutes >= 10) return `${mins} min${mins !== 1 ? "s" : ""}`;
  if (totalMinutes >= 1) {
    // Show 1 decimal place for minutes under 10
    const formattedMins = totalMinutes.toFixed(1);
    // Remove .0 if it's a whole number
    const displayMins = formattedMins.endsWith(".0")
      ? formattedMins.slice(0, -2)
      : formattedMins;
    return `${displayMins} min${totalMinutes !== 1 ? "s" : ""}`;
  }
  return `${secs} sec${secs !== 1 ? "s" : ""}`;
};

/** Formats ISO date strings to localized display, with invalid fallback. */
export const formatDate = (date: string) => {
  const parsedDate = new Date(date);
  return isNaN(parsedDate.getTime())
    ? "Invalid Date"
    : parsedDate.toLocaleString();
};

/** Slices an address to a short display form. */
export const sliceAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/** Formats interval seconds to hh/mm/ss for time-based jobs. */
export const formatInterval = (secondsString: string) => {
  const seconds = parseInt(secondsString, 10);
  if (isNaN(seconds)) return secondsString;

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  if (mins > 0) return `${mins} min${mins > 1 ? "s" : ""}`;
  if (secs > 0) return `${secs} sec${secs > 1 ? "s" : ""}`;
  return "0 sec";
};

/** Humanizes condition type keys to readable labels. */
export const formatConditionType = (conditionType: string) => {
  switch (conditionType) {
    case "greater_than":
      return "Greater Than";
    case "less_than":
      return "Less Than";
    case "equals":
      return "Equals";
    case "not_equals":
      return "Not Equals";
    case "less_equal":
      return "Less Than or Equal To";
    case "between":
      return "Between";
    default:
      return conditionType
        .replace("_", " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
};
