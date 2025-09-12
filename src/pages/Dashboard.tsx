import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Calendar,
  ShoppingCart,
  CreditCard,
  Plus,
  TrendingUp,
  Clock,
  AlertTriangle,
  User,
  Settings,
  LogOut,
  Bell,
  Target,
  Activity
} from "lucide-react";
import TaskManager from "@/components/TaskManager";
import EventManager from "@/components/EventManager";
import ShoppingManager from "@/components/ShoppingManager";
import BillsManager from "@/components/BillsManager";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    tasks: { total: 12, completed: 8, pending: 4 },
    events: { today: 3, week: 12 },
    shopping: { total: 8, checked: 5 },
    bills: { total: 2500.50, pending: 800.00, paid: 1700.50 }
  });

  const [alerts, setAlerts] = useState([
    { type: "event", text: "Reunião às 15h hoje", urgent: true },
    { type: "bill", text: "Conta de luz vence amanhã - R$ 180,00", urgent: true },
    { type: "task", text: "3 tarefas para hoje", urgent: false }
  ]);

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    color = "primary" 
  }: {
    title: string;
    value: string;
    subtitle: string;
    icon: any;
    trend?: string;
    color?: "primary" | "success" | "warning" | "secondary";
  }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className={`h-4 w-4 text-${color}`} />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{subtitle}</span>
            {trend && (
              <>
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="text-success">{trend}</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border flex flex-col relative">
          <div className="p-6 flex-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold">Ordeminds</h1>
            </div>

            <nav className="space-y-2">
              <Button
                variant={activeTab === "overview" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("overview")}
              >
                <Activity className="w-4 h-4 mr-3" />
                Dashboard
              </Button>
              <Button
                variant={activeTab === "tasks" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("tasks")}
              >
                <CheckCircle2 className="w-4 h-4 mr-3" />
                Tarefas
                <Badge variant="secondary" className="ml-auto">
                  {stats.tasks.pending}
                </Badge>
              </Button>
              <Button
                variant={activeTab === "events" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("events")}
              >
                <Calendar className="w-4 h-4 mr-3" />
                Agenda
                <Badge variant="secondary" className="ml-auto">
                  {stats.events.today}
                </Badge>
              </Button>
              <Button
                variant={activeTab === "shopping" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("shopping")}
              >
                <ShoppingCart className="w-4 h-4 mr-3" />
                Compras
              </Button>
              <Button
                variant={activeTab === "bills" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("bills")}
              >
                <CreditCard className="w-4 h-4 mr-3" />
                Finanças
              </Button>
            </nav>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-muted-foreground">{user?.username || user?.localAccountId}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="flex-1">
                <Settings className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="flex-1" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {activeTab === "overview" && "Dashboard"}
                  {activeTab === "tasks" && "Minhas Tarefas"}
                  {activeTab === "events" && "Minha Agenda"}
                  {activeTab === "shopping" && "Lista de Compras"}
                  {activeTab === "bills" && "Finanças"}
                </h2>
                <p className="text-muted-foreground">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline">
                  <Bell className="w-4 h-4 mr-2" />
                  {alerts.filter(a => a.urgent).length} Alertas
                </Button>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-auto">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Alerts */}
                {alerts.filter(a => a.urgent).length > 0 && (
                  <Card className="border-warning/20 bg-warning/5">
                    <CardHeader>
                      <CardTitle className="text-warning flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Alertas Importantes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {alerts.filter(a => a.urgent).map((alert, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-lg">
                            <Clock className="w-4 h-4 text-warning" />
                            <span className="flex-1">{alert.text}</span>
                            <Button size="sm" variant="outline">
                              Ver
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Tarefas"
                    value={`${stats.tasks.completed}/${stats.tasks.total}`}
                    subtitle={`${Math.round((stats.tasks.completed / stats.tasks.total) * 100)}% concluídas`}
                    icon={CheckCircle2}
                    trend="+12%"
                    color="success"
                  />
                  <StatCard
                    title="Eventos Hoje"
                    value={stats.events.today.toString()}
                    subtitle={`${stats.events.week} esta semana`}
                    icon={Calendar}
                    color="primary"
                  />
                  <StatCard
                    title="Lista de Compras"
                    value={`${stats.shopping.checked}/${stats.shopping.total}`}
                    subtitle={`${stats.shopping.total - stats.shopping.checked} pendentes`}
                    icon={ShoppingCart}
                    color="secondary"
                  />
                  <StatCard
                    title="Contas a Pagar"
                    value={`R$ ${stats.bills.pending.toFixed(2)}`}
                    subtitle={`Total: R$ ${stats.bills.total.toFixed(2)}`}
                    icon={CreditCard}
                    color="warning"
                  />
                </div>

                {/* Progress Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Progresso das Tarefas</CardTitle>
                      <CardDescription>
                        Acompanhe sua produtividade diária
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Concluídas</span>
                          <span>{stats.tasks.completed}/{stats.tasks.total}</span>
                        </div>
                        <Progress 
                          value={(stats.tasks.completed / stats.tasks.total) * 100} 
                          className="h-2"
                        />
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm text-muted-foreground">
                          Meta diária: 80%
                        </span>
                        <Badge variant="success">
                          No prazo
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Resumo Financeiro</CardTitle>
                      <CardDescription>
                        Controle seus gastos mensais
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Contas pagas</span>
                          <span className="font-medium text-success">
                            R$ {stats.bills.paid.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Pendentes</span>
                          <span className="font-medium text-warning">
                            R$ {stats.bills.pending.toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center font-bold">
                            <span>Total</span>
                            <span>R$ {stats.bills.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === "tasks" && <TaskManager />}
            {activeTab === "events" && <EventManager />}
            {activeTab === "shopping" && <ShoppingManager />}
            {activeTab === "bills" && <BillsManager />}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;