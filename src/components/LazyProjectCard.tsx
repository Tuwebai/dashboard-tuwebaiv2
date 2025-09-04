import React from 'react';
import { motion } from '@/components/OptimizedMotion';
import { useLazyLoading } from '@/hooks/useLazyLoading';
import ProjectCard from './ProjectCard';

interface LazyProjectCardProps {
  project: any;
  user: any;
  projectCreators: any;
  onViewProject: (project: any) => void;
  onNavigateToCollaboration: (project: any) => void;
  onNavigateToEdit: (project: any) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (project: any) => void;
  onArchiveProject: (project: any) => void;
  onToggleFavorite: (project: any) => void;
  showAdminActions?: boolean;
  index?: number;
  isDragDisabled?: boolean;
  dragMode?: boolean;
}

export default function LazyProjectCard(props: LazyProjectCardProps) {
  // Temporalmente deshabilitamos el lazy loading para mostrar siempre el contenido
  // TODO: Investigar por qué el Intersection Observer no funciona correctamente
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3, delay: (props.index || 0) * 0.1 }}
    >
      <ProjectCard {...props} />
    </motion.div>
  );
}
