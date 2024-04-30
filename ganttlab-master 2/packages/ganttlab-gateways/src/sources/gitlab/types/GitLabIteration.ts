export interface GitLabIteration{
    title: string;
    description?: string;
    state: number;
    start_date?: string;
    due_date?: string;
    created_at: string;
    iid?: number;
  }
  