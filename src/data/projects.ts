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
    description: "A computer vision system for screening reef photographs and flagging possible coral bleaching.",
    published: true,
  },
  {
    slug: "biosensing-particle-motion",
    title: "Biosensing by Particle Motion",
    year: 2025,
    month: "August",
    description: "A control and analysis system that turns live microscopy images into a bound-fraction signal.",
    published: true,
  },
  {
    slug: "burglary-hotspot-forecasting",
    title: "Forecasting Burglary Hotspots in London",
    year: 2025,
    month: "June",
    description: "A ConvLSTM that forecasts which 500 m areas of London are most likely to record a residential burglary next month.",
    published: true,
  },
  {
    slug: "porous-media-flow",
    title: "Predicting Flow Fields Through Porous Media",
    year: 2026,
    month: "April",
    description: "A U-Net built from scratch to predict pixel-level flow fields from porous geometry.",
    published: true,
  },
  {
    slug: "airline-chatbot",
    title: "Building an Airline Twitter Chatbot",
    year: 2024,
    month: "June",
    description: "A sentiment-gated chatbot that routes airline complaints and returns a prepared first response.",
    published: true,
  },
];
