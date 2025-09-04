import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="bg-card border-border shadow-card max-w-md w-full">
        <CardContent className="text-center p-8">
          <div className="mb-6">
            <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
            <h2 className="text-2xl font-semibold mb-2">Página no encontrada</h2>
            <p className="text-muted-foreground">
              La página que buscas no existe o ha sido movida.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button asChild className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
              <Link to="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Ir al Dashboard
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full border-border hover:border-primary/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver atrás
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
