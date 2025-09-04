import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormField {
  label: string;
  type: 'text' | 'email' | 'number' | 'password';
  value: string;
  required?: boolean;
}

interface Step {
  title: string;
  fields: FormField[];
}

interface MultiStepFormBlockProps {
  steps?: Step[];
  color?: string;
  onChange?: (data: { steps: Step[]; color: string }) => void;
}

const MultiStepFormBlock: React.FC<MultiStepFormBlockProps> = ({ steps = [], color = '#6366f1', onChange }) => {
  const [editing, setEditing] = useState(false);
  const [localSteps, setLocalSteps] = useState(steps);
  const [localColor, setLocalColor] = useState(color);
  const [current, setCurrent] = useState(0);
  const [formData, setFormData] = useState(() =>
    steps.map(step => step.fields.map(field => field.value))
  );
  const [errors, setErrors] = useState<string[][]>([]);

  const handleFieldChange = (stepIdx: number, fieldIdx: number, value: string) => {
    const updatedSteps = localSteps.map((step, sIdx) =>
      sIdx === stepIdx
        ? {
            ...step,
            fields: step.fields.map((f, fIdx) =>
              fIdx === fieldIdx ? { ...f, value } : f
            ),
          }
        : step
    );
    setLocalSteps(updatedSteps);
    setFormData(updatedSteps.map(step => step.fields.map(f => f.value)));
  };

  const handleAddStep = () => {
    setLocalSteps([...localSteps, { title: 'Nuevo paso', fields: [] }]);
  };

  const handleRemoveStep = (idx: number) => {
    setLocalSteps(localSteps.filter((_, i) => i !== idx));
  };

  const handleAddField = (stepIdx: number) => {
    const updated = localSteps.map((step, idx) =>
      idx === stepIdx
        ? { ...step, fields: [...step.fields, { label: '', type: 'text' as const, value: '' }] }
        : step
    );
    setLocalSteps(updated);
  };

  const handleRemoveField = (stepIdx: number, fieldIdx: number) => {
    const updated = localSteps.map((step, idx) =>
      idx === stepIdx
        ? { ...step, fields: step.fields.filter((_, fIdx) => fIdx !== fieldIdx) }
        : step
    );
    setLocalSteps(updated);
  };

  const handleSave = () => {
    setEditing(false);
    onChange?.({ steps: localSteps, color: localColor });
  };

  const validateStep = (stepIdx: number) => {
    const step = localSteps[stepIdx];
    const stepErrors = step.fields.map(f => (f.required && !f.value ? 'Campo requerido' : ''));
    setErrors(prev => {
      const copy = [...prev];
      copy[stepIdx] = stepErrors;
      return copy;
    });
    return stepErrors.every(e => !e);
  };

  const next = () => {
    if (validateStep(current)) setCurrent(c => Math.min(c + 1, localSteps.length - 1));
  };
  const prev = () => setCurrent(c => Math.max(c - 1, 0));

  return (
    <motion.section
      className="w-full rounded-2xl p-8 shadow-xl"
      style={{ background: `linear-gradient(90deg, ${localColor} 0%, #a21caf 100%)` }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Formulario multi-step</h2>
        <button
          className="bg-white text-blue-700 font-bold px-6 py-2 rounded-full shadow hover:bg-blue-100 transition"
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Guardar' : 'Editar'}
        </button>
      </div>
      <div className="flex gap-2 mb-6">
        {localSteps.map((step, idx) => (
          <div
            key={idx}
            className={`h-2 rounded-full flex-1 ${idx <= current ? 'bg-white' : 'bg-blue-200/40'}`}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          <h3 className="text-lg font-bold text-white mb-4">
            {editing ? (
              <input
                className="w-full p-2 rounded text-black mb-2"
                value={localSteps[current].title}
                onChange={e => {
                  const updated = localSteps.map((s, i) => i === current ? { ...s, title: e.target.value } : s);
                  setLocalSteps(updated);
                }}
              />
            ) : (
              localSteps[current].title
            )}
          </h3>
          {localSteps[current].fields.map((field, idx) => (
            <div key={idx} className="mb-4">
              {editing ? (
                <div className="flex gap-2 items-center">
                  <input
                    className="p-2 rounded text-black flex-1"
                    value={field.label}
                    onChange={e => {
                      const updated = localSteps.map((s, sIdx) =>
                        sIdx === current
                          ? {
                              ...s,
                              fields: s.fields.map((f, fIdx) =>
                                fIdx === idx ? { ...f, label: e.target.value } : f
                              ),
                            }
                          : s
                      );
                      setLocalSteps(updated);
                    }}
                    placeholder="Campo"
                  />
                  <select
                    className="p-2 rounded text-black"
                    value={field.type}
                    onChange={e => {
                      const updated = localSteps.map((s, sIdx) =>
                        sIdx === current
                          ? {
                              ...s,
                              fields: s.fields.map((f, fIdx) =>
                                fIdx === idx ? { ...f, type: e.target.value as 'text' | 'email' | 'number' | 'password' } : f
                              ),
                            }
                          : s
                      );
                      setLocalSteps(updated);
                    }}
                  >
                    <option value="text">Texto</option>
                    <option value="email">Email</option>
                    <option value="number">Número</option>
                    <option value="password">Contraseña</option>
                  </select>
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={e => {
                      const updated = localSteps.map((s, sIdx) =>
                        sIdx === current
                          ? {
                              ...s,
                              fields: s.fields.map((f, fIdx) =>
                                fIdx === idx ? { ...f, required: e.target.checked } : f
                              ),
                            }
                          : s
                      );
                      setLocalSteps(updated);
                    }}
                  />
                  <button className="text-red-400" onClick={() => handleRemoveField(current, idx)}>Eliminar</button>
                </div>
              ) : (
                <div className="flex flex-col">
                  <label className="text-white mb-1">{field.label}{field.required && '*'}</label>
                  <input
                    className="p-2 rounded text-black"
                    type={field.type}
                    value={field.value}
                    onChange={e => handleFieldChange(current, idx, e.target.value)}
                  />
                  {errors[current]?.[idx] && <span className="text-red-400 text-xs">{errors[current][idx]}</span>}
                </div>
              )}
            </div>
          ))}
          {editing && (
            <button className="bg-white text-blue-700 px-4 py-2 rounded-full shadow mb-4" onClick={() => handleAddField(current)}>Agregar campo</button>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-4 mt-6 items-center">
        <button
          className="bg-white text-blue-700 px-4 py-2 rounded-full shadow"
          onClick={prev}
          disabled={current === 0}
        >
          Anterior
        </button>
        <button
          className="bg-white text-blue-700 px-4 py-2 rounded-full shadow"
          onClick={next}
          disabled={current === localSteps.length - 1}
        >
          Siguiente
        </button>
        {editing && (
          <>
            <button className="bg-white text-blue-700 px-4 py-2 rounded-full shadow" onClick={handleAddStep}>Agregar paso</button>
            <button className="bg-white text-red-700 px-4 py-2 rounded-full shadow" onClick={() => handleRemoveStep(current)}>Eliminar paso</button>
            <label className="text-white">Color:</label>
            <input type="color" value={localColor} onChange={e => setLocalColor(e.target.value)} />
          </>
        )}
      </div>
    </motion.section>
  );
};

export default MultiStepFormBlock; 
