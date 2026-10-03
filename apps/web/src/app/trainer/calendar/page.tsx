import { PageHeader } from "@/components/dashboard/page-header";
import { CalendarView } from "@/components/trainer/calendar/calendar-view";

export default function TrainerCalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Calendar" description="Your classes, assessments and assignment deadlines in one schedule (IST)." />
      <CalendarView />
    </div>
  );
}
