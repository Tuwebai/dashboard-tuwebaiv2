import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/OptimizedMotion';

interface Testimonial {
  text: string;
  author: string;
  avatar?: string;
}

interface TestimonialsBlockProps {
  testimonials?: Testimonial[];
  color?: string;
  onChange?: (data: { testimonials: Testimonial[]; color: string }) => void;
}

const TestimonialsBlock: React.FC<TestimonialsBlockProps> = ({ testimonials = [], color = '#6366f1', onChange }) => {
  const [editing, setEditing] = useState(false);
  const [localTestimonials, setLocalTestimonials] = useState(testimonials);
  const [localColor, setLocalColor] = useState(color);
  const [dataSource, setDataSource] = useState<'manual' | 'api'>('manual');
  const [apiUrl, setApiUrl] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dataSource === 'api' && apiUrl) {
      setLoading(true);
      setApiError('');
      fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setLocalTestimonials(data);
          } else if (Array.isArray(data.testimonials)) {
            setLocalTestimonials(data.testimonials);
          } else {
            setApiError('La API no devolvió un array de testimonios.');
          }
        })
        .catch(() => setApiError('Error al conectar con la API.'))
        .finally(() => setLoading(false));
    }
  }, [dataSource, apiUrl]);

  const handleTestimonialChange = (idx: number, field: keyof Testimonial, value: string) => {
    const updated = localTestimonials.map((t, i) => i === idx ? { ...t, [field]: value } : t);
    setLocalTestimonials(updated);
  };

  const handleAdd = () => {
    setLocalTestimonials([...localTestimonials, { text: '', author: '', avatar: '' }]);
  };

  const handleRemove = (idx: number) => {
    setLocalTestimonials(localTestimonials.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    setEditing(false);
    onChange?.({ testimonials: localTestimonials, color: localColor });
  };

  return (
    <motion.section
      className="w-full rounded-2xl p-8 shadow-xl"
      style={{ background: `linear-gradient(90deg, ${localColor} 0%, #a21caf 100%)` }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">Testimonios</h2>
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
          <label className="text-white text-sm">Fuente de datos:</label>
          <select className="rounded p-1" value={dataSource} onChange={e => setDataSource(e.target.value as any)}>
            <option value="manual">Manual</option>
            <option value="api">API externa</option>
          </select>
          {dataSource === 'api' && (
            <input
              className="rounded p-1 text-black"
              placeholder="URL de la API (ej: /api/testimonials)"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              style={{ minWidth: 200 }}
            />
          )}
        </div>
      </div>
      {apiError && <div className="text-red-400 mb-2">{apiError}</div>}
      {loading && <div className="text-blue-200 mb-2">Cargando testimonios...</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {(dataSource === 'api' ? localTestimonials : localTestimonials).map((t, idx) => (
          <motion.div
            key={idx}
            className="bg-[#18181b] rounded-xl p-6 flex flex-col items-center shadow-lg relative"
            whileHover={{ scale: 1.03 }}
          >
            {editing && dataSource === 'manual' ? (
              <>
                <textarea
                  className="w-full mb-2 p-2 rounded text-black"
                  value={t.text}
                  onChange={e => handleTestimonialChange(idx, 'text', e.target.value)}
                  placeholder="Testimonio"
                />
                <input
                  className="w-full mb-2 p-2 rounded text-black"
                  value={t.author}
                  onChange={e => handleTestimonialChange(idx, 'author', e.target.value)}
                  placeholder="Autor"
                />
                <input
                  className="w-full mb-2 p-2 rounded text-black"
                  value={t.avatar}
                  onChange={e => handleTestimonialChange(idx, 'avatar', e.target.value)}
                  placeholder="URL del avatar"
                />
                <button className="absolute top-2 right-2 text-red-400" onClick={() => handleRemove(idx)}>Eliminar</button>
              </>
            ) : (
              <>
                {t.avatar && <img src={t.avatar} alt={t.author} className="w-16 h-16 object-cover rounded-full mb-2" onClick={() => setEditing(true)} />}
                <p className="text-white text-lg mb-2 text-center" onClick={() => setEditing(true)}>{t.text}</p>
                <span className="text-purple-300 font-bold" onClick={() => setEditing(true)}>{t.author}</span>
              </>
            )}
          </motion.div>
        ))}
      </div>
      {editing && dataSource === 'manual' && (
        <div className="flex gap-4 mt-6 items-center">
          <button className="bg-white text-blue-700 px-4 py-2 rounded-full shadow" onClick={handleAdd}>Agregar</button>
          <label className="text-white">Color:</label>
          <input type="color" value={localColor} onChange={e => setLocalColor(e.target.value)} />
        </div>
      )}
    </motion.section>
  );
};

export default TestimonialsBlock; 
