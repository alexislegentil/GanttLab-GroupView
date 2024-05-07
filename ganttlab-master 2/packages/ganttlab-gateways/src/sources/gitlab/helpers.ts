import { issueDescriptionToTaskDetails } from '../abstracts/helpers';
import { Task, Milestone, Group, Project } from 'ganttlab-entities';
import { GitLabIssue } from './types/GitLabIssue';
import { AxiosHeaders } from '../abstracts/AxiosHeaders';
import { GitLabMilestone } from './types/GitLabMilestone';
import { GitLabGroup } from './types/GitLabGroup';
import { GitLabProject } from './types/GitLabProject';

export function getTaskFromGitLabIssue(gitlabIssue: GitLabIssue): Task {
  const { startDate, dueDate } = issueDescriptionToTaskDetails(
    gitlabIssue.description,
  );
  return new Task(
    gitlabIssue.iid,
    gitlabIssue.project_id,
    gitlabIssue.title,
    gitlabIssue.web_url,
    startDate
      ? startDate
      : gitlabIssue.milestone && gitlabIssue.milestone.start_date
      ? new Date(gitlabIssue.milestone.start_date)
      : new Date(gitlabIssue.created_at),
    dueDate
      ? dueDate
      : gitlabIssue.due_date
      ? new Date(gitlabIssue.due_date)
      : gitlabIssue.milestone && gitlabIssue.milestone.due_date
      ? new Date(gitlabIssue.milestone.due_date)
      : undefined,
  );
}

export function getPaginationFromGitLabHeaders(
  headers: AxiosHeaders,
): {
  previousPage: number | undefined;
  nextPage: number | undefined;
  lastPage: number | undefined;
  total: number | undefined;
} {
  return {
    previousPage: headers['x-prev-page']
      ? parseInt(headers['x-prev-page'])
      : undefined,
    nextPage: headers['x-next-page']
      ? parseInt(headers['x-next-page'])
      : undefined,
    lastPage: headers['x-total-pages']
      ? parseInt(headers['x-total-pages'])
      : undefined,
    total: headers['x-total'] ? parseInt(headers['x-total']) : undefined,
  };
}

export function getMilestoneFromGitLabMilestone(
  gitlabMilestone: GitLabMilestone,
): Milestone {
  return new Milestone(
    gitlabMilestone.title,
    undefined,
    gitlabMilestone.description,
    gitlabMilestone.start_date
      ? new Date(gitlabMilestone.start_date)
      : undefined,
    gitlabMilestone.due_date ? new Date(gitlabMilestone.due_date) : undefined,
  );
}

export function getGroupFromGitLabGroup(
  GitLabGroup: GitLabGroup,
): Group {
  return new Group(
    GitLabGroup.name,
    GitLabGroup.path,
    [],
    [],
    GitLabGroup.avatar_url,
    GitLabGroup.web_url,
    GitLabGroup.description,
  );
}

export function getProjectFromGitLabProject(
  GitLabProject: GitLabProject,
): Project {
  return new Project(
    GitLabProject.name,
    GitLabProject.path_with_namespace,
    GitLabProject.web_url,
    GitLabProject.description,
    GitLabProject.avatar_url,
  );
}
