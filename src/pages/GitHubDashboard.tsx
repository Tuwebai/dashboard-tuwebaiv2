import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Github, 
  RefreshCw,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGitHubAuth } from '@/hooks/useGitHubAuth';
import { useGitHubData } from '@/hooks/useGitHubData';

const GitHubDashboard: React.FC = () => {
  const { isConnected, isLoading: authLoading, error: authError, connect, disconnect } = useGitHubAuth();
  const { 
    user, 
    repos, 
    featuredRepos, 
    stats, 
    languages, 
    contributionGraph,
    isLoading: dataLoading, 
    error: dataError, 
    refreshData 
  } = useGitHubData();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  const getTopLanguages = () => {
    if (!languages || typeof languages !== 'object') {
      return [];
    }
    return Object.entries(languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/perfil')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al perfil
          </Button>
          <h1 className="text-3xl font-bold">Dashboard de GitHub</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="ml-2">Cargando...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/perfil')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al perfil
        </Button>
        <h1 className="text-3xl font-bold">Dashboard de GitHub</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </CardTitle>
            <div className="flex items-center space-x-3">
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
                  className="w-16 h-16 rounded-full border-2 border-border"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground truncate">
                    {user.name || user.login}
                  </h3>
                  <p className="text-muted-foreground text-sm truncate">
                    @{user.login}
                  </p>
                  {user.bio && (
                    <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                      {user.bio}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <span>{user.followers || 0} seguidores</span>
                    <span>{user.following || 0} siguiendo</span>
                    <span>{user.public_repos || 0} repositorios</span>
                  </div>
                </div>
              </div>

              {/* Estadísticas de contribuciones */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{stats.totalCommits || 0}</div>
                    <div className="text-sm text-muted-foreground">Commits totales</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{stats.commitsThisYear || 0}</div>
                    <div className="text-sm text-muted-foreground">Este año</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{stats.commitsThisMonth || 0}</div>
                    <div className="text-sm text-muted-foreground">Este mes</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{stats.streak || 0}</div>
                    <div className="text-sm text-muted-foreground">Racha actual</div>
                  </div>
                </div>
              )}

              {/* Lenguajes más usados */}
              {languages && Object.keys(languages).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Lenguajes más usados</h3>
                  <div className="space-y-2">
                    {getTopLanguages().map(([language, count]) => (
                      <div key={language} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{language}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${(count / Math.max(...Object.values(languages))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {count}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Repositorios destacados */}
              {featuredRepos && featuredRepos.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Repositorios destacados</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {featuredRepos.slice(0, 6).map((repo) => (
                      <div key={repo.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground truncate">{repo.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {repo.description || 'Sin descripción'}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                              <span>{repo.language || 'Sin lenguaje'}</span>
                              <span>⭐ {repo.stargazers_count || 0}</span>
                              <span>🍴 {repo.forks_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gráfico de contribuciones */}
              {contributionGraph && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Gráfico de contribuciones</h3>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground text-center">
                      Gráfico de contribuciones disponible (implementación pendiente)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { GitHubDashboard };
