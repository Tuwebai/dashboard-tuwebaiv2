import React, { useState } from 'react';
import { motion } from '@/components/OptimizedMotion';

interface HeroBlockProps {
  title: string;
  subtitle: string;
  image?: string;
  color?: string;
  onChange?: (data: { title: string; subtitle: string; image?: string; color?: string }) => void;
}

const HeroBlock: React.FC<HeroBlockProps> = ({ title, subtitle, image, color = '#6366f1', onChange }) => {
  const [editing, setEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [localSubtitle, setLocalSubtitle] = useState(subtitle);
  const [localImage, setLocalImage] = useState(image || '');
  const [localColor, setLocalColor] = useState(color);

  const handleSave = () => {
    setEditing(false);
    onChange?.({ title: localTitle, subtitle: localSubtitle, image: localImage, color: localColor });
  };

  return (
    <motion.section
      className="w-full flex flex-col md:flex-row items-center justify-between rounded-2xl p-6 md:p-10 gap-6 md:gap-8 shadow-xl"
      style={{ background: `linear-gradient(90deg, ${localColor} 0%, #a21caf 100%)` }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex-1 text-center md:text-left">
        {editing ? (
          <>
            <input
              className="text-2xl md:text-4xl lg:text-6xl font-bold bg-transparent border-b border-blue-400 mb-2 w-full text-white outline-none"
              value={localTitle}
              onChange={e => setLocalTitle(e.target.value)}
              autoFocus
            />
            <textarea
              className="text-base md:text-lg bg-transparent border-b border-blue-200 w-full text-blue-100 outline-none"
              value={localSubtitle}
              onChange={e => setLocalSubtitle(e.target.value)}
            />
          </>
        ) : (
          <>
            <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-white mb-2 break-words" onClick={() => setEditing(true)}>{localTitle}</h1>
            <p className="text-base md:text-lg text-blue-100 mb-4 break-words" onClick={() => setEditing(true)}>{localSubtitle}</p>
          </>
        )}
        <button
          className="bg-white text-blue-700 font-bold px-6 py-3 rounded-full shadow hover:bg-blue-100 transition mt-4"
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Guardar' : 'Editar'}
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center w-full md:w-auto">
        {editing ? (
          <input
            type="text"
            className="w-full p-2 rounded bg-white text-black"
            value={localImage}
            onChange={e => setLocalImage(e.target.value)}
            placeholder="URL de la imagen"
          />
        ) : localImage ? (
          <img src={localImage} alt="Hero" className="max-w-xs w-full md:max-w-xs rounded-xl shadow-lg object-cover" onClick={() => setEditing(true)} />
        ) : (
          <div className="w-40 h-28 md:w-64 md:h-40 bg-blue-900/30 rounded-xl flex items-center justify-center text-white opacity-60" onClick={() => setEditing(true)}>
            Imagen
          </div>
        )}
      </div>
      {editing && (
        <div className="absolute top-4 right-4 flex gap-2">
          <input type="color" value={localColor} onChange={e => setLocalColor(e.target.value)} />
        </div>
      )}
    </motion.section>
  );
};

export default HeroBlock; 
