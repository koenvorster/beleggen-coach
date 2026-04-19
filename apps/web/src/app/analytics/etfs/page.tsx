import type { Metadata } from "next";
import ETFDashboardClient from "./ETFDashboardClient";

export const metadata: Metadata = {
  title: "ETF Performance Dashboard — BeleggenCoach",
  description:
    "Bekijk en vergelijk de prestaties van populaire ETFs op rendement, volatiliteit en risico.",
};

export default function ETFAnalyticsPage() {
  return <ETFDashboardClient />;
}
