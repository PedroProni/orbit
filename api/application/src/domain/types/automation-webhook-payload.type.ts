export interface AutomationWebhookPayload {
  delivery: string;
  automationId: string;
  trigger: string;
  at: string;
  task: { id: string; title: string; status: string; priority: string | null; listId: string; spaceId: string };
}
