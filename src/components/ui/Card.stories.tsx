import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { Button } from './Button';
import { Badge } from '@/components/ui/Badge';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'elevated', 'outlined', 'glass'],
    },
    padding: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Tarjeta por Defecto</CardTitle>
        <CardDescription>
          Esta es una tarjeta con el estilo por defecto del sistema de diseño.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Contenido de la tarjeta con información relevante y bien estructurada.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">Acción</Button>
      </CardFooter>
    </Card>
  ),
};

export const Elevated: Story = {
  render: () => (
    <Card variant="elevated" className="w-80">
      <CardHeader>
        <CardTitle>Tarjeta Elevada</CardTitle>
        <CardDescription>
          Tarjeta con sombra más pronunciada para mayor énfasis visual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Ideal para contenido importante que necesita destacar.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="primary" size="sm">Acción Principal</Button>
      </CardFooter>
    </Card>
  ),
};

export const Outlined: Story = {
  render: () => (
    <Card variant="outlined" className="w-80">
      <CardHeader>
        <CardTitle>Tarjeta con Borde</CardTitle>
        <CardDescription>
          Tarjeta con borde más grueso y sin sombra.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Perfecta para contenido que necesita definición clara.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="secondary" size="sm">Acción Secundaria</Button>
      </CardFooter>
    </Card>
  ),
};

export const Glass: Story = {
  render: () => (
    <div className="p-8 bg-gradient-to-br from-blue-500 to-purple-600">
      <Card variant="glass" className="w-80">
        <CardHeader>
          <CardTitle>Tarjeta Glass</CardTitle>
          <CardDescription>
            Tarjeta con efecto de cristal y fondo translúcido.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ideal para overlays y contenido flotante.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm">Acción</Button>
        </CardFooter>
      </Card>
    </div>
  ),
};

export const NoHover: Story = {
  render: () => (
    <Card hover={false} className="w-80">
      <CardHeader>
        <CardTitle>Sin Efecto Hover</CardTitle>
        <CardDescription>
          Tarjeta sin efectos de hover para contenido estático.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Útil para información que no requiere interacción.
        </p>
      </CardContent>
    </Card>
  ),
};

export const Interactive: Story = {
  render: () => (
    <Card interactive className="w-80">
      <CardHeader>
        <CardTitle>Tarjeta Interactiva</CardTitle>
        <CardDescription>
          Tarjeta que indica que es clickeable.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Haz clic en esta tarjeta para ver la interacción.
        </p>
      </CardContent>
    </Card>
  ),
};

export const DifferentPaddings: Story = {
  render: () => (
    <div className="space-y-4">
      <Card padding="sm" className="w-80">
        <CardContent>
          <p className="text-sm">Padding pequeño</p>
        </CardContent>
      </Card>
      <Card padding="md" className="w-80">
        <CardContent>
          <p className="text-sm">Padding mediano (por defecto)</p>
        </CardContent>
      </Card>
      <Card padding="lg" className="w-80">
        <CardContent>
          <p className="text-sm">Padding grande</p>
        </CardContent>
      </Card>
      <Card padding="xl" className="w-80">
        <CardContent>
          <p className="text-sm">Padding extra grande</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const WithBadges: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Proyecto Activo</CardTitle>
          <Badge variant="success">En Progreso</Badge>
        </div>
        <CardDescription>
          Proyecto de desarrollo web con IA integrada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progreso:</span>
            <span className="font-medium">75%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm">Ver Detalles</Button>
        <Button variant="primary" size="sm">Continuar</Button>
      </CardFooter>
    </Card>
  ),
};

export const StatsCard: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-96">
      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-primary">1,234</div>
          <p className="text-sm text-muted-foreground">Usuarios Activos</p>
        </CardContent>
      </Card>
      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-green-600">+12%</div>
          <p className="text-sm text-muted-foreground">Crecimiento</p>
        </CardContent>
      </Card>
    </div>
  ),
};
