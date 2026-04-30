import type { Metadata } from "next";
import ETFHeatmapClient from "./ETFHeatmapClient";

export const metadata: Metadata = {
  title: "ETF Performance Heatmap — BeleggenCoach",
  description:
    "Interactieve heatmap van ETF returns, volatiliteit, Sharpe ratio en maximum drawdown.",
};

export default function ETFAnalyticsPage() {
  return <ETFHeatmapClient />;
}
