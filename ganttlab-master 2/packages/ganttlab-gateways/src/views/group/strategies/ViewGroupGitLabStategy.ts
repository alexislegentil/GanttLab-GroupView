import {
        ViewSourceStrategy,
        Configuration,
        PaginatedListOfTasks,
        Task,
        Filter,
        Project,
        Group,
        PaginatedList,
        PaginatedListOfProjects,
    } from 'ganttlab-entities';
    import { GitLabGateway } from '../../../sources/gitlab/GitLabGateway';
    import { GitLabIssue } from '../../../sources/gitlab/types/GitLabIssue';
    import {
        getTaskFromGitLabIssue,
        getPaginationFromGitLabHeaders,
    } from '../../../sources/gitlab/helpers';

    import { IssuesStateFilter } from '../../../filters/IssuesStateFilter';
import { GitLabProject } from '../../../sources/gitlab/types/GitLabProject';
import { Epic } from 'ganttlab-entities/dist/core/Epic';
    
    export class ViewGroupGitLabStrategy
        implements ViewSourceStrategy<Group> {
        async execute(
            source: GitLabGateway,
            configuration: Configuration,
            filter: Filter | null,
        ): Promise<Group> {
            let stateFilter = null;
            if (filter instanceof IssuesStateFilter)  {
                stateFilter = filter.requestGitLabArgs();
            }

            const encodedGroup = encodeURIComponent(
                configuration.group.path as string,
            );

            let activeGroup: Group | null = null;
            let allTasksPaginated: PaginatedListOfTasks | null = null;
            let allTasksList: Array<Task> = [];

            const groupResponse = await source.safeAxiosRequest<Group>({
                method: 'GET',
                url: `/groups/${encodedGroup}`,
            });

            const gitlabGroup = groupResponse.data;
            activeGroup = new Group(gitlabGroup.name, gitlabGroup.path, [] , gitlabGroup.avatar_url, gitlabGroup.web_url, gitlabGroup.description);



            //does the group have epics?
            if (configuration.sortBy === 'epic') {
            
            const epicsResponse = await source.safeAxiosRequest<Array<Epic>>({
                method: 'GET',
                url: `/groups/${encodedGroup}/epics`,
                params: {
                    page: configuration.group.page,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    per_page: configuration.group.pageSize,
                    state: stateFilter? stateFilter : 'all',
                    scope : 'all',
                },
            });
            const epicsList: Array<Epic> = [];
            for (const epic of epicsResponse.data) {
                const newEpic = new Epic(epic.title, epic.description, epic.web_url, epic.state, epic.start_date, epic.due_date, epic.iid);
               epicsList.push(newEpic);

               let tasksForEpics: PaginatedListOfTasks | null = null;
               let tasksListByEpic: Array<Task> = [];

                const { data, headers } = await source.safeAxiosRequest<Array<GitLabIssue>>({
                 method: 'GET',
                 url: `/groups/${encodedGroup}/epics/${epic.iid}/issues`,
                 params: {
                      page: configuration.tasks.page,
                      // eslint-disable-next-line @typescript-eslint/camelcase
                      per_page: configuration.tasks.pageSize,
                      state: stateFilter? stateFilter : 'all',
                      scope : 'all',
                 },
                });
                const epicPagination = getPaginationFromGitLabHeaders(headers);
                for (const gitlabIssue of data) {
                    console.log(gitlabIssue);
                    const task = getTaskFromGitLabIssue(gitlabIssue);
                    task.addState(gitlabIssue.state);
                    if (gitlabIssue.assignee) task.addUser(gitlabIssue.assignee.name);
                    tasksListByEpic.push(task);
                }

                tasksForEpics = new PaginatedListOfTasks(
                    tasksListByEpic,
                    configuration.tasks.page as number,
                    configuration.tasks.pageSize as number,
                    epicPagination.previousPage,
                    epicPagination.nextPage,
                    epicPagination.lastPage,
                    epicPagination.total,
                );

                tasksListByEpic.sort((a: Task, b: Task) => {
                    if (a.due && b.due) {
                        return a.due.getTime() - b.due.getTime();
                    }
                    return 0;
                });

                newEpic.addTasks(tasksForEpics);
               activeGroup.addEpic(newEpic);
            }
            }



            //does the group have projects?
            else if (configuration.sortBy === 'projects') {

            const projectsResponse = await source.safeAxiosRequest<Array<GitLabProject>>({
                method: 'GET',
                url: `/groups/${encodedGroup}/projects`,
                params: {
                    page: configuration.group.page,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    per_page: configuration.group.pageSize,
                    state: stateFilter? stateFilter : 'opened',
                    scope : 'all',
                 //   archived: false,
                },
            });
            const projectPagination = getPaginationFromGitLabHeaders(projectsResponse.headers);
            let tasksForAllProjects: PaginatedListOfTasks | null = null;
            let tasksForActiveGroup: PaginatedListOfProjects | null = null;
            
            const projectsList: Array<Project> = [];
            const tasksList: Array<Task> = [];
            for (
                let projectIndex = 0;
                projectIndex < projectsResponse.data.length;
                projectIndex++
            ) 
                {
                    let tasksForActiveProject: PaginatedListOfTasks | null = null;
                    let activeTaskList: Array<Task> = [];

                    const gitlabProject = projectsResponse.data[projectIndex];
                    const project = new Project(gitlabProject.name, gitlabProject.path_with_namespace, gitlabProject.web_url, gitlabProject.description, gitlabProject.avatar_url);
                    projectsList.push(project);
                    activeGroup.addProjects(projectsList);
                    
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
                                scope : 'all',
                            //  group: gitlabProject.name,
                            },
                        });
                    
                        for (const gitlabIssue of data) {
                            const task = getTaskFromGitLabIssue(gitlabIssue);
                            tasksList.push(task);
                            task.addState(gitlabIssue.state);
                            if (gitlabIssue.assignee) task.addUser(gitlabIssue.assignee.name);
                            activeTaskList.push(task);
                        }   
                        
                        tasksForActiveProject = new PaginatedListOfTasks(
                            activeTaskList,
                            configuration.tasks.page as number,
                            configuration.tasks.pageSize as number,
                            projectPagination.previousPage,
                            projectPagination.nextPage,
                            projectPagination.lastPage,
                            projectPagination.total,
                        );

                        activeTaskList.sort((a: Task, b: Task) => {
                            if (a.due && b.due) {
                                return a.due.getTime() - b.due.getTime();
                            }
                            return 0;
                        });
                        project.addTasks(tasksForActiveProject);
                }
            }

            // in every case, get all tasks
              
            const {data, headers} = await source.safeAxiosRequest<Array<GitLabIssue>>({
                method: 'GET',
                url: `/groups/${encodedGroup}/issues`,
                params: {
                    page: configuration.tasks.page,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    per_page: configuration.tasks.pageSize,
                    state: stateFilter? stateFilter : 'all',
                    epic_id: 'none',
                    scope : 'all',
                },
            });
            const pagination = getPaginationFromGitLabHeaders(headers);
            for (const gitlabIssue of data) {
                console.log(gitlabIssue);
                const task = getTaskFromGitLabIssue(gitlabIssue);
                task.addState(gitlabIssue.state);
                if (gitlabIssue.assignee) task.addUser(gitlabIssue.assignee.name);
                allTasksList.push(task);
            }

            allTasksList.sort((a: Task, b: Task) => {
                if (a.due && b.due) {
                    return a.due.getTime() - b.due.getTime();
                }
                return 0;
            });

            allTasksPaginated = new PaginatedListOfTasks(
                allTasksList,
                configuration.tasks.page as number,
                configuration.tasks.pageSize as number,
                pagination.previousPage,
                pagination.nextPage,
                pagination.lastPage,
                pagination.total,
            );

            activeGroup.addTasks(allTasksPaginated);

            console.log(activeGroup);

            
            return activeGroup;
          //  return tasksForAllProjects as PaginatedListOfTasks;
        }
    }
  