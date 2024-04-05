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

            let activeGroup: Group | null = null;

            const groupResponse = await source.safeAxiosRequest<Group>({
                method: 'GET',
                url: `/groups/${encodedGroup}`,
            });

            console.log('group', groupResponse.data);

            const gitlabGroup = groupResponse.data;
            activeGroup = new Group(gitlabGroup.name, gitlabGroup.path, [] , gitlabGroup.avatar_url, gitlabGroup.web_url, gitlabGroup.description);

            console.log('activeGroup', activeGroup);



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
                    console.log('project', projectsResponse.data[projectIndex]);
                    const gitlabProject = projectsResponse.data[projectIndex];
                    const project = new Project(gitlabProject.name, gitlabProject.path_with_namespace, gitlabProject.web_url, gitlabProject.description, gitlabProject.avatar_url);
                    projectsList.push(project);
                    
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
                            activeTaskList.push(task);
                        }   
                        
                        tasksForActiveProject = new PaginatedListOfTasks(
                            activeTaskList,
                            configuration.tasks.page as number,
                            configuration.tasks.pageSize as number,
                            pagination.previousPage,
                            pagination.nextPage,
                            pagination.lastPage,
                            pagination.total,
                        );

                        activeGroup.addTasks(tasksForActiveProject, project);
                }


            tasksList.sort((a: Task, b: Task) => {
                if (a.due && b.due) {
                    return a.due.getTime() - b.due.getTime();
                }
                return 0;
            });

            projectsList.sort((a: Project, b: Project) => {
                if (a.name && b.name) {
                    return a.name.localeCompare(b.name);
                }
                return 0;
            });

            tasksForActiveGroup = new PaginatedListOfProjects(
                projectsList,
                configuration.group.page as number,
                configuration.group.pageSize as number,
                pagination.previousPage,
                pagination.nextPage,
                pagination.lastPage,
                pagination.total,
            );

            console.log('projectList', tasksForActiveGroup);

           
            tasksForAllProjects = new PaginatedListOfTasks(
                tasksList,
                configuration.tasks.page as number,
                configuration.tasks.pageSize as number,
                pagination.previousPage,
                pagination.nextPage,
                pagination.lastPage,
                pagination.total,
            );

            console.log('tasksList', tasksForAllProjects);

            console.log(activeGroup);

            
    
            return tasksForAllProjects as PaginatedListOfTasks;
        }
    }
  