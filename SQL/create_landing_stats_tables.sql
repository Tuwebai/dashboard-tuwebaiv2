-- Tabla para métricas de rendimiento
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  productivity_increase DECIMAL(5,2) DEFAULT 0,
  time_saved_hours DECIMAL(5,2) DEFAULT 0,
  meeting_time_reduction DECIMAL(5,2) DEFAULT 0,
  prediction_accuracy DECIMAL(5,2) DEFAULT 0,
  decision_speed_multiplier DECIMAL(5,2) DEFAULT 0,
  project_delay_reduction DECIMAL(5,2) DEFAULT 0,
  average_roi DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para uso de demo
CREATE TABLE IF NOT EXISTS demo_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usage_count INTEGER DEFAULT 0,
  week_start DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(week_start)
);

-- Tabla para encuestas de satisfacción (sin referencia a teams)
CREATE TABLE IF NOT EXISTS satisfaction_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  company_name VARCHAR(255),
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_satisfied BOOLEAN DEFAULT false,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar datos iniciales de métricas de rendimiento
INSERT INTO performance_metrics (
  productivity_increase,
  time_saved_hours,
  meeting_time_reduction,
  prediction_accuracy,
  decision_speed_multiplier,
  project_delay_reduction,
  average_roi
) VALUES (
  40.0,
  12.0,
  85.0,
  92.0,
  3.0,
  67.0,
  45.0
) ON CONFLICT DO NOTHING;

-- Insertar datos iniciales de uso de demo
INSERT INTO demo_usage (usage_count, week_start) VALUES 
(2847, CURRENT_DATE - INTERVAL '7 days'),
(2156, CURRENT_DATE - INTERVAL '14 days'),
(1923, CURRENT_DATE - INTERVAL '21 days')
ON CONFLICT (week_start) DO UPDATE SET 
  usage_count = EXCLUDED.usage_count,
  updated_at = NOW();

-- Insertar encuestas de satisfacción de ejemplo
INSERT INTO satisfaction_surveys (user_id, company_name, rating, is_satisfied, feedback) VALUES 
(gen_random_uuid(), 'TechStart', 5.0, true, 'Excelente plataforma, muy fácil de usar'),
(gen_random_uuid(), 'InnovateLab', 5.0, true, 'Ahorramos mucho tiempo con las automatizaciones'),
(gen_random_uuid(), 'ScaleUp', 4.8, true, 'Muy buena herramienta, algunas mejoras menores'),
(gen_random_uuid(), 'DataFlow', 5.0, true, 'ROI increíble, la recomiendo'),
(gen_random_uuid(), 'CloudTech', 4.9, true, 'Las predicciones de IA son muy precisas')
ON CONFLICT DO NOTHING;

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_demo_usage_week_start ON demo_usage(week_start);
CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_created_at ON satisfaction_surveys(created_at);

-- RLS (Row Level Security)
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE satisfaction_surveys ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para permitir lectura pública
CREATE POLICY "Allow public read access to performance_metrics" ON performance_metrics
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to demo_usage" ON demo_usage
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to satisfaction_surveys" ON satisfaction_surveys
  FOR SELECT USING (true);

-- Políticas para administradores
CREATE POLICY "Allow admin full access to performance_metrics" ON performance_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Allow admin full access to demo_usage" ON demo_usage
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Allow admin full access to satisfaction_surveys" ON satisfaction_surveys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
