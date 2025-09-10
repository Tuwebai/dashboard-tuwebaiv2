// Tipos para Deno en Supabase Edge Functions
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
      toObject(): Record<string, string>;
    };
  };
}

// Declaración de módulos para Deno
declare module 'https://deno.land/std@0.177.0/http/server.ts' {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

export {};
