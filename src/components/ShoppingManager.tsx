import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Plus,
  ShoppingCart,
  Trash2,
  Search,
  Check
} from "lucide-react";

interface ShoppingItem {
  id: number;
  title: string;
  qty?: string;
  done: boolean;
  created_at: string;
}

const ShoppingManager = () => {
  const [items, setItems] = useState<ShoppingItem[]>([
    { id: 1, title: "Leite integral", qty: "2L", done: false, created_at: "2024-01-10T08:00:00" },
    { id: 2, title: "Pão francês", qty: "1kg", done: true, created_at: "2024-01-10T09:00:00" },
    { id: 3, title: "Ovos", qty: "1 dúzia", done: false, created_at: "2024-01-10T10:00:00" },
    { id: 4, title: "Banana", qty: "1kg", done: false, created_at: "2024-01-10T11:00:00" },
    { id: 5, title: "Shampoo", done: true, created_at: "2024-01-09T15:00:00" },
    { id: 6, title: "Arroz", qty: "5kg", done: false, created_at: "2024-01-09T16:00:00" }
  ]);

  const [newItem, setNewItem] = useState("");
  const [newQty, setNewQty] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");

  const addItem = () => {
    if (!newItem.trim()) return;

    const item: ShoppingItem = {
      id: Date.now(),
      title: newItem.trim(),
      qty: newQty.trim() || undefined,
      done: false,
      created_at: new Date().toISOString()
    };

    setItems([item, ...items]);
    setNewItem("");
    setNewQty("");
  };

  const toggleItem = (id: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, done: !item.done } : item
    ));
  };

  const deleteItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const clearCompleted = () => {
    setItems(items.filter(item => !item.done));
  };

  const filteredItems = items
    .filter(item => {
      if (filter === "pending") return !item.done;
      if (filter === "done") return item.done;
      return true;
    })
    .filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.qty && item.qty.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const stats = {
    total: items.length,
    done: items.filter(item => item.done).length,
    pending: items.filter(item => !item.done).length
  };

  const ShoppingItemCard = ({ item }: { item: ShoppingItem }) => (
    <div 
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border bg-card transition-all",
        item.done && "opacity-60 bg-muted/50"
      )}
    >
      <Checkbox
        checked={item.done}
        onCheckedChange={() => toggleItem(item.id)}
        className="data-[state=checked]:bg-success data-[state=checked]:border-success"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <p className={cn(
            "font-medium",
            item.done && "line-through text-muted-foreground"
          )}>
            {item.title}
          </p>
          {item.qty && (
            <Badge variant="outline" className="text-xs">
              {item.qty}
            </Badge>
          )}
        </div>
      </div>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => deleteItem(item.id)}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total de itens</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">{stats.done}</div>
            <p className="text-sm text-muted-foreground">Concluídos</p>
          </CardContent>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar itens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Todos ({stats.total})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
          >
            Pendentes ({stats.pending})
          </Button>
          <Button
            variant={filter === "done" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("done")}
          >
            Feitos ({stats.done})
          </Button>
        </div>
      </div>

      {/* Add Item Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Adicionar Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Nome do item..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && addItem()}
            />
            
            <Input
              placeholder="Quantidade (opcional)"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              className="w-full sm:w-32"
              onKeyDown={(e) => e.key === "Enter" && addItem()}
            />
            
            <Button onClick={addItem} disabled={!newItem.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shopping List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Lista de Compras
            </span>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                {filteredItems.length} {filteredItems.length === 1 ? "item" : "itens"}
              </Badge>
              {stats.done > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearCompleted}
                  className="text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Limpar concluídos
                </Button>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Organize suas compras e não esqueça de nada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {filter === "all" && "Lista vazia"}
                {filter === "pending" && "Nenhum item pendente"}
                {filter === "done" && "Nenhum item concluído"}
              </p>
              <p className="text-sm">
                {searchTerm ? "Tente ajustar sua busca" : "Adicione itens à sua lista de compras"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map(item => (
                <ShoppingItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShoppingManager;