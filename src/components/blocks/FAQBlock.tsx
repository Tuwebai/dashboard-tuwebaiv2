import React, { useState } from 'react';
import { motion, AnimatePresence } from '@/components/OptimizedMotion';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQBlockProps {
  faqs?: FAQItem[];
  color?: string;
  onChange?: (data: { faqs: FAQItem[]; color: string }) => void;
}

const defaultFAQs: FAQItem[] = [
  { question: '¿Puedo personalizar mi web sin saber programar?', answer: 'Sí, puedes editar todo visualmente y en tiempo real.' },
  { question: '¿Puedo vender productos online?', answer: 'Sí, la plataforma soporta ecommerce y pagos integrados.' },
];

const FAQBlock: React.FC<FAQBlockProps> = ({ faqs = defaultFAQs, color = '#6366f1', onChange }) => {
  const [editing, setEditing] = useState(false);
  const [localFAQs, setLocalFAQs] = useState(faqs);
  const [localColor, setLocalColor] = useState(color);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const handleFAQChange = (idx: number, field: keyof FAQItem, value: string) => {
    const updated = localFAQs.map((f, i) => i === idx ? { ...f, [field]: value } : f);
    setLocalFAQs(updated);
  };

  const handleAdd = () => {
    setLocalFAQs([...localFAQs, { question: '', answer: '' }]);
  };

  const handleRemove = (idx: number) => {
    setLocalFAQs(localFAQs.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    setEditing(false);
    onChange?.({ faqs: localFAQs, color: localColor });
  };

  return (
    <motion.section
      className="w-full rounded-2xl p-8 shadow-xl"
      style={{ background: `linear-gradient(90deg, ${localColor} 0%, #a21caf 100%)` }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Preguntas frecuentes</h2>
        <button
          className="bg-white text-blue-700 font-bold px-6 py-2 rounded-full shadow hover:bg-blue-100 transition"
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Guardar' : 'Editar'}
        </button>
      </div>
      <div className="space-y-4">
        {localFAQs.map((faq, idx) => (
          <motion.div key={idx} className="bg-[#18181b] rounded-xl p-4 shadow-lg relative">
            {editing ? (
              <>
                <input
                  className="w-full mb-2 p-2 rounded text-black"
                  value={faq.question}
                  onChange={e => handleFAQChange(idx, 'question', e.target.value)}
                  placeholder="Pregunta"
                />
                <textarea
                  className="w-full mb-2 p-2 rounded text-black"
                  value={faq.answer}
                  onChange={e => handleFAQChange(idx, 'answer', e.target.value)}
                  placeholder="Respuesta"
                />
                <button className="absolute top-2 right-2 text-red-400" onClick={() => handleRemove(idx)}>Eliminar</button>
              </>
            ) : (
              <>
                <button className="w-full text-left" onClick={() => setOpenIdx(openIdx === idx ? null : idx)}>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-lg">{faq.question}</span>
                    <span className="text-purple-300 font-bold">{openIdx === idx ? '-' : '+'}</span>
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {openIdx === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="text-blue-100 mt-2">{faq.answer}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        ))}
      </div>
      {editing && (
        <div className="flex gap-4 mt-6 items-center">
          <button className="bg-white text-blue-700 px-4 py-2 rounded-full shadow" onClick={handleAdd}>Agregar</button>
          <label className="text-white">Color:</label>
          <input type="color" value={localColor} onChange={e => setLocalColor(e.target.value)} />
        </div>
      )}
    </motion.section>
  );
};

export default FAQBlock; 
