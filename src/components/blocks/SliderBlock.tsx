import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Slide {
  image: string;
  title: string;
  description: string;
}

interface SliderBlockProps {
  slides?: Slide[];
  color?: string;
  onChange?: (data: { slides: Slide[]; color: string }) => void;
}

const defaultSlides: Slide[] = [
  {
    image: 'https://images.unsplash.com/photo-1513708927688-890fe8c7b8c3?auto=format&fit=crop&w=600&q=80',
    title: 'Slide 1',
    description: 'Descripción del slide 1',
  },
  {
    image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80',
    title: 'Slide 2',
    description: 'Descripción del slide 2',
  },
  {
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    title: 'Slide 3',
    description: 'Descripción del slide 3',
  },
];

const SliderBlock: React.FC<SliderBlockProps> = ({ slides, color = '#6366f1', onChange }) => {
  // Si slides es undefined o vacío, usar defaultSlides
  const safeSlides = slides && slides.length > 0 ? slides : defaultSlides;
  const [editing, setEditing] = useState(false);
  const [localSlides, setLocalSlides] = useState(safeSlides);
  const [localColor, setLocalColor] = useState(color);
  const [current, setCurrent] = useState(0);

  const handleSlideChange = (idx: number, field: keyof Slide, value: string) => {
    const updated = localSlides.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    setLocalSlides(updated);
  };

  const handleSave = () => {
    setEditing(false);
    onChange?.({ slides: localSlides, color: localColor });
  };

  const next = () => setCurrent((c) => (c + 1) % localSlides.length);
  const prev = () => setCurrent((c) => (c - 1 + localSlides.length) % localSlides.length);

  return (
    <motion.section
      className="w-full rounded-2xl p-8 shadow-xl flex flex-col items-center"
      style={{ background: `linear-gradient(90deg, ${localColor} 0%, #a21caf 100%)` }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center w-full mb-4">
        <h2 className="text-2xl font-bold text-white">Slider</h2>
        <button
          className="bg-white text-blue-700 font-bold px-6 py-2 rounded-full shadow hover:bg-blue-100 transition"
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Guardar' : 'Editar'}
        </button>
      </div>
      <div className="relative w-full max-w-xl flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center"
          >
            {editing ? (
              <>
                <input
                  className="w-full mb-2 p-2 rounded text-black"
                  value={localSlides[current]?.title || ''}
                  onChange={e => handleSlideChange(current, 'title', e.target.value)}
                  placeholder="Título"
                />
                <textarea
                  className="w-full mb-2 p-2 rounded text-black"
                  value={localSlides[current]?.description || ''}
                  onChange={e => handleSlideChange(current, 'description', e.target.value)}
                  placeholder="Descripción"
                />
                <input
                  className="w-full mb-2 p-2 rounded text-black"
                  value={localSlides[current]?.image || ''}
                  onChange={e => handleSlideChange(current, 'image', e.target.value)}
                  placeholder="URL de la imagen"
                />
              </>
            ) : (
              <>
                <img src={localSlides[current]?.image || ''} alt={localSlides[current]?.title || ''} className="w-full max-h-64 object-cover rounded-xl mb-2" onClick={() => setEditing(true)} />
                <h3 className="text-lg font-bold text-white mb-1" onClick={() => setEditing(true)}>{localSlides[current]?.title || ''}</h3>
                <span className="text-blue-100" onClick={() => setEditing(true)}>{localSlides[current]?.description || ''}</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-4 mt-4">
          <button onClick={prev} className="bg-white text-blue-700 px-4 py-2 rounded-full shadow">Anterior</button>
          <button onClick={next} className="bg-white text-blue-700 px-4 py-2 rounded-full shadow">Siguiente</button>
        </div>
      </div>
      {editing && (
        <div className="flex gap-4 mt-6 items-center">
          <label className="text-white">Color:</label>
          <input type="color" value={localColor} onChange={e => setLocalColor(e.target.value)} />
        </div>
      )}
    </motion.section>
  );
};

export default SliderBlock; 
