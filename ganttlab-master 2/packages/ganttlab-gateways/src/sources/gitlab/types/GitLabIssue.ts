import { GitLabMilestone } from './GitLabMilestone';

export interface GitLabIssue {
  iid: number;
  project_id: number;
  title: string;
  web_url: string;
  created_at: string;
  description: string;
  due_date: string;
  milestone: GitLabMilestone | null;
  state: string;
  assignees: Array<any> | null;
  labels?: Array<string>;
}
