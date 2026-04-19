import type { Metadata } from "next";
import MarktClient from "./MarktClient";

export const metadata: Metadata = {
  title: "Markt | Beleggingscoach",
  description:
    "Live marktkoersen en grafieken voor bekende indices en ETFs. Volg S&P 500, AEX, BEL20, MSCI World en meer.",
};

export default function MarktPage() {
  return <MarktClient />;
}
