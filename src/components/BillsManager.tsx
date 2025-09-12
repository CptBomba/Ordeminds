import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CreditCard,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Edit3,
  Search,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock
} from "lucide-react";

interface Bill {
  id: number;
  title: string;
  amount: number;
  due_date: string;
  paid: boolean;
  category?: string;
  created_at: string;
}

const BillsManager = () => {
  const [bills, setBills] = useState<Bill[]>([
    {
      id: 1,
      title: "Conta de luz",
      amount: 180.50,
      due_date: "2024-01-15",
      paid: false,
      category: "Utilidades",
      created_at: "2024-01-05T08:00:00"
    },
    {
      id: 2,
      title: "Internet",
      amount: 120.00,
      due_date: "2024-01-20",
      paid: true,
      category: "Telecomunicações",
      created_at: "2024-01-05T09:00:00"
    },
    {
      id: 3,
      title: "Aluguel",
      amount: 1500.00,
      due_date: "2024-01-10",
      paid: true,
      category: "Moradia",
      created_at: "2024-01-01T10:00:00"
    },
    {
      id: 4,
      title: "Cartão de crédito",
      amount: 450.75,
      due_date: "2024-01-25",
      paid: false,
      category: "Financeiro",
      created_at: "2024-01-05T11:00:00"
    },
    {
      id: 5,
      title: "Seguro carro",
      amount: 280.00,
      due_date: "2024-01-18",
      paid: false,
      category: "Seguros",
      created_at: "2024-01-03T15:00:00"
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "pending" | "overdue">("all");

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    due_date: undefined as Date | undefined,
    category: ""
  });

  const categories = [
    "Moradia", "Utilidades", "Telecomunicações", "Alimentação", 
    "Transporte", "Saúde", "Educação", "Entretenimento", 
    "Seguros", "Financeiro", "Outros"
  ];

  const resetForm = () => {
    setFormData({
      title: "",
      amount: "",
      due_date: undefined,
      category: ""
    });
    setEditingBill(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount || !formData.due_date) return;

    const billData: Omit<Bill, "id" | "created_at" | "paid"> = {
      title: formData.title.trim(),
      amount: parseFloat(formData.amount),
      due_date: format(formData.due_date, "yyyy-MM-dd"),
      category: formData.category || undefined
    };

    if (editingBill) {
      setBills(bills.map(bill =>
        bill.id === editingBill.id
          ? { ...billData, id: editingBill.id, created_at: editingBill.created_at, paid: editingBill.paid }
          : bill
      ));
    } else {
      const newBill: Bill = {
        ...billData,
        id: Date.now(),
        paid: false,
        created_at: new Date().toISOString()
      };
      setBills([newBill, ...bills]);
    }

    resetForm();
  };

  const togglePaid = (id: number) => {
    setBills(bills.map(bill => 
      bill.id === id ? { ...bill, paid: !bill.paid } : bill
    ));
  };

  const deleteBill = (id: number) => {
    setBills(bills.filter(bill => bill.id !== id));
  };

  const editBill = (bill: Bill) => {
    setFormData({
      title: bill.title,
      amount: bill.amount.toString(),
      due_date: new Date(bill.due_date),
      category: bill.category || ""
    });
    setEditingBill(bill);
    setShowForm(true);
  };

  const isOverdue = (dueDate: string, paid: boolean) => {
    return !paid && isBefore(new Date(dueDate), new Date());
  };

  const isDueSoon = (dueDate: string, paid: boolean) => {
    const due = new Date(dueDate);
    const inThreeDays = addDays(new Date(), 3);
    return !paid && isAfter(due, new Date()) && isBefore(due, inThreeDays);
  };

  const filteredBills = bills
    .filter(bill => {
      switch (filterStatus) {
        case "paid":
          return bill.paid;
        case "pending":
          return !bill.paid && !isOverdue(bill.due_date, bill.paid);
        case "overdue":
          return isOverdue(bill.due_date, bill.paid);
        default:
          return true;
      }
    })
    .filter(bill => 
      bill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.category && bill.category.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  const stats = {
    total: bills.reduce((sum, bill) => sum + bill.amount, 0),
    paid: bills.filter(bill => bill.paid).reduce((sum, bill) => sum + bill.amount, 0),
    pending: bills.filter(bill => !bill.paid).reduce((sum, bill) => sum + bill.amount, 0),
    overdue: bills.filter(bill => isOverdue(bill.due_date, bill.paid)).reduce((sum, bill) => sum + bill.amount, 0),
    count: {
      total: bills.length,
      paid: bills.filter(bill => bill.paid).length,
      pending: bills.filter(bill => !bill.paid && !isOverdue(bill.due_date, bill.paid)).length,
      overdue: bills.filter(bill => isOverdue(bill.due_date, bill.paid)).length
    }
  };

  const getBillStatus = (bill: Bill) => {
    if (bill.paid) return { text: "Pago", variant: "success" as const };
    if (isOverdue(bill.due_date, bill.paid)) return { text: "Vencida", variant: "destructive" as const };
    if (isDueSoon(bill.due_date, bill.paid)) return { text: "Vence em breve", variant: "warning" as const };
    return { text: "Pendente", variant: "secondary" as const };
  };

  const BillCard = ({ bill }: { bill: Bill }) => {
    const status = getBillStatus(bill);
    const dueDate = new Date(bill.due_date);

    return (
      <div className={cn(
        "flex items-start gap-4 p-4 rounded-lg border bg-card",
        isOverdue(bill.due_date, bill.paid) && "border-destructive/20 bg-destructive/5",
        isDueSoon(bill.due_date, bill.paid) && "border-warning/20 bg-warning/5"
      )}>
        <Checkbox
          checked={bill.paid}
          onCheckedChange={() => togglePaid(bill.id)}
          className="mt-1 data-[state=checked]:bg-success data-[state=checked]:border-success"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className={cn(
                "font-medium text-card-foreground",
                bill.paid && "line-through text-muted-foreground"
              )}>
                {bill.title}
              </h3>
              {bill.category && (
                <p className="text-sm text-muted-foreground">{bill.category}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">
                R$ {bill.amount.toFixed(2)}
              </p>
              <Badge variant={status.variant}>
                {status.text}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="w-3 h-3" />
            <span>
              Vence em {format(dueDate, "dd/MM/yyyy", { locale: ptBR })}
            </span>
            {isOverdue(bill.due_date, bill.paid) && (
              <span className="text-destructive font-medium">
                ({Math.abs(Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))} dias atrasada)
              </span>
            )}
            {isDueSoon(bill.due_date, bill.paid) && (
              <span className="text-warning font-medium">
                ({Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias restantes)
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editBill(bill)}
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteBill(bill.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">R$ {stats.total.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">R$ {stats.paid.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Pagas ({stats.count.paid})</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">R$ {stats.pending.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Pendentes ({stats.count.pending})</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">R$ {stats.overdue.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Vencidas ({stats.count.overdue})</p>
          </CardContent>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas ({stats.count.total})</SelectItem>
              <SelectItem value="paid">Pagas ({stats.count.paid})</SelectItem>
              <SelectItem value="pending">Pendentes ({stats.count.pending})</SelectItem>
              <SelectItem value="overdue">Vencidas ({stats.count.overdue})</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Bill Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingBill ? "Editar Conta" : "Nova Conta"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nome da conta..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Valor *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0,00"
                    required
                  />
                </div>

                <div>
                  <Label>Data de vencimento *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {formData.due_date 
                          ? format(formData.due_date, "dd/MM/yyyy", { locale: ptBR })
                          : "Selecionar data"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.due_date}
                        onSelect={(date) => setFormData({ ...formData, due_date: date })}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit">
                  {editingBill ? "Salvar" : "Criar Conta"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bills List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Minhas Contas
            </span>
            <Badge variant="secondary">
              {filteredBills.length} {filteredBills.length === 1 ? "conta" : "contas"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Controle suas finanças e nunca perca um prazo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhuma conta encontrada</p>
              <p className="text-sm">
                {searchTerm ? "Tente ajustar sua busca" : "Adicione uma nova conta para começar"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBills.map(bill => (
                <BillCard key={bill.id} bill={bill} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillsManager;