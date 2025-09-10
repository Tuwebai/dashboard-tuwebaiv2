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
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useGitHubAuth } from '@/hooks/useGitHubAuth';
import { useGitHubData } from '@/hooks/useGitHubData';
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
            <div className="flex items-center space-x-3">
              {/* Estado de conexión */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-medium ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              {isConnected && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Actualizar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={disconnect}
                  >
                    Desconectar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-muted-foreground/10 rounded-full flex items-center justify-center mx-auto">
                <Github className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No conectado a GitHub
                </h3>
                <p className="text-muted-foreground mb-6">
                  Conecta tu cuenta de GitHub para ver tus repositorios, estadísticas de contribuciones y actividad de desarrollo.
                </p>
                {authError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
                  </div>
                )}
                <Button 
                  onClick={connect} 
                  className="w-full sm:w-auto"
                  disabled={authLoading}
                >
                  {authLoading ? 'Conectando...' : 'Conectar con GitHub'}
                </Button>
              </div>
            </div>
          ) : !user ? (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Error al cargar datos
                </h3>
                <p className="text-muted-foreground mb-6">
                  {dataError || authError || 'Error desconocido'}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button 
                    onClick={handleRefresh} 
                    variant="outline"
                    disabled={dataLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
                    {dataLoading ? 'Cargando...' : 'Reintentar'}
                  </Button>
                  <Button onClick={disconnect} variant="destructive">
                    Desconectar
                  </Button>
                </div>
              </div>
            </div>
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
