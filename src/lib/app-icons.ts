export const APP_ICON_SOURCE = "/app-icons/OCRS.png";

export const APP_ICON_PATHS = {
  source: APP_ICON_SOURCE,
  favicon32: "/app-icons/favicon-32.png",
  icon180: "/app-icons/icon-180.png",
  icon192: "/app-icons/icon-192.png",
  icon512: "/app-icons/icon-512.png",
} as const;

export const APP_ICON_MANIFEST = [
  {
    src: APP_ICON_PATHS.icon192,
    sizes: "192x192",
    type: "image/png",
    purpose: "any",
  },
  {
    src: APP_ICON_PATHS.icon512,
    sizes: "512x512",
    type: "image/png",
    purpose: "any",
  },
  {
    src: APP_ICON_PATHS.icon512,
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
] as const;
