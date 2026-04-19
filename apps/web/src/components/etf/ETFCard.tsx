import { TrendingUp, TrendingDown, PlusCircle, CheckCircle2 } from "lucide-react";

interface ETFCardProps {
  ticker: string;
  name: string;
  ter: number;
  beginnerScore: number;
  category: string;
  description: string;
  accumulating: boolean;
  onCompare?: (ticker: string) => void;
  compareSelected?: boolean;
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 85 ? "bg-primary-500" : score >= 75 ? "bg-accent-500" : "bg-orange-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Beginnersvriendelijk</span>
        <span className="font-semibold text-gray-700">{score}/100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 85
      ? "bg-green-100 text-green-700"
      : score >= 70
      ? "bg-yellow-100 text-yellow-700"
      : "bg-gray-100 text-gray-500";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      ★ {score}
    </span>
  );
}

export default function ETFCard({
  ticker,
  name,
  ter,
  beginnerScore,
  category,
  description,
  accumulating,
  onCompare,
  compareSelected = false,
}: ETFCardProps) {
  return (
    <div
      data-testid="etf-card"
      className={`card space-y-4 hover:shadow-md transition-all ${
        compareSelected ? "border-2 border-primary-500" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-lg text-gray-900">{ticker}</span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {category}
            </span>
            <ScoreBadge score={beginnerScore} />
          </div>
          <p className="text-sm text-gray-600 mt-0.5">{name}</p>
        </div>
        <div className="shrink-0 w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
          {beginnerScore >= 80 ? (
            <TrendingUp className="w-4 h-4 text-primary-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-orange-500" />
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500">{description}</p>

      <ScoreBar score={beginnerScore} />

      <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
        <div className="text-sm">
          <span className="text-gray-400">Kosten (TER): </span>
          <span className="font-semibold text-gray-700">
            {((ter ?? 0) * 100).toFixed(2)}%/jaar
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              accumulating
                ? "bg-primary-50 text-primary-700"
                : "bg-orange-50 text-orange-700"
            }`}
          >
            {accumulating ? "Accumulerend" : "Uitkerend"}
          </span>
          {onCompare && (
            <button
              onClick={() => onCompare(ticker)}
              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border transition-colors ${
                compareSelected
                  ? "bg-primary-500 text-white border-primary-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-primary-400 hover:text-primary-600"
              }`}
            >
              {compareSelected ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <PlusCircle className="w-3 h-3" />
              )}
              Vergelijk
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

