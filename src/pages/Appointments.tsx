import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { Plus, CalendarIcon, Check, ChevronsUpDown, Clock, List, CalendarDays } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
];

const Appointments = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [patientOpen, setPatientOpen] = useState(false);
  const [doctorOpen, setDoctorOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  
  const [formData, setFormData] = useState({
    patient_id: "",
    doctor_id: "",
    date: undefined as Date | undefined,
    time: "",
    reason_for_visit: "",
  });

  // Fetch appointments
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patients (first_name, last_name),
          doctor:profiles!appointments_doctor_id_fkey (first_name, last_name)
        `)
        .order("appointment_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch patients for dropdown
  const { data: patients } = useQuery({
    queryKey: ["patients-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name, medical_record_number")
        .order("first_name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch doctors for dropdown (staff where role = 'doctor')
  const { data: doctors } = useQuery({
    queryKey: ["doctors-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("id, first_name, last_name, user_id")
        .eq("role", "doctor")
        .not("user_id", "is", null)
        .order("first_name");
      if (error) throw error;
      return data || [];
    },
  });

  // Book appointment mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: typeof formData) => {
      if (!profile?.organization_id) {
        throw new Error("No organization found");
      }
      
      // Combine date and time
      const appointmentDate = new Date(appointmentData.date!);
      const [hours, minutes] = appointmentData.time.split(":");
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Get the profile id (user_id) for the selected doctor
      const selectedDoctor = doctors?.find(d => d.id === appointmentData.doctor_id);
      const doctorProfileId = selectedDoctor?.user_id || null;
      
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          patient_id: appointmentData.patient_id,
          doctor_id: doctorProfileId,
          appointment_date: appointmentDate.toISOString(),
          reason_for_visit: appointmentData.reason_for_visit,
          status: "scheduled",
          organization_id: profile.organization_id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-today-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-upcoming-appointments"] });
      toast.success("Appointment booked successfully");
      setIsDialogOpen(false);
      setFormData({
        patient_id: "",
        doctor_id: "",
        date: undefined,
        time: "",
        reason_for_visit: "",
      });
    },
    onError: (error) => {
      toast.error("Failed to book appointment: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.date || !formData.time) {
      toast.error("Please fill in all required fields");
      return;
    }
    bookAppointmentMutation.mutate(formData);
  };

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case "scheduled":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive";
      case "in-progress":
        return "outline";
      default:
        return "secondary";
    }
  };

  const selectedPatient = patients?.find((p) => p.id === formData.patient_id);
  const selectedDoctor = doctors?.find((d) => d.id === formData.doctor_id);

  // Calendar view data
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAppointmentsForDay = (date: Date) => {
    return appointments?.filter((apt) =>
      isSameDay(new Date(apt.appointment_date), date)
    ) || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground mt-1">
            Manage patient appointments and scheduling
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Book New Appointment
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Patient Selection */}
              <div className="space-y-2">
                <Label>Patient *</Label>
                <Popover open={patientOpen} onOpenChange={setPatientOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={patientOpen}
                      className="w-full justify-between"
                    >
                      {selectedPatient
                        ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                        : "Select patient..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search patients..." />
                      <CommandList>
                        <CommandEmpty>No patient found.</CommandEmpty>
                        <CommandGroup>
                          {patients?.map((patient) => (
                            <CommandItem
                              key={patient.id}
                              value={`${patient.first_name} ${patient.last_name}`}
                              onSelect={() => {
                                setFormData({ ...formData, patient_id: patient.id });
                                setPatientOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.patient_id === patient.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {patient.first_name} {patient.last_name}
                              <span className="ml-2 text-muted-foreground text-xs">
                                {patient.medical_record_number}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Doctor Selection */}
              <div className="space-y-2">
                <Label>Doctor</Label>
                <Popover open={doctorOpen} onOpenChange={setDoctorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={doctorOpen}
                      className="w-full justify-between"
                    >
                      {selectedDoctor
                        ? `Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name}`
                        : "Select doctor..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search doctors..." />
                      <CommandList>
                        <CommandEmpty>No doctor found.</CommandEmpty>
                        <CommandGroup>
                          {doctors?.map((doctor) => (
                            <CommandItem
                              key={doctor.id}
                              value={`${doctor.first_name} ${doctor.last_name}`}
                              onSelect={() => {
                                setFormData({ ...formData, doctor_id: doctor.id });
                                setDoctorOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.doctor_id === doctor.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              Dr. {doctor.first_name} {doctor.last_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => setFormData({ ...formData, date })}
                        disabled={(date) => startOfDay(date) < startOfDay(new Date())}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Select
                    value={formData.time}
                    onValueChange={(value) => setFormData({ ...formData, time: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time">
                        {formData.time ? (
                          <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {formData.time}
                          </span>
                        ) : (
                          "Select time"
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reason for Visit */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Visit</Label>
                <Textarea
                  id="reason"
                  value={formData.reason_for_visit}
                  onChange={(e) =>
                    setFormData({ ...formData, reason_for_visit: e.target.value })
                  }
                  placeholder="Describe the reason for the appointment..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={bookAppointmentMutation.isPending}>
                  {bookAppointmentMutation.isPending ? "Booking..." : "Book Appointment"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs for List/Calendar View */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : appointments && appointments.length > 0 ? (
                  appointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-medium">
                        {format(new Date(apt.appointment_date), "MMM d, yyyy")}
                        <span className="block text-xs text-muted-foreground">
                          {format(new Date(apt.appointment_date), "h:mm a")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {apt.patients?.first_name} {apt.patients?.last_name}
                      </TableCell>
                      <TableCell>
                        {apt.doctor
                          ? `Dr. ${apt.doctor.first_name} ${apt.doctor.last_name}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {apt.reason_for_visit || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(apt.status)}>
                          {apt.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">No appointments found</p>
                      <Button
                        variant="link"
                        onClick={() => setIsDialogOpen(true)}
                        className="mt-2"
                      >
                        Book your first appointment
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {format(calendarMonth, "MMMM yyyy")}
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1)
                    )
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1)
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24" />
              ))}
              {daysInMonth.map((day) => {
                const dayAppointments = getAppointmentsForDay(day);
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "h-24 border rounded p-1 overflow-hidden",
                      isToday && "bg-accent/50 border-primary"
                    )}
                  >
                    <div className="text-xs font-medium mb-1">
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {dayAppointments.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          className="text-xs bg-primary/10 text-primary rounded px-1 truncate"
                        >
                          {format(new Date(apt.appointment_date), "h:mm a")} -{" "}
                          {apt.patients?.first_name}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayAppointments.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Appointments;