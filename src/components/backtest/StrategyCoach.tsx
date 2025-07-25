
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, TrendingUp, AlertTriangle, Target, Brain, Plus, Zap, Sparkles, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StrategyCoach as StrategyCoachService, StrategyAnalysis } from '@/services/strategyCoach';
import { AIStrategyCoach, AIStrategyAnalysis } from '@/services/aiStrategyCoach';

interface StrategyCoachProps {
  results: any;
  onAddToStrategy?: (codeSnippet: string) => void;
  strategyCode?: string;
}

const StrategyCoach: React.FC<StrategyCoachProps> = ({ results, onAddToStrategy, strategyCode = '' }) => {
  const [analysis, setAnalysis] = useState<StrategyAnalysis | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIStrategyAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [addedSnippets, setAddedSnippets] = useState<Set<string>>(new Set());
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const { toast } = useToast();

  console.log('StrategyCoach received:', { 
    hasResults: !!results, 
    hasCode: !!strategyCode, 
    resultsType: typeof results,
    codeLength: strategyCode?.length || 0
  });

  // Check if we have the minimum requirements for AI analysis
  const canRunAIAnalysis = !!(strategyCode?.trim() && results && results.trades && results.trades.length > 0);
  const hasBasicResults = !!(results && results.trades);

  React.useEffect(() => {
    if (hasBasicResults) {
      console.log('Starting basic strategy analysis...');
      setIsAnalyzing(true);
      setTimeout(() => {
        try {
          const analysisResult = StrategyCoachService.analyzeBacktest(results);
          console.log('Basic analysis completed:', analysisResult);
          setAnalysis(analysisResult);
          setIsAnalyzing(false);
        } catch (error) {
          console.error('Basic analysis failed:', error);
          setIsAnalyzing(false);
        }
      }, 1500);
    }
  }, [hasBasicResults]);

  const handleAIAnalysis = async () => {
    if (!canRunAIAnalysis) {
      let missingRequirements = [];
      if (!strategyCode?.trim()) missingRequirements.push("strategy code");
      if (!results) missingRequirements.push("backtest results");
      if (!results?.trades?.length) missingRequirements.push("trade data");
      
      toast({
        title: "Cannot Run AI Analysis",
        description: `Missing required data: ${missingRequirements.join(", ")}. Please run a backtest with your strategy first.`,
        variant: "destructive",
      });
      return;
    }

    setIsAiAnalyzing(true);
    try {
      console.log('Starting AI analysis with:', {
        codeLength: strategyCode.length,
        tradesCount: results.trades.length,
        winRate: results.winRate
      });
      
      const aiAnalysisResult = await AIStrategyCoach.analyzeStrategyWithAI(strategyCode, results);
      console.log('AI analysis completed:', aiAnalysisResult);
      setAiAnalysis(aiAnalysisResult);
      setUseAI(true);
      
      toast({
        title: "AI Analysis Complete!",
        description: `Generated ${aiAnalysisResult.recommendations.length} intelligent recommendations`,
      });
    } catch (error) {
      console.error('AI analysis failed:', error);
      toast({
        title: "AI Analysis Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Using basic analysis instead.`,
        variant: "destructive",
      });
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Code snippet copied to clipboard",
    });
  };

  const handleQuickAdd = (recommendation: any) => {
    console.log('Quick Add clicked for:', recommendation.title);
    
    if (!onAddToStrategy || !recommendation.codeSnippet) {
      toast({
        title: "Cannot Add",
        description: "No code snippet available or strategy editor not connected",
        variant: "destructive",
      });
      return;
    }

    if (addedSnippets.has(recommendation.id)) {
      toast({
        title: "Already Added",
        description: "This recommendation has already been added to your strategy",
        variant: "destructive",
      });
      return;
    }

    console.log('Adding code snippet:', recommendation.codeSnippet);
    onAddToStrategy(recommendation.codeSnippet);
    setAddedSnippets(prev => new Set([...prev, recommendation.id]));
    
    toast({
      title: "Strategy Updated!",
      description: `"${recommendation.title}" has been added to your strategy editor`,
    });
  };

  const handleAddAllRecommendations = async () => {
    const currentAnalysis = useAI ? aiAnalysis : analysis;
    if (!onAddToStrategy || !currentAnalysis?.recommendations.length) {
      toast({
        title: "Cannot Add All",
        description: "No recommendations available or strategy editor not connected",
        variant: "destructive",
      });
      return;
    }

    setIsAddingAll(true);
    
    const recommendationsToAdd = currentAnalysis.recommendations.filter(
      rec => rec.codeSnippet && !addedSnippets.has(rec.id)
    );

    if (recommendationsToAdd.length === 0) {
      toast({
        title: "All Added",
        description: "All available recommendations have already been added",
        variant: "destructive",
      });
      setIsAddingAll(false);
      return;
    }

    try {
      for (let i = 0; i < recommendationsToAdd.length; i++) {
        const rec = recommendationsToAdd[i];
        console.log(`Adding recommendation ${i + 1}/${recommendationsToAdd.length}:`, rec.title);
        
        onAddToStrategy(rec.codeSnippet!);
        setAddedSnippets(prev => new Set([...prev, rec.id]));
        
        if (i < recommendationsToAdd.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      toast({
        title: "All Recommendations Added!",
        description: `${recommendationsToAdd.length} improvements added to your strategy`,
      });
    } catch (error) {
      console.error('Error adding all recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to add some recommendations",
        variant: "destructive",
      });
    } finally {
      setIsAddingAll(false);
    }
  };

  // Show initial state if no results
  if (!hasBasicResults) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <Brain className="h-16 w-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-semibold text-white mb-2">Strategy Coach</h3>
          <p className="text-slate-400 mb-4">Run a backtest to get personalized strategy recommendations</p>
          <div className="bg-slate-700 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="text-left">
                <p className="text-slate-300 text-sm font-medium mb-1">Requirements for AI Analysis:</p>
                <ul className="text-slate-400 text-xs space-y-1">
                  <li>• Strategy code in the builder</li>
                  <li>• Completed backtest with trade results</li>
                  <li>• At least one executed trade</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isAnalyzing || isAiAnalyzing) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {isAiAnalyzing ? 'AI Analyzing Your Strategy...' : 'Analyzing Your Strategy...'}
          </h3>
          <p className="text-slate-400">
            {isAiAnalyzing ? 'Generating advanced AI insights...' : 'Identifying patterns and generating recommendations'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentAnalysis = useAI ? aiAnalysis : analysis;
  if (!currentAnalysis) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-xl font-semibold text-white mb-2">Analysis Failed</h3>
          <p className="text-slate-400">Unable to analyze the strategy results</p>
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'risk_management': return <AlertTriangle className="h-4 w-4" />;
      case 'entry_timing': return <TrendingUp className="h-4 w-4" />;
      case 'exit_strategy': return <Target className="h-4 w-4" />;
      case 'position_sizing': return <Brain className="h-4 w-4" />;
      case 'market_analysis': return <Sparkles className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const availableRecommendations = currentAnalysis.recommendations.filter(
    rec => rec.codeSnippet && !addedSnippets.has(rec.id)
  );

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-emerald-400" />
            <div>
              <CardTitle className="text-white text-lg">
                Strategy Coach 
                {useAI && <Badge className="ml-2 bg-purple-500/10 text-purple-400">AI Enhanced</Badge>}
              </CardTitle>
              <p className="text-slate-400 text-sm mt-1">
                {useAI 
                  ? 'Advanced AI-powered analysis and recommendations'
                  : `Rule-based analysis and recommendations${canRunAIAnalysis ? ' - upgrade to AI for deeper insights' : ' - run backtest for AI analysis'}`
                }
              </p>
            </div>
          </div>
          {!useAI && !isAiAnalyzing && (
            <div className="flex items-center gap-3">
              {!canRunAIAnalysis && (
                <div className="text-xs text-slate-500">
                  Need: code + results
                </div>
              )}
              <Button
                onClick={handleAIAnalysis}
                disabled={!canRunAIAnalysis}
                className={`${canRunAIAnalysis ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-600 cursor-not-allowed'} text-white px-4 py-2`}
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Analysis
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="insights" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700">
            <TabsTrigger value="insights">Key Insights</TabsTrigger>
            <TabsTrigger value="recommendations">
              Recommendations ({currentAnalysis.recommendations.length})
            </TabsTrigger>
            <TabsTrigger value="patterns">
              {useAI ? 'AI Analysis' : `Trade Patterns (${(currentAnalysis as any).patterns?.length || 0})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4">
            {useAI && aiAnalysis ? (
              <div className="space-y-4">
                <Card className="bg-slate-700 border-slate-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-slate-300">AI Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white text-sm">{aiAnalysis.overallAssessment}</p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 text-xs mb-2">Risk Level</p>
                        <Badge className={
                          aiAnalysis.riskLevel === 'high' ? 'bg-red-500/10 text-red-400' :
                          aiAnalysis.riskLevel === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-green-500/10 text-green-400'
                        }>
                          {aiAnalysis.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs mb-2">Complexity Score</p>
                        <span className="text-white font-semibold">{aiAnalysis.complexityScore}/100</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-slate-700 border-slate-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-emerald-300">Strengths</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {aiAnalysis.strengthsIdentified.map((strength, index) => (
                          <li key={index} className="text-slate-300 text-xs">• {strength}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-700 border-slate-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-red-300">Areas for Improvement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {aiAnalysis.weaknessesIdentified.map((weakness, index) => (
                          <li key={index} className="text-slate-300 text-xs">• {weakness}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-700 border-slate-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-slate-300">Performance Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Win Rate</span>
                      <span className="text-white font-semibold">{results.winRate?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Total Trades</span>
                      <span className="text-white font-semibold">{results.totalTrades}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Profit Factor</span>
                      <span className="text-white font-semibold">{results.profitFactor?.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-700 border-slate-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-slate-300">Risk Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Max Drawdown</span>
                      <span className="text-red-400 font-semibold">{results.maxDrawdown?.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Total Return</span>
                      <span className={`font-semibold ${results.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {results.totalReturn?.toFixed(2)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {availableRecommendations.length > 0 && onAddToStrategy && (
              <div className="flex justify-end mb-4">
                <Button
                  onClick={handleAddAllRecommendations}
                  disabled={isAddingAll}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {isAddingAll ? 'Adding All...' : `Add All Recommendations (${availableRecommendations.length})`}
                </Button>
              </div>
            )}

            {currentAnalysis.recommendations.length === 0 ? (
              <Card className="bg-slate-700 border-slate-600 p-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
                <p className="text-slate-300">Your strategy looks well-optimized!</p>
                <p className="text-slate-400 text-sm mt-1">No major improvements detected at this time.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {currentAnalysis.recommendations.map((rec) => (
                  <Card key={rec.id} className="bg-slate-700 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(rec.category)}
                          <div>
                            <h3 className="text-white font-medium">{rec.title}</h3>
                            <p className="text-slate-400 text-sm">{rec.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                          <span className="text-emerald-400 text-sm font-medium">
                            +{rec.estimatedImprovement}%
                          </span>
                          {useAI && 'confidence' in rec && (
                            <Badge className="bg-purple-500/10 text-purple-400">
                              {rec.confidence}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-slate-800 p-3 rounded border border-slate-600 mb-3">
                        <p className="text-slate-400 text-sm">{rec.explanation}</p>
                        {useAI && 'reasoning' in rec && (
                          <p className="text-slate-500 text-xs mt-2 italic">AI Reasoning: {rec.reasoning}</p>
                        )}
                      </div>
                      
                      {rec.codeSnippet && (
                        <div className="bg-slate-900 p-3 rounded border border-slate-600 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-300 text-sm font-medium">Code Implementation</span>
                            <div className="flex gap-2">
                              {onAddToStrategy && (
                                <Button
                                  size="sm"
                                  onClick={() => handleQuickAdd(rec)}
                                  disabled={addedSnippets.has(rec.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  {addedSnippets.has(rec.id) ? 'Added' : 'Quick Add'}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(rec.codeSnippet!)}
                                className="border-slate-600 text-slate-300 hover:bg-slate-700 px-3 py-1"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                          </div>
                          <pre className="text-slate-300 text-xs overflow-x-auto whitespace-pre-wrap">
                            <code>{rec.codeSnippet}</code>
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            {useAI && aiAnalysis ? (
              <div className="space-y-4">
                <Card className="bg-slate-700 border-slate-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-slate-300">Market Condition Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white text-sm mb-3">{aiAnalysis.marketConditionAnalysis}</p>
                    <div>
                      <p className="text-slate-400 text-xs mb-2">Best Market Conditions:</p>
                      <div className="flex flex-wrap gap-1">
                        {aiAnalysis.marketSuitability.map((condition, index) => (
                          <Badge key={index} className="bg-blue-500/10 text-blue-400 text-xs">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : analysis && 'patterns' in analysis ? (
              (analysis as any).patterns.length === 0 ? (
                <Card className="bg-slate-700 border-slate-600 p-6 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-slate-300">No significant patterns detected</p>
                  <p className="text-slate-400 text-sm mt-1">Your trading appears consistent across different conditions.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {(analysis as any).patterns.map((pattern: any, index: number) => (
                    <Card key={index} className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant={pattern.impact === 'positive' ? 'default' : 
                                        pattern.impact === 'negative' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {pattern.impact}
                              </Badge>
                              <span className="text-slate-400 text-sm">
                                {pattern.frequency} occurrences
                              </span>
                            </div>
                            <p className="text-white text-sm mb-1">{pattern.description}</p>
                            <p className="text-slate-400 text-xs">
                              Average return: ${pattern.avgReturn.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              <Card className="bg-slate-700 border-slate-600 p-6 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                <p className="text-slate-300">Pattern analysis unavailable</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StrategyCoach;
