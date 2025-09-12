import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Bell,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter
} from "lucide-react";

interface Event {
  id: number;
  title: string;
  start_at: string;
  end_at?: string;
  location?: string;
  reminder_min: number;
  created_at: string;
}

const EventManager = () => {
  const [events, setEvents] = useState<Event[]>([
    {
      id: 1,
      title: "Reunião de equipe",
      start_at: "2024-01-15T09:00:00",
      end_at: "2024-01-15T10:30:00",
      location: "Sala de conferências",
      reminder_min: 15,
      created_at: "2024-01-10T08:00:00"
    },
    {
      id: 2,
      title: "Consulta médica",
      start_at: "2024-01-16T14:00:00",
      end_at: "2024-01-16T15:00:00",
      location: "Clínica São José",
      reminder_min: 30,
      created_at: "2024-01-11T10:00:00"
    },
    {
      id: 3,
      title: "Aniversário João",
      start_at: "2024-01-20T18:00:00",
      location: "Restaurante Central",
      reminder_min: 60,
      created_at: "2024-01-05T15:00:00"
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<"all" | "today" | "week" | "upcoming">("all");

  const [formData, setFormData] = useState({
    title: "",
    start_date: undefined as Date | undefined,
    start_time: "09:00",
    end_time: "10:00",
    location: "",
    reminder_min: 15
  });

  const resetForm = () => {
    setFormData({
      title: "",
      start_date: undefined,
      start_time: "09:00",
      end_time: "10:00",
      location: "",
      reminder_min: 15
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.start_date) return;

    const startDateTime = new Date(formData.start_date);
    const [startHour, startMin] = formData.start_time.split(":").map(Number);
    startDateTime.setHours(startHour, startMin);

    const endDateTime = new Date(formData.start_date);
    const [endHour, endMin] = formData.end_time.split(":").map(Number);
    endDateTime.setHours(endHour, endMin);

    const eventData: Omit<Event, "id" | "created_at"> = {
      title: formData.title.trim(),
      start_at: startDateTime.toISOString(),
      end_at: endDateTime.toISOString(),
      location: formData.location.trim() || undefined,
      reminder_min: formData.reminder_min
    };

    if (editingEvent) {
      setEvents(events.map(event =>
        event.id === editingEvent.id
          ? { ...eventData, id: editingEvent.id, created_at: editingEvent.created_at }
          : event
      ));
    } else {
      const newEvent: Event = {
        ...eventData,
        id: Date.now(),
        created_at: new Date().toISOString()
      };
      setEvents([newEvent, ...events]);
    }

    resetForm();
  };

  const deleteEvent = (id: number) => {
    setEvents(events.filter(event => event.id !== id));
  };

  const editEvent = (event: Event) => {
    const startDate = new Date(event.start_at);
    setFormData({
      title: event.title,
      start_date: startDate,
      start_time: format(startDate, "HH:mm"),
      end_time: event.end_at ? format(new Date(event.end_at), "HH:mm") : "10:00",
      location: event.location || "",
      reminder_min: event.reminder_min
    });
    setEditingEvent(event);
    setShowForm(true);
  };

  const filteredEvents = events
    .filter(event => {
      const eventDate = new Date(event.start_at);
      switch (filterPeriod) {
        case "today":
          return isToday(eventDate);
        case "week":
          return isThisWeek(eventDate, { locale: ptBR });
        case "upcoming":
          return eventDate >= new Date();
        default:
          return true;
      }
    })
    .filter(event =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  const getEventBadge = (startDate: Date) => {
    if (isToday(startDate)) return { text: "Hoje", variant: "default" as const };
    if (isTomorrow(startDate)) return { text: "Amanhã", variant: "secondary" as const };
    if (isThisWeek(startDate, { locale: ptBR })) return { text: "Esta semana", variant: "outline" as const };
    return null;
  };

  const EventCard = ({ event }: { event: Event }) => {
    const startDate = new Date(event.start_at);
    const endDate = event.end_at ? new Date(event.end_at) : null;
    const badge = getEventBadge(startDate);

    return (
      <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
        <div className="flex-shrink-0 w-12 text-center">
          <div className="text-lg font-bold text-primary">
            {format(startDate, "dd", { locale: ptBR })}
          </div>
          <div className="text-xs text-muted-foreground uppercase">
            {format(startDate, "MMM", { locale: ptBR })}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-card-foreground">
              {event.title}
            </h3>
            {badge && (
              <Badge variant={badge.variant} className="flex-shrink-0">
                {badge.text}
              </Badge>
            )}
          </div>

          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                {format(startDate, "HH:mm", { locale: ptBR })}
                {endDate && ` - ${format(endDate, "HH:mm", { locale: ptBR })}`}
              </span>
            </div>

            {event.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{event.location}</span>
              </div>
            )}

            {event.reminder_min > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bell className="w-3 h-3" />
                <span>Lembrete {event.reminder_min} min antes</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editEvent(event)}
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteEvent(event.id)}
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
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={filterPeriod} onValueChange={(value: any) => setFilterPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="upcoming">Próximos</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Event Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingEvent ? "Editar Evento" : "Novo Evento"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nome do evento..."
                    required
                  />
                </div>

                <div>
                  <Label>Data *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {formData.start_date 
                          ? format(formData.start_date, "dd/MM/yyyy", { locale: ptBR })
                          : "Selecionar data"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={(date) => setFormData({ ...formData, start_date: date })}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Local do evento..."
                  />
                </div>

                <div>
                  <Label htmlFor="start-time">Horário início</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="end-time">Horário fim</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Lembrete</Label>
                  <Select
                    value={formData.reminder_min.toString()}
                    onValueChange={(value) => setFormData({ ...formData, reminder_min: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem lembrete</SelectItem>
                      <SelectItem value="5">5 minutos antes</SelectItem>
                      <SelectItem value="15">15 minutos antes</SelectItem>
                      <SelectItem value="30">30 minutos antes</SelectItem>
                      <SelectItem value="60">1 hora antes</SelectItem>
                      <SelectItem value="1440">1 dia antes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit">
                  {editingEvent ? "Salvar" : "Criar Evento"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Meus Eventos
            </span>
            <Badge variant="secondary">
              {filteredEvents.length} {filteredEvents.length === 1 ? "evento" : "eventos"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Gerencie sua agenda e compromissos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum evento encontrado</p>
              <p className="text-sm">
                {searchTerm ? "Tente ajustar sua busca" : "Adicione um novo evento para começar"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EventManager;