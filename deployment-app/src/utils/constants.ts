export const frameworks = [
  { id: "nextjs", name: "Next.js", icon: "⚡" },
  { id: "react", name: "React", icon: "⚛️" },
  { id: "vue", name: "Vue", icon: "💚" },
  { id: "angular", name: "Angular", icon: "🅰️" },
];

export const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

