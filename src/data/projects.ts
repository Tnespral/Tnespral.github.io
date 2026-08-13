export type Project = {
  slug: string;
  title: string;
  year: number;
  month?: string;
  description: string;
  published: boolean;
};

export const projects: Project[] = [
  {
    slug: "coral-bleaching",
    title: "Automating Coral Bleaching Detection",
    year: 2025,
    month: "October",
    description: "A system that screens underwater reef photographs for signs of coral bleaching, helping specialists review large surveys faster.",
    published: true,
  },
  {
    slug: "biosensing-particle-motion",
    title: "Biosensing by Particle Motion",
    year: 2025,
    month: "August",
    description: "A system designed to monitor creatinine levels by moving samples through a reusable sensor and analysing microscopic particle motion.",
    published: true,
  },
  {
    slug: "burglary-hotspot-forecasting",
    title: "Forecasting Burglary Hotspots in London",
    year: 2025,
    month: "June",
    description: "A forecasting system that estimates which areas of London are most likely to record a residential burglary the following month.",
    published: true,
  },
  {
    slug: "porous-media-flow",
    title: "Predicting Flow Fields Through Porous Media",
    year: 2026,
    month: "April",
    description: "A compact neural network that predicts how fluid will move through the open channels of a porous material.",
    published: true,
  },
  {
    slug: "airline-chatbot",
    title: "Building an Airline Twitter Chatbot",
    year: 2024,
    month: "June",
    description: "A customer-support prototype that finds complaints in airline tweets, routes them by issue and sends a prepared first response.",
    published: true,
  },
];
