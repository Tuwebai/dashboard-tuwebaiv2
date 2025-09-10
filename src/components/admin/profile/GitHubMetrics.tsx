import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Calendar, 
  Code, 
  Star, 
  GitFork, 
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Download
} from 'lucide-react';

interface GitHubStats {
  totalCommits: number;
  commitsThisYear: number;
  commitsThisMonth: number;
  commitsThisWeek: number;
  streak: number;
  longestStreak: number;
}

interface GitHubLanguage {
  [key: string]: number;
}

interface ContributionData {
  date: string;
  count: number;
}

interface GitHubMetricsProps {
  stats: GitHubStats;
  languages: GitHubLanguage;
  contributionGraph: ContributionData[];
  repos: Array<{
    name: string;
    stargazers_count: number;
    forks_count: number;
    language: string;
    updated_at: string;
  }>;
}

export const GitHubMetrics: React.FC<GitHubMetricsProps> = ({
  stats,
  languages,
  contributionGraph,
  repos
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'languages' | 'activity' | 'repos'>('overview');

  // Calcular métricas adicionales
  const metrics = useMemo(() => {
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
    const avgCommitsPerWeek = stats.commitsThisWeek;
    const productivityScore = Math.min(100, (stats.commitsThisMonth * 2) + (stats.streak * 3));

    return {
      totalStars,
      totalForks,
      avgCommitsPerWeek,
      productivityScore,
      activeRepos: repos.filter(repo => {
        const lastUpdate = new Date(repo.updated_at);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return lastUpdate > thirtyDaysAgo;
      }).length
    };
  }, [stats, repos]);

  // Preparar datos para gráficos
  const languageData = useMemo(() => {
    const total = Object.values(languages).reduce((sum, count) => sum + count, 0);
    return Object.entries(languages)
      .map(([language, count]) => ({
        language,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [languages]);

  const activityData = useMemo(() => {
    // Agrupar por semanas
    const weeklyData: { [key: string]: number } = {};
    contributionGraph.forEach(day => {
      const date = new Date(day.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + day.count;
    });

    return Object.entries(weeklyData)
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12); // Últimas 12 semanas
  }, [contributionGraph]);

  const exportData = () => {
    const data = {
      stats,
      languages: languageData,
      activity: activityData,
      repos: repos.map(repo => ({
        name: repo.name,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        lastUpdate: repo.updated_at
      })),
      metrics,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `github-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'languages', label: 'Lenguajes', icon: PieChart },
    { id: 'activity', label: 'Actividad', icon: LineChart },
    { id: 'repos', label: 'Repositorios', icon: Code }
  ] as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Métricas de GitHub</span>
          </CardTitle>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Métricas principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.totalCommits}</div>
                <div className="text-sm text-muted-foreground">Commits totales</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.streak}</div>
                <div className="text-sm text-muted-foreground">Racha actual</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{metrics.totalStars}</div>
                <div className="text-sm text-muted-foreground">Estrellas totales</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{metrics.productivityScore}</div>
                <div className="text-sm text-muted-foreground">Puntuación</div>
              </div>
            </div>

            {/* Gráfico de actividad semanal */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Actividad Semanal (Últimas 12 semanas)</h4>
              <div className="space-y-2">
                {activityData.map((week, index) => (
                  <div key={week.week} className="flex items-center space-x-3">
                    <div className="text-xs text-muted-foreground w-20">
                      Sem {index + 1}
                    </div>
                    <div className="flex-1 bg-muted/50 rounded-full h-4 relative">
                      <div
                        className="bg-primary rounded-full h-4 transition-all duration-500"
                        style={{ width: `${Math.min(100, (week.count / Math.max(...activityData.map(w => w.count))) * 100)}%` }}
                      />
                    </div>
                    <div className="text-sm font-medium w-8 text-right">
                      {week.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'languages' && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Distribución de Lenguajes</h4>
            <div className="space-y-3">
              {languageData.map((lang, index) => (
                <div key={lang.language} className="flex items-center space-x-3">
                  <div className="w-8 text-sm font-medium text-muted-foreground">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{lang.language}</span>
                      <span className="text-sm text-muted-foreground">
                        {lang.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all duration-500"
                        style={{ width: `${lang.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Análisis de Actividad</h4>
            
            {/* Comparación temporal */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.commitsThisWeek}</div>
                <div className="text-sm text-muted-foreground">Esta semana</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.commitsThisMonth}</div>
                <div className="text-sm text-muted-foreground">Este mes</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.commitsThisYear}</div>
                <div className="text-sm text-muted-foreground">Este año</div>
              </div>
            </div>

            {/* Tendencias */}
            <div className="space-y-4">
              <h5 className="font-medium">Tendencias</h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Racha más larga</span>
                  <Badge variant="secondary">{stats.longestStreak} días</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Repositorios activos</span>
                  <Badge variant="secondary">{metrics.activeRepos} repos</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Promedio semanal</span>
                  <Badge variant="secondary">{metrics.avgCommitsPerWeek} commits</Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'repos' && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Repositorios Destacados</h4>
            <div className="space-y-3">
              {repos.slice(0, 10).map((repo, index) => (
                <div key={repo.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{repo.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {repo.language} • Actualizado {new Date(repo.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>{repo.stargazers_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <GitFork className="w-4 h-4" />
                      <span>{repo.forks_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
