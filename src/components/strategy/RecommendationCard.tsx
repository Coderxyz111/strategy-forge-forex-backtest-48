
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, CheckCircle, Crown, Star, Calendar, Users } from 'lucide-react';
import { PersonalizedRecommendation } from '@/services/analytics';

interface RecommendationCardProps {
  recommendation: PersonalizedRecommendation;
  index: number;
  onLoadStrategy: (recommendation: PersonalizedRecommendation) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  index,
  onLoadStrategy
}) => {
  const isUserStrategy = recommendation.matchFactors.includes('Your own strategy');
  const isCommunityStrategy = recommendation.matchFactors.includes('Community favorite');

  // Calculate approximate monthly return (assuming annual return)
  const monthlyReturn = (recommendation.strategy.total_return || 0) / 12;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-slate-400';
  };

  const getStrategyIcon = () => {
    if (isUserStrategy) return <Crown className="h-4 w-4 text-yellow-400" />;
    if (isCommunityStrategy) return <Users className="h-4 w-4 text-blue-400" />;
    return <Star className="h-4 w-4 text-purple-400" />;
  };

  const getStrategyBadge = () => {
    if (isUserStrategy) {
      return (
        <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs">
          Your Strategy
        </Badge>
      );
    }
    if (isCommunityStrategy) {
      return (
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
          Community
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getStrategyIcon()}
              <span className="text-sm text-slate-400">#{index + 1}</span>
            </div>
            <div>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                {recommendation.strategy.strategy_name}
                {getStrategyBadge()}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-400 text-sm">
                  {recommendation.strategy.symbol} • {recommendation.strategy.timeframe}
                </span>
                <div className={`text-sm font-medium ${getScoreColor(recommendation.score)}`}>
                  {recommendation.score.toFixed(0)}% match
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="text-center">
            <div className={`font-bold text-lg ${(recommendation.strategy.total_return || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {recommendation.strategy.total_return?.toFixed(1)}%
            </div>
            <div className="text-slate-500 text-xs">Total Return</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-blue-400 flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3" />
              {monthlyReturn.toFixed(1)}%
            </div>
            <div className="text-slate-500 text-xs">Monthly Return</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-purple-400">
              {recommendation.strategy.win_rate?.toFixed(1)}%
            </div>
            <div className="text-slate-500 text-xs">Win Rate</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-slate-300">
              {recommendation.strategy.total_trades}
            </div>
            <div className="text-slate-500 text-xs">Trades</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {recommendation.matchFactors.map((factor, i) => (
            <Badge key={i} className={`${
              factor === 'Your own strategy' 
                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                : factor === 'Community favorite'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <CheckCircle className="h-3 w-3 mr-1" />
              {factor}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-slate-400 text-sm">
            <div>Max DD: {Math.abs(recommendation.strategy.max_drawdown || 0).toFixed(1)}%</div>
            <div className="text-xs">
              Tested {new Date(recommendation.strategy.created_at || '').toLocaleDateString()}
            </div>
          </div>
          <Button
            onClick={() => onLoadStrategy(recommendation)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Load Strategy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendationCard;
