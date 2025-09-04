import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Product {
  name: string;
  price: string;
  image: string;
}

interface ProductsGridBlockProps {
  products: Product[];
  columns?: number;
  color?: string;
  onChange?: (data: { products: Product[]; columns: number; color: string }) => void;
}

const ProductsGridBlock: React.FC<ProductsGridBlockProps> = ({ products = [], columns = 3, color = '#6366f1', onChange }) => {
  const [editing, setEditing] = useState(false);
  const [localProducts, setLocalProducts] = useState(products);
  const [localColumns, setLocalColumns] = useState(columns);
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
            setLocalProducts(data);
          } else if (Array.isArray(data.products)) {
            setLocalProducts(data.products);
          } else {
            setApiError('La API no devolvió un array de productos.');
          }
        })
        .catch(() => setApiError('Error al conectar con la API.'))
        .finally(() => setLoading(false));
    }
  }, [dataSource, apiUrl]);

  const handleProductChange = (idx: number, field: keyof Product, value: string) => {
    const updated = localProducts.map((p, i) => i === idx ? { ...p, [field]: value } : p);
    setLocalProducts(updated);
  };

  const handleSave = () => {
    setEditing(false);
    onChange?.({ products: localProducts, columns: localColumns, color: localColor });
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
        <h2 className="text-2xl font-bold text-white">Productos destacados</h2>
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
          <label className="text-white text-sm">Fuente de datos:</label>
          <select className="rounded p-1" value={dataSource} onChange={e => setDataSource(e.target.value as any)}>
            <option value="manual">Manual</option>
            <option value="api">API externa</option>
          </select>
          {dataSource === 'api' && (
            <input
              className="rounded p-1 text-black"
              placeholder="URL de la API (ej: /api/products)"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              style={{ minWidth: 200 }}
            />
          )}
        </div>
      </div>
      {apiError && <div className="text-red-400 mb-2">{apiError}</div>}
      {loading && <div className="text-blue-200 mb-2">Cargando productos...</div>}
      <div className={`grid gap-8`} style={{ gridTemplateColumns: `repeat(${localColumns}, minmax(0, 1fr))` }}>
        {(dataSource === 'api' ? localProducts : localProducts).map((product, idx) => (
          <motion.div
            key={idx}
            className="bg-[#18181b] rounded-xl p-4 flex flex-col items-center shadow-lg"
            whileHover={{ scale: 1.03 }}
          >
            {editing && dataSource === 'manual' ? (
              <>
                <input
                  className="w-full mb-2 p-2 rounded text-black"
                  value={product.name}
                  onChange={e => handleProductChange(idx, 'name', e.target.value)}
                  placeholder="Nombre"
                />
                <input
                  className="w-full mb-2 p-2 rounded text-black"
                  value={product.price}
                  onChange={e => handleProductChange(idx, 'price', e.target.value)}
                  placeholder="Precio"
                />
                <input
                  className="w-full mb-2 p-2 rounded text-black"
                  value={product.image}
                  onChange={e => handleProductChange(idx, 'image', e.target.value)}
                  placeholder="URL de la imagen"
                />
              </>
            ) : (
              <>
                <img src={product.image} alt={product.name} className="w-32 h-32 object-cover rounded-lg mb-2" onClick={() => setEditing(true)} />
                <h3 className="text-lg font-bold text-white mb-1" onClick={() => setEditing(true)}>{product.name}</h3>
                <span className="text-purple-300 font-bold" onClick={() => setEditing(true)}>{product.price}</span>
              </>
            )}
          </motion.div>
        ))}
      </div>
      {editing && dataSource === 'manual' && (
        <div className="flex gap-4 mt-6 items-center">
          <label className="text-white">Columnas:</label>
          <input type="number" min={1} max={4} value={localColumns} onChange={e => setLocalColumns(Number(e.target.value))} className="w-16 p-1 rounded" />
          <label className="text-white">Color:</label>
          <input type="color" value={localColor} onChange={e => setLocalColor(e.target.value)} />
        </div>
      )}
    </motion.section>
  );
};

export default ProductsGridBlock; 
