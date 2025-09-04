import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';


export default function Settings() {
  const { user } = useApp();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      // Actualizar datos del usuario en Supabase
      const { error } = await supabase
        .from('users')
        .update({
          full_name: name,
          email,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: 'Configuración guardada',
        description: 'Tus cambios han sido guardados correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-2">Configuración</h1>
      <p className="text-muted-foreground mb-6">Actualiza tu información personal y preferencias.</p>
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSave}>
            <div>
              <label className="block text-sm mb-1">Nombre</label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <Input value={email} onChange={e => setEmail(e.target.value)} type="email" />
            </div>
            <div>
              <label className="block text-sm mb-1">Contraseña</label>
              <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Nueva contraseña" />
            </div>
            <Button type="submit">Guardar cambios</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
