export type TaskStatus = "not_started" | "in_progress" | "completed";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assigneeIds?: string[];
  dueDate?: string;
}

export interface Phase {
  id: string;
  name: string;
  color: string;
  tasks: Task[];
}

export interface BudgetCategory {
  id: string;
  name: string;
  color: string;
}

export interface BudgetItem {
  id: string;
  name: string;
  category: string;
  estimatedCost: number;
  actualCost: number;
  dueDate: string;
  status: "planned" | "paid";
}

export const BUDGET_CATEGORIES: BudgetCategory[] = [
  { id: "catering", name: "CATERING", color: "bg-green-100 text-green-700" },
  { id: "product", name: "PRODUCT", color: "bg-blue-100 text-blue-700" },
  { id: "marketing", name: "MARKETING", color: "bg-pink-100 text-pink-700" },
  { id: "legal", name: "LEGAL", color: "bg-purple-100 text-purple-700" },
  { id: "other", name: "OTHER", color: "bg-gray-100 text-gray-700" },
  { id: "operations", name: "OPERATIONS", color: "bg-red-100 text-red-700" },
  { id: "venue", name: "VENUE", color: "bg-yellow-100 text-yellow-700" },
  { id: "media", name: "MEDIA", color: "bg-cyan-100 text-cyan-700" },
  { id: "travel", name: "TRAVEL", color: "bg-orange-100 text-orange-700" },
];

export const getInitialPhases = (): Phase[] => [
  {
    id: "design",
    name: "Phase 1 - Design",
    color: "bg-phase-design",
    tasks: [
      { id: "d1", title: "Event Dates", status: "not_started" },
      { id: "d2", title: "Event Location", status: "not_started" },
      { id: "d3", title: "Create budget", status: "not_started" },
      { id: "d4", title: "Create Event Revenue Model", status: "not_started" },
      { id: "d5", title: "Create sponsor strategy", status: "not_started" },
      { id: "d6", title: "Determine Event ICP", status: "not_started" },
      { id: "d7", title: "Determine Event Objective (For Client)", status: "not_started" },
      { id: "d8", title: "Determine Event Objective (For Attendee)", status: "not_started" },
      { id: "d9", title: "Create event story/transformation", status: "not_started" },
      { id: "d10", title: "Pick event name", status: "not_started" },
      { id: "d11", title: "Build event timeline", status: "not_started" },
      { id: "d12", title: "Create marketing timeline", status: "not_started" },
      { id: "d13", title: "Make the event offer", status: "not_started" },
      { id: "d14", title: "Build itinerary V1", status: "not_started" },
      { id: "d15", title: "Announce Event", status: "not_started" },
    ],
  },
  {
    id: "build",
    name: "Phase 2 - Build",
    color: "bg-phase-build",
    tasks: [
      { id: "b1", title: "Design pre-event content strategy", status: "not_started" },
      { id: "b2", title: "Determine Contractor Liaison", status: "not_started" },
      { id: "b3", title: "Determine Attendee Liaison", status: "not_started" },
      { id: "b4", title: "Determine Sponsor Liaison", status: "not_started" },
      { id: "b5", title: "Determine Venue Liaison", status: "not_started" },
      { id: "b6", title: "Determine Speaker Liaison", status: "not_started" },
      { id: "b7", title: "Venue", status: "not_started" },
      { id: "b8", title: "Food & Beverage", status: "not_started" },
      { id: "b9", title: "Build staff list", status: "not_started" },
      { id: "b10", title: "Registration Process", status: "not_started" },
      { id: "b11", title: "Insurance", status: "not_started" },
      { id: "b12", title: "Travel/Lodging", status: "not_started" },
      { id: "b13", title: "Speakers", status: "not_started" },
      { id: "b14", title: "Sponsors", status: "not_started" },
      { id: "b15", title: "Branding", status: "not_started" },
      { id: "b16", title: "Print Material", status: "not_started" },
      { id: "b17", title: "Merchandise", status: "not_started" },
      { id: "b18", title: "Attendee Gifts", status: "not_started" },
      { id: "b19", title: "Itinerary", status: "not_started" },
      { id: "b20", title: "Create content objectives", status: "not_started" },
      { id: "b21", title: "Attendee communication plan", status: "not_started" },
      { id: "b22", title: "Photographer/Videographer", status: "not_started" },
      { id: "b23", title: "Community communication plan", status: "not_started" },
      { id: "b24", title: "Audio/Visual", status: "not_started" },
    ],
  },
  {
    id: "execute",
    name: "Phase 3 - Execute",
    color: "bg-phase-execute",
    tasks: [
      { id: "e1", title: "Finalize event itinerary", status: "not_started" },
      { id: "e2", title: "Build event survey", status: "not_started" },
      { id: "e3", title: "Confirm all Phase 2 tasks are complete", status: "not_started" },
      { id: "e4", title: "Travel Checklist", status: "not_started" },
      { id: "e5", title: "All-hands meeting", status: "not_started" },
      { id: "e6", title: "Confirmations", status: "not_started" },
      { id: "e7", title: "Finalize Outstanding Orders", status: "not_started" },
      { id: "e8", title: "Onsite meeting", status: "not_started" },
      { id: "e9", title: "Venue walkthrough", status: "not_started" },
      { id: "e10", title: "Collect speaker assets", status: "not_started" },
      { id: "e11", title: "Send all assets to A/V team", status: "not_started" },
    ],
  },
  {
    id: "afterglow",
    name: "Phase 4 - Afterglow",
    color: "bg-phase-afterglow",
    tasks: [
      { id: "a1", title: "Create financial report", status: "not_started" },
      { id: "a2", title: "Create survey report", status: "not_started" },
      { id: "a3", title: "Debrief meeting", status: "not_started" },
      { id: "a4", title: "Interview Sponsors", status: "not_started" },
      { id: "a5", title: 'Send "thank you" email to attendees', status: "not_started" },
      { id: "a6", title: "Finalize outstanding payments", status: "not_started" },
    ],
  },
];

export const getInitialBudgetItems = (totalBudget: number): BudgetItem[] => {
  const distribution = [
    { name: "Food & Beverage", category: "catering", percentage: 0.18 },
    { name: "Merchandise", category: "product", percentage: 0.045 },
    { name: "Branding", category: "marketing", percentage: 0.045 },
    { name: "Insurance", category: "legal", percentage: 0.009 },
    { name: "Miscellaneous", category: "other", percentage: 0.036 },
    { name: "Print Material", category: "marketing", percentage: 0.018 },
    { name: "Registration", category: "operations", percentage: 0.009 },
    { name: "Venue", category: "venue", percentage: 0.225 },
    { name: "Videographer / Photographer", category: "media", percentage: 0.108 },
    { name: "Event Services", category: "operations", percentage: 0.135 },
    { name: "Staff Lodging", category: "travel", percentage: 0.045 },
    { name: "Staff Flights", category: "travel", percentage: 0.045 },
  ];

  const today = new Date();
  const dueDate = new Date(today.setMonth(today.getMonth() + 2)).toISOString().split('T')[0];

  return distribution.map((item, index) => ({
    id: `budget-${index + 1}`,
    name: item.name,
    category: item.category,
    estimatedCost: Math.round(totalBudget * item.percentage),
    actualCost: 0,
    dueDate: dueDate,
    status: "planned",
  }));
};
