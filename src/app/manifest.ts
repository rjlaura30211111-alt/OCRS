import type { MetadataRoute } from "next";
import { APP_ICON_MANIFEST } from "@/lib/app-icons";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OCRS Document Tracker",
    short_name: "OCRS",
    description: "Submit reports with QR codes and track documents",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#1a3f6f",
    icons: [...APP_ICON_MANIFEST],
  };
}
