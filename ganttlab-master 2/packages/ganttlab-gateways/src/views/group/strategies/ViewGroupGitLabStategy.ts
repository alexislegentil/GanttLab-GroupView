import {
        ViewSourceStrategy,
        Configuration,
        PaginatedListOfTasks,
        Task,
        Filter,
        Project,
    } from 'ganttlab-entities';
    import { GitLabGateway } from '../../../sources/gitlab/GitLabGateway';
    import { GitLabIssue } from '../../../sources/gitlab/types/GitLabIssue';
    import {
        getTaskFromGitLabIssue,
        getPaginationFromGitLabHeaders,
    } from '../../../sources/gitlab/helpers';

    import { IssuesStateFilter } from '../../../filters/IssuesStateFilter';
import { GitLabProject } from '../../../sources/gitlab/types/GitLabProject';
    
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
            console.log('configuration', configuration);
            const encodedGroup = encodeURIComponent(
                configuration.group.path as string,
            );
            const projectsResponse = await source.safeAxiosRequest<Array<GitLabProject>>({
                method: 'GET',
                url: `/groups/${encodedGroup}/projects`,
                params: {
                    page: configuration.group.page,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    per_page: configuration.group.pageSize,
             // state: stateFilter? stateFilter : 'opened',
                 //   archived: false,
                },
            });
            const pagination = getPaginationFromGitLabHeaders(projectsResponse.headers);
            let tasksForActiveGroup: PaginatedListOfTasks | null = null;
            const tasksList: Array<Task> = [];
            for (
                let projectIndex = 0;
                projectIndex < projectsResponse.data.length;
                projectIndex++
            ) {
                console.log('project', projectsResponse.data[projectIndex]);
                const gitlabProject = projectsResponse.data[projectIndex];
                const encodedProject = encodeURIComponent(
                    gitlabProject.path_with_namespace as string,
                );
    
                    const { data, headers } = await source.safeAxiosRequest<Array<GitLabIssue>>({
                        method: 'GET',
                        url: `/projects/${encodedProject}/issues`,
                        params: {
                            page: configuration.tasks.page,
                            // eslint-disable-next-line @typescript-eslint/camelcase
                            per_page: configuration.tasks.pageSize,
                            state: stateFilter? stateFilter : 'opened',
                          //  group: gitlabProject.name,
                        },
                    });
                   
                    for (const gitlabIssue of data) {
                        const task = getTaskFromGitLabIssue(gitlabIssue);
                        tasksList.push(task);
                    }
                    
                }
            tasksList.sort((a: Task, b: Task) => {
                if (a.due && b.due) {
                    return a.due.getTime() - b.due.getTime();
                }
                return 0;
            });

           
            tasksForActiveGroup = new PaginatedListOfTasks(
                tasksList,
                configuration.tasks.page as number,
                configuration.tasks.pageSize as number,
                pagination.previousPage,
                pagination.nextPage,
                pagination.lastPage,
                pagination.total,
            );
    
            return tasksForActiveGroup as PaginatedListOfTasks;
        }
    }
  