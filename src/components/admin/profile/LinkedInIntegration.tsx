import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Linkedin, 
  Briefcase, 
  Award, 
  Users, 
  MessageSquare,
  Calendar,
  MapPin,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useLinkedInAuth } from '@/hooks/useLinkedInAuth';
import { useLinkedInData } from '@/hooks/useLinkedInData';
import { ConnectionStatus } from './ConnectionStatus';
import { 
  CardSkeleton, 
  LinkedInProfileSkeleton 
} from './SkeletonLoader';

export const LinkedInIntegration: React.FC = () => {
  const { isConnected, isLoading: authLoading, error: authError, connect, disconnect } = useLinkedInAuth();
  const { 
    profile, 
    experience, 
    skills, 
    posts, 
    stats, 
    isLoading: dataLoading, 
    error: dataError, 
    refreshData 
  } = useLinkedInData();
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  const formatDate = (year: number, month: number) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long'
    });
  };

  const formatPostDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `hace ${diffInHours} horas`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `hace ${diffInDays} días`;
    }
  };

  if (authLoading || dataLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Linkedin className="w-5 h-5" />
            <span>LinkedIn</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ConnectionStatusSkeleton />
          <div className="mt-6">
            <LinkedInProfileSkeleton />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Linkedin className="w-5 h-5" />
            <span>LinkedIn</span>
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
          provider="linkedin"
          isConnected={isConnected}
          isLoading={authLoading}
          error={authError || dataError}
          onConnect={connect}
          onDisconnect={disconnect}
          lastUpdate={profile ? new Date() : undefined}
        />

        {isConnected && profile && (
          <div className="mt-6 space-y-6">
            {/* Perfil del usuario */}
            <div className="p-6 bg-muted/50 rounded-lg">
              <div className="flex items-start space-x-4">
                <img
                  src={profile.profilePicture?.displayImage || '/placeholder-avatar.png'}
                  alt={`${profile.firstName.localized.es || profile.firstName.localized.en} ${profile.lastName.localized.es || profile.lastName.localized.en}`}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {profile.firstName.localized.es || profile.firstName.localized.en} {profile.lastName.localized.es || profile.lastName.localized.en}
                  </h3>
                  <p className="text-muted-foreground mb-2">
                    {profile.headline.localized.es || profile.headline.localized.en}
                  </p>
                  {profile.summary && (
                    <p className="text-sm text-muted-foreground">
                      {profile.summary.localized.es || profile.summary.localized.en}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            {stats && (
              <div>
                <h4 className="text-lg font-semibold mb-4">Estadísticas del Perfil</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{stats.connectionsCount}</div>
                    <div className="text-sm text-muted-foreground">Conexiones</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{stats.skillsCount}</div>
                    <div className="text-sm text-muted-foreground">Habilidades</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{stats.experienceCount}</div>
                    <div className="text-sm text-muted-foreground">Experiencias</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{stats.postsCount}</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                </div>
              </div>
            )}

            {/* Experiencia laboral */}
            {experience.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Briefcase className="w-5 h-5" />
                  <span>Experiencia Laboral</span>
                </h4>
                <div className="space-y-4">
                  {experience.slice(0, 3).map((exp) => (
                    <div key={exp.id} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-foreground">{exp.title}</h5>
                          <p className="text-muted-foreground">{exp.companyName}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {formatDate(exp.timePeriod.startDate.year, exp.timePeriod.startDate.month)}
                                {exp.timePeriod.endDate ? ` - ${formatDate(exp.timePeriod.endDate.year, exp.timePeriod.endDate.month)}` : ' - Presente'}
                              </span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{exp.location.country}</span>
                            </span>
                          </div>
                          {exp.description && (
                            <p className="text-sm mt-2 text-muted-foreground">
                              {exp.description.length > 150 
                                ? `${exp.description.substring(0, 150)}...` 
                                : exp.description
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Habilidades */}
            {skills.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Habilidades Principales</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 10).map((skill) => (
                    <Badge key={skill.id} variant="secondary" className="text-sm">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Posts recientes */}
            {posts.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Posts Recientes</span>
                </h4>
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground mb-2">{post.text}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{formatPostDate(post.created.time)}</span>
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center space-x-1">
                                <span>👍</span>
                                <span>{post.socialDetail.totalSocialActivityCounts.numLikes}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <span>💬</span>
                                <span>{post.socialDetail.totalSocialActivityCounts.numComments}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <span>🔄</span>
                                <span>{post.socialDetail.totalSocialActivityCounts.numShares}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
