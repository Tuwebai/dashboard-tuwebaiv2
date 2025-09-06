-- Crear tabla para tareas diarias del admin
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_date DATE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON daily_tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_project ON daily_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_created_by ON daily_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_status ON daily_tasks(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

-- Política para que los admins puedan ver todas las tareas
CREATE POLICY "Admins can view all daily tasks" ON daily_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Política para que los admins puedan insertar tareas
CREATE POLICY "Admins can insert daily tasks" ON daily_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Política para que los admins puedan actualizar tareas
CREATE POLICY "Admins can update daily tasks" ON daily_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Política para que los admins puedan eliminar tareas
CREATE POLICY "Admins can delete daily tasks" ON daily_tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_daily_tasks_updated_at 
  BEFORE UPDATE ON daily_tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
