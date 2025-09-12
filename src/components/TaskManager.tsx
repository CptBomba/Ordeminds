import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Calendar as CalendarIcon,
  Trash2,
  Clock,
  CheckCircle2,
  Filter,
  Search
} from "lucide-react";

interface Task {
  id: number;
  title: string;
  completed: boolean;
  due_at?: string;
  created_at: string;
}

const TaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "Revisar relatório mensal", completed: false, due_at: "2024-01-15T09:00:00", created_at: "2024-01-10T08:00:00" },
    { id: 2, title: "Agendar consulta médica", completed: false, due_at: "2024-01-14T14:00:00", created_at: "2024-01-10T10:00:00" },
    { id: 3, title: "Comprar presente de aniversário", completed: true, created_at: "2024-01-09T15:00:00" },
    { id: 4, title: "Estudar React", completed: false, created_at: "2024-01-08T20:00:00" },
    { id: 5, title: "Pagar conta de luz", completed: true, due_at: "2024-01-12T23:59:00", created_at: "2024-01-07T12:00:00" }
  ]);

  const [newTask, setNewTask] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const addTask = () => {
    if (!newTask.trim()) return;

    const task: Task = {
      id: Date.now(),
      title: newTask.trim(),
      completed: false,
      due_at: selectedDate?.toISOString(),
      created_at: new Date().toISOString()
    };

    setTasks([task, ...tasks]);
    setNewTask("");
    setSelectedDate(undefined);
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const filteredTasks = tasks
    .filter(task => {
      if (filter === "pending") return !task.completed;
      if (filter === "completed") return task.completed;
      return true;
    })
    .filter(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && !tasks.find(t => t.due_at === dueDate)?.completed;
  };

  const TaskItem = ({ task }: { task: Task }) => (
    <div 
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border bg-card transition-all",
        task.completed && "opacity-60",
        isOverdue(task.due_at) && "border-destructive/20 bg-destructive/5"
      )}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => toggleTask(task.id)}
        className="data-[state=checked]:bg-success data-[state=checked]:border-success"
      />
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium",
          task.completed && "line-through text-muted-foreground"
        )}>
          {task.title}
        </p>
        
        {task.due_at && (
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className={cn(
              "text-xs",
              isOverdue(task.due_at) && "text-destructive font-medium"
            )}>
              {format(new Date(task.due_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
            {isOverdue(task.due_at) && (
              <Badge variant="destructive" className="text-xs">
                Atrasada
              </Badge>
            )}
          </div>
        )}
      </div>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => deleteTask(task.id)}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas..."
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
            Todas ({tasks.length})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
          >
            Pendentes ({tasks.filter(t => !t.completed).length})
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("completed")}
          >
            Concluídas ({tasks.filter(t => t.completed).length})
          </Button>
        </div>
      </div>

      {/* Add Task Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nova Tarefa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Digite sua nova tarefa..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && addTask()}
            />
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Prazo"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button onClick={addTask} disabled={!newTask.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Minhas Tarefas
            </span>
            <Badge variant="secondary">
              {filteredTasks.length} {filteredTasks.length === 1 ? "tarefa" : "tarefas"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Organize e acompanhe suas atividades diárias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {filter === "all" && "Nenhuma tarefa encontrada"}
                {filter === "pending" && "Nenhuma tarefa pendente"}
                {filter === "completed" && "Nenhuma tarefa concluída"}
              </p>
              <p className="text-sm">
                {searchTerm ? "Tente ajustar sua busca" : "Adicione uma nova tarefa para começar"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskManager;