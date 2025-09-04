import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Mail, Download, ArrowRight } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'destructive', 'outline', 'ghost', 'link'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Botón Primario',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Botón Secundario',
    variant: 'secondary',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Eliminar',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Botón Outline',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Botón Ghost',
    variant: 'ghost',
  },
};

export const Link: Story = {
  args: {
    children: 'Enlace',
    variant: 'link',
  },
};

export const WithLeftIcon: Story = {
  args: {
    children: 'Enviar Email',
    leftIcon: <Mail className="h-4 w-4" />,
    variant: 'primary',
  },
};

export const WithRightIcon: Story = {
  args: {
    children: 'Descargar',
    rightIcon: <Download className="h-4 w-4" />,
    variant: 'outline',
  },
};

export const WithBothIcons: Story = {
  args: {
    children: 'Continuar',
    leftIcon: <ArrowRight className="h-4 w-4" />,
    rightIcon: <ArrowRight className="h-4 w-4" />,
    variant: 'primary',
  },
};

export const Loading: Story = {
  args: {
    children: 'Cargando...',
    loading: true,
    variant: 'primary',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Deshabilitado',
    disabled: true,
    variant: 'primary',
  },
};

export const FullWidth: Story = {
  args: {
    children: 'Ancho Completo',
    fullWidth: true,
    variant: 'primary',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm" variant="primary">Pequeño</Button>
      <Button size="md" variant="primary">Mediano</Button>
      <Button size="lg" variant="primary">Grande</Button>
      <Button size="xl" variant="primary">Extra Grande</Button>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Primario</Button>
      <Button variant="secondary">Secundario</Button>
      <Button variant="destructive">Destructivo</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Enlace</Button>
    </div>
  ),
};
