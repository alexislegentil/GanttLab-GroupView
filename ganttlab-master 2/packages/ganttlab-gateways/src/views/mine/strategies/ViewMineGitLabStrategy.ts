import { GitLabGateway } from '../../../sources/gitlab/GitLabGateway';
import {
  ViewSourceStrategy,
  Configuration,
  PaginatedListOfTasks,
  Task,
  Filter,
} from 'ganttlab-entities';
import { GitLabIssue } from '../../../sources/gitlab/types/GitLabIssue';
import {
  getTaskFromGitLabIssue,
  getPaginationFromGitLabHeaders,
} from '../../../sources/gitlab/helpers';
import { IssuesStateFilter } from '../../../filters/IssuesStateFilter';

export class ViewMineGitLabStrategy
  implements ViewSourceStrategy<PaginatedListOfTasks> {
  async execute(
    source: GitLabGateway,
    configuration: Configuration,
    filter: Filter | null,
  ): Promise<PaginatedListOfTasks> {
    let stateFilter = null;
    if (filter instanceof IssuesStateFilter)  {
      stateFilter = filter.requestGitLabArgs();
    }
    const { data, headers } = await source.safeAxiosRequest<Array<GitLabIssue>>(
      {
        method: 'GET',
        url: '/issues',
        params: {
          page: configuration.tasks.page,
          // eslint-disable-next-line @typescript-eslint/camelcase
          per_page: configuration.tasks.pageSize,
          state: stateFilter? stateFilter : 'opened',
        },
      },
    );
    const tasksList: Array<Task> = [];
    for (const gitlabIssue of data) {
      console.log(gitlabIssue);
      const task = getTaskFromGitLabIssue(gitlabIssue);
      tasksList.push(task);
    }
    tasksList.sort((a: Task, b: Task) => {
      if (a.due && b.due) {
        return a.due.getTime() - b.due.getTime();
      }
      return 0;
    });
    const gitlabPagination = getPaginationFromGitLabHeaders(headers);
    return new PaginatedListOfTasks(
      tasksList,
      configuration.tasks.page as number,
      configuration.tasks.pageSize as number,
      gitlabPagination.previousPage,
      gitlabPagination.nextPage,
      gitlabPagination.lastPage,
      gitlabPagination.total,
    );
  }
}
