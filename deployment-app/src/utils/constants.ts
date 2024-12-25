/**
 * List of supported frameworks
 * @constant {Array<{id: string, name: string, icon: string}>}
 */
export const frameworks = [
  { id: "nextjs", name: "Next.js", icon: "⚡" },
  { id: "react", name: "React", icon: "⚛️" },
  { id: "vue", name: "Vue", icon: "💚" },
  { id: "angular", name: "Angular", icon: "🅰️" },
];
/**
 * Animation configuration for container element
 * @constant {Object}
 */
export const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/**
 * Animation configuration for individual item elements
 * @constant {Object}
 */
export const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};
