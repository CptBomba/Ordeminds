import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import heroDashboard from "@/assets/hero-dashboard.jpg";
import {
  CheckCircle2,
  Calendar,
  ShoppingCart,
  CreditCard,
  Target,
  TrendingUp,
  Sparkles,
  ArrowRight,
  BarChart3,
  Bell,
  Shield,
  Smartphone,
  Users,
  Star
} from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: CheckCircle2,
      title: "Gestão de Tarefas",
      description: "Organize suas atividades diárias com praticidade e nunca perca um prazo importante.",
      color: "text-success"
    },
    {
      icon: Calendar,
      title: "Agenda Inteligente",
      description: "Gerencie eventos, compromissos e lembretes em um calendário intuitivo e completo.",
      color: "text-primary"
    },
    {
      icon: ShoppingCart,
      title: "Lista de Compras",
      description: "Crie listas organizadas e não esqueça nenhum item nas suas compras.",
      color: "text-secondary"
    },
    {
      icon: CreditCard,
      title: "Controle Financeiro",
      description: "Monitore contas, vencimentos e tenha total controle sobre suas finanças pessoais.",
      color: "text-warning"
    }
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Empresária",
      content: "O Ordeminds transformou minha organização pessoal. Agora tenho controle total sobre minhas tarefas e finanças!",
      rating: 5
    },
    {
      name: "João Santos",
      role: "Estudante",
      content: "Interface incrível e funcionalidades completas. Uso diariamente para organizar meus estudos e vida pessoal.",
      rating: 5
    },
    {
      name: "Ana Costa",
      role: "Freelancer",
      content: "Perfeito para quem trabalha em casa. Me ajuda a manter o foco e não perder nenhum compromisso importante.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Ordeminds</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link to="/login">
                <Button variant="gradient" className="shadow-glow">
                  Começar Grátis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-6 text-sm">
                <Sparkles className="w-3 h-3 mr-2" />
                Gestão pessoal inteligente
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Organize sua vida com
                <br />
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  simplicidade total
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
                Gerencie tarefas, eventos, compras e finanças em uma plataforma moderna e intuitiva. 
                Sua produtividade pessoal nunca foi tão fácil de controlar.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <Link to="/login">
                  <Button size="lg" variant="gradient" className="shadow-glow interactive-hover">
                    <Target className="w-5 h-5 mr-2" />
                    Começar Agora - Grátis
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="interactive-hover">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Ver Demonstração
                </Button>
              </div>
              
              <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-success" />
                  100% Seguro
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" />
                  Responsivo
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-secondary" />
                  +1000 usuários
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-3xl"></div>
              <img
                src={heroDashboard}
                alt="Dashboard Ordeminds"
                className="relative z-10 w-full rounded-2xl shadow-2xl border border-border/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-6">
              Funcionalidades
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas e intuitivas para organizar todos os aspectos da sua vida pessoal.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center interactive-hover border-0 shadow-elegant bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-subtle flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">10k+</div>
              <p className="text-muted-foreground">Tarefas concluídas</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-success">5k+</div>
              <p className="text-muted-foreground">Eventos organizados</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-secondary">99%</div>
              <p className="text-muted-foreground">Satisfação dos usuários</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-6">
              Depoimentos
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              O que nossos usuários dizem
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="interactive-hover shadow-elegant bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Pronto para organizar sua vida?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Junte-se a milhares de pessoas que já transformaram sua produtividade com o Ordeminds.
            </p>
            
            <Link to="/login">
              <Button size="lg" variant="gradient" className="shadow-glow interactive-hover">
                <Sparkles className="w-5 h-5 mr-2" />
                Começar Gratuitamente
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            
            <p className="text-sm text-muted-foreground mt-4">
              Não é necessário cartão de crédito • Configuração em 2 minutos
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border/40 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">Ordeminds</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              © 2024 Ordeminds. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
