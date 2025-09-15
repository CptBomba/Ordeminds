import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Mail, Lock, User, ArrowRight, Sparkles, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app');
    }
  }, [isAuthenticated, navigate]);

  const handleAzureLogin = async () => {
    await login();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero/Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-subtle opacity-10" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="mb-6">
              <Logo size="lg" className="text-white [&_span]:text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Organize sua vida com<br />
              <span className="text-primary-glow">simplicidade</span>
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Gerencie tarefas, eventos, compras e finanças em um só lugar.
              Sua produtividade pessoal nunca foi tão fácil.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary-glow" />
              <span>Dashboard intuitivo e organizado</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary-glow" />
              <span>Sincronização em tempo real</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary-glow" />
              <span>Alertas e lembretes inteligentes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-muted/30">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Logo size="md" />
            </div>
            <div className="flex justify-center">
              <ThemeToggle />
            </div>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="shadow-elegant">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Bem-vindo de volta!</CardTitle>
                  <CardDescription>
                    Entre com sua conta Microsoft para acessar seu dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Button 
                    onClick={handleAzureLogin}
                    className="w-full" 
                    size="lg"
                    variant="gradient"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Conectando..."
                    ) : (
                      <>
                        <Shield className="w-5 h-5 mr-2" />
                        Entrar com Microsoft
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Autenticação segura com Azure AD
                      </span>
                    </div>
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Shield className="w-4 h-4" />
                      <span>Protegido por Microsoft Azure</span>
                    </div>
                    <p>Seus dados estão seguros com autenticação empresarial</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="shadow-elegant">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Acesso Corporativo</CardTitle>
                  <CardDescription>
                    Entre com sua conta Microsoft corporativa
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Button 
                    onClick={handleAzureLogin}
                    className="w-full" 
                    size="lg"
                    variant="gradient"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Conectando..."
                    ) : (
                      <>
                        <Shield className="w-5 h-5 mr-2" />
                        Acessar com Microsoft
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  <div className="space-y-4 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>Single Sign-On (SSO)</span>
                    </div>
                    <div className="space-y-2">
                      <p>✓ Autenticação multi-fator habilitada</p>
                      <p>✓ Integração com Active Directory</p>
                      <p>✓ Políticas de segurança corporativa</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Login;