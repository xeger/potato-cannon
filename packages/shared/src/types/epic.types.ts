export type EpicStatus = 'not_started' | 'in_progress' | 'complete';

export interface Epic {
  id: string;
  projectId: string;
  epicNumber: number;
  identifier: string;
  title: string;
  description: string | null;
  status: EpicStatus;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EpicWithCounts extends Epic {
  ticketCount: number;
  doneCount: number;
  phaseBreakdown: Record<string, number>;
}

export interface EpicWithTickets extends EpicWithCounts {
  tickets: EpicChildTicket[];
}

export interface EpicChildTicket {
  id: string;
  title: string;
  phase: string;
}
