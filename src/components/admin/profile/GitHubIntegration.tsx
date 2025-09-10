import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Github, 
  Star, 
  GitFork, 
  Calendar, 
  TrendingUp, 
  Code, 
  Users,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useGitHubAuth } from '@/hooks/useGitHubAuth';
import { useGitHubData } from '@/hooks/useGitHubData';
import { ConnectionStatus } from './ConnectionStatus';
import { GitHubMetrics } from './GitHubMetrics';
import { ActivityNotifications } from './ActivityNotifications';
import { IntegrationErrorBoundary } from './IntegrationErrorBoundary';
import { GitHubEmptyStates } from './EmptyStates';
import { 
  CardSkeleton, 
  GitHubStatsSkeleton, 
  RepoSkeleton,
  ConnectionStatusSkeleton
} from './SkeletonLoader';

export const GitHubIntegration: React.FC = () => {
  const { isConnected, isLoading: authLoading, error: authError, connect, disconnect } = useGitHubAuth();
  const { 
    user, 
    repos, 
    featuredRepos, 
    stats, 
    languages, 
    isLoading: dataLoading, 
    error: dataError, 
    refreshData 
  } = useGitHubData();
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  const getTopLanguages = () => {
    return Object.entries(languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (authLoading || dataLoading) {
    return (
      <IntegrationErrorBoundary>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ConnectionStatusSkeleton />
            <div className="mt-6 space-y-4">
              <GitHubStatsSkeleton />
              <div className="grid gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <RepoSkeleton key={index} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </IntegrationErrorBoundary>
    );
  }

  return (
    <IntegrationErrorBoundary>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </CardTitle>
            {isConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ConnectionStatus
            provider="github"
            isConnected={isConnected}
            isLoading={authLoading}
            error={authError || dataError}
            onConnect={connect}
            onDisconnect={disconnect}
            lastUpdate={user ? new Date() : undefined}
          />

          {!isConnected ? (
            GitHubEmptyStates.noConnection(connect)
          ) : !user ? (
            GitHubEmptyStates.error(dataError || 'Error desconocido', handleRefresh)
          ) : (
          <div className="mt-6 space-y-6">
            {/* Perfil del usuario */}
            <div className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
              <img
                src={user.avatar_url}
                alt={user.name || user.login}
                className="w-16 h-16 rounded-full"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{user.name || user.login}</h3>
                <p className="text-muted-foreground">@{user.login}</p>
                {user.bio && (
                  <p className="text-sm mt-2">{user.bio}</p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{user.followers} seguidores</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{user.following} siguiendo</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Code className="w-4 h-4" />
                    <span>{user.public_repos} repositorios</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            {stats && (
              <div>
                <h4 className="text-lg font-semibold mb-4">Estadísticas de Contribuciones</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{stats.totalCommits}</div>
                    <div className="text-sm text-muted-foreground">Commits totales</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{stats.commitsThisYear}</div>
                    <div className="text-sm text-muted-foreground">Este año</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{stats.commitsThisMonth}</div>
                    <div className="text-sm text-muted-foreground">Este mes</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{stats.streak}</div>
                    <div className="text-sm text-muted-foreground">Racha actual</div>
                  </div>
                </div>
              </div>
            )}

            {/* Lenguajes más usados */}
            {Object.keys(languages).length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-4">Lenguajes más usados</h4>
                <div className="flex flex-wrap gap-2">
                  {getTopLanguages().map(([language, bytes]) => (
                    <Badge key={language} variant="secondary" className="text-sm">
                      {language} ({Math.round((bytes / Object.values(languages).reduce((a, b) => a + b, 0)) * 100)}%)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Repositorios destacados */}
            {featuredRepos.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-4">Repositorios Destacados</h4>
                <div className="grid gap-4">
                  {featuredRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-foreground">{repo.name}</h5>
                          <p className="text-sm text-muted-foreground">{repo.description}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(repo.html_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Star className="w-4 h-4" />
                          <span>{repo.stargazers_count}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <GitFork className="w-4 h-4" />
                          <span>{repo.forks_count}</span>
                        </span>
                        {repo.language && (
                          <Badge variant="outline" className="text-xs">
                            {repo.language}
                          </Badge>
                        )}
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Actualizado {formatDate(repo.updated_at)}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dashboard de métricas */}
            {stats && languages && contributionGraph && (
              <GitHubMetrics
                stats={stats}
                languages={languages}
                contributionGraph={contributionGraph}
                repos={repos}
              />
            )}

            {/* Notificaciones de actividad */}
            <ActivityNotifications />
          </div>
          )}
        </CardContent>
      </Card>
    </IntegrationErrorBoundary>
  );
};
