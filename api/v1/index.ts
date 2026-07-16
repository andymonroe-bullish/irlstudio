// Unauthenticated discovery endpoint: describes the API so an agent can learn
// to use it from a single GET. No data is exposed here.
export default function handler(_req: any, res: any) {
  res.status(200).json({
    name: "IRL Event Studio API",
    version: "v1",
    base_url: "https://irlstudio.vercel.app/api/v1",
    authentication:
      "All endpoints except this one require an API key sent as 'Authorization: Bearer <key>'. Keys are scoped to a user; you can only see events that user owns or collaborates on.",
    conventions: {
      dates: "ISO 8601 (event_date/event_end_date are timestamps; due_date is YYYY-MM-DD)",
      event_status: "draft is the default; the app treats status as free text",
      task_status: ["not_started", "in_progress", "completed"],
      task_phase_id: ["design", "build", "execute", "afterglow"],
      task_priority: ["low", "medium", "high"],
      errors: "Non-2xx responses return { error: string }",
    },
    endpoints: [
      { method: "GET", path: "/events", description: "List accessible events. Optional ?status= filter." },
      { method: "POST", path: "/events", description: "Create an event. Requires name. Optional: description, event_date, event_end_date, venue, venue_address, expected_guests, actual_guests, status, type, total_budget, notes." },
      { method: "GET", path: "/events/:id", description: "Get one event. Optional ?include=tasks,budget,notes,itinerary,run_of_show,revenue (comma-separated) to embed related records." },
      { method: "PATCH", path: "/events/:id", description: "Update event fields (same fields as create)." },
      { method: "DELETE", path: "/events/:id", description: "Delete an event and its related records." },
      { method: "GET", path: "/events/:id/tasks", description: "List tasks. Optional ?status= and ?phase_id= filters." },
      { method: "POST", path: "/events/:id/tasks", description: "Create a task. Requires title. Optional: description, status, priority, due_date, category, phase_id, assignee." },
      { method: "GET", path: "/tasks/:id", description: "Get a task." },
      { method: "PATCH", path: "/tasks/:id", description: "Update a task (e.g. { \"status\": \"completed\" })." },
      { method: "DELETE", path: "/tasks/:id", description: "Delete a task." },
      { method: "GET", path: "/events/:id/budget", description: "List budget line items." },
      { method: "POST", path: "/events/:id/budget", description: "Create a budget item. Requires name. Optional: category, description, estimated_cost, actual_cost, status, due_date, paid, notes." },
      { method: "GET", path: "/budget-items/:id", description: "Get a budget item." },
      { method: "PATCH", path: "/budget-items/:id", description: "Update a budget item." },
      { method: "DELETE", path: "/budget-items/:id", description: "Delete a budget item." },
      { method: "GET", path: "/events/:id/notes", description: "List notes." },
      { method: "POST", path: "/events/:id/notes", description: "Create a note. Requires title or content." },
      { method: "GET", path: "/notes/:id", description: "Get a note." },
      { method: "PATCH", path: "/notes/:id", description: "Update a note." },
      { method: "DELETE", path: "/notes/:id", description: "Delete a note." },
    ],
  });
}
