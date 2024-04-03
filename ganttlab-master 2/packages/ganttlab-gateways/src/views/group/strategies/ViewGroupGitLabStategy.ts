import {
    ViewSourceStrategy,
    Configuration,
    PaginatedListOfTasks,
    Task,
    Group,
    Filter,
  } from 'ganttlab-entities';
  import { GitLabGateway } from '../../../sources/gitlab/GitLabGateway';
  import { GitLabGroup } from '../../../sources/gitlab/types/GitLabGroup';
  import { GitLabIssue } from '../../../sources/gitlab/types/GitLabIssue';
  import {
    getTaskFromGitLabIssue,
    getPaginationFromGitLabHeaders,
    getGroupFromGitLabGroup,
  } from '../../../sources/gitlab/helpers';

  import { IssuesStateFilter } from '../../../filters/IssuesStateFilter';
  
  export class ViewGroupGitLabStrategy
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
      const encodedGroup = encodeURIComponent(
        configuration.group.path as string,
      );
      const groupsResponse = await source.safeAxiosRequest<
        Array<GitLabGroup>
      >({
        method: 'GET',
        url: `/groups/`,
        params: {
          page: configuration.groups.page,
          // eslint-disable-next-line @typescript-eslint/camelcase
          per_page: configuration.groups.pageSize,
       //   state: 'active',
        },
      });
      const groupsList: Array<Group> = [];
      let tasksForActiveGroup: PaginatedListOfTasks | null = null;
      for (
        let groupIndex = 0;
        groupIndex < groupsResponse.data.length;
        groupIndex++
      ) {
        const gitlabGroup = groupsResponse.data[groupIndex];
        const group = getGroupFromGitLabGroup(gitlabGroup);
  
        // loading tasks for the active group
        if (groupIndex === configuration.activeGroup) {
          const { data, headers } = await source.safeAxiosRequest<
            Array<GitLabIssue>
          >({
            method: 'GET',
            url: `/groups/${encodedGroup}/issues`,
            params: {
              page: configuration.tasks.page,
              // eslint-disable-next-line @typescript-eslint/camelcase
              per_page: configuration.tasks.pageSize,
              state: stateFilter? stateFilter : 'opened',
              group: group.name,
            },
          });
          const tasksList: Array<Task> = [];
          for (const gitlabIssue of data) {
            const task = getTaskFromGitLabIssue(gitlabIssue);
            tasksList.push(task);
          }
          tasksList.sort((a: Task, b: Task) => {
            if (a.due && b.due) {
              return a.due.getTime() - b.due.getTime();
            }
            return 0;
          });
          const pagination = getPaginationFromGitLabHeaders(headers);
          tasksForActiveGroup = new PaginatedListOfTasks(
            tasksList,
            configuration.tasks.page as number,
            configuration.tasks.pageSize as number,
            pagination.previousPage,
            pagination.nextPage,
            pagination.lastPage,
            pagination.total,
          );
        }
  
        groupsList.push(group);
      }
  
      const gitlabPagination = getPaginationFromGitLabHeaders(
        groupsResponse.headers,
      );

      return tasksForActiveGroup as PaginatedListOfTasks;
    }
  }
  