type TaskPriority = "very_high" | "high" | "medium" | "low";

export function getPriorityColor(priority: TaskPriority) {
  switch (priority) {
    case "very_high":
      return {
        bg: "bg-red-400 dark:bg-red-800",
        text: "text-red-950 dark:text-red-100",
        border: "border-red-700 dark:border-red-500",
        dot: "bg-red-700 dark:bg-red-500",
        badge: "bg-red-700",
      };
    case "high":
      return {
        bg: "bg-orange-400 dark:bg-orange-800",
        text: "text-orange-950 dark:text-orange-100",
        border: "border-orange-700 dark:border-orange-500",
        dot: "bg-orange-700 dark:bg-orange-500",
        badge: "bg-orange-700",
      };
    case "medium":
      return {
        bg: "bg-yellow-400 dark:bg-yellow-800",
        text: "text-yellow-950 dark:text-yellow-100",
        border: "border-yellow-700 dark:border-yellow-500",
        dot: "bg-yellow-700 dark:bg-yellow-500",
        badge: "bg-yellow-700",
      };
    case "low":
      return {
        bg: "bg-green-400 dark:bg-green-800",
        text: "text-green-950 dark:text-green-100",
        border: "border-green-700 dark:border-green-500",
        dot: "bg-green-700 dark:bg-green-500",
        badge: "bg-green-700",
      };
    default:
      return {
        bg: "bg-gray-200 dark:bg-gray-900/60",
        text: "text-gray-800 dark:text-gray-300",
        border: "border-gray-500 dark:border-gray-600",
        dot: "bg-gray-600",
        badge: "bg-gray-600",
      };
  }
}
