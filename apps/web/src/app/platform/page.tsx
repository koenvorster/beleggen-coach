import type { Metadata } from "next";
import PlatformStatsClient from "./PlatformStatsClient";

export const metadata: Metadata = {
  title: "Platform Transparantie — BeleggenCoach",
  description:
    "Anonieme statistieken over BeleggenCoach: gebruikers, activiteit, populaire ETFs.",
};

export default function PlatformPage() {
  return <PlatformStatsClient />;
}
