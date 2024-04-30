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
        Milestone,
        Iteration,
    } from 'ganttlab-entities';
    import { GitLabGateway } from '../../../sources/gitlab/GitLabGateway';
    import { GitLabIssue } from '../../../sources/gitlab/types/GitLabIssue';
    import {
        getTaskFromGitLabIssue,
        getPaginationFromGitLabHeaders,
        getMilestoneFromGitLabMilestone,
        getIterationFromGitLabIteration,
    } from '../../../sources/gitlab/helpers';
import { GitLabProject } from '../../../sources/gitlab/types/GitLabProject';
import { Epic } from 'ganttlab-entities/dist/core/Epic';
import { GitLabMilestone } from '../../../sources/gitlab/types/GitLabMilestone';
import { GitLabIteration } from '../../../sources/gitlab/types/GitLabIteration';
    
    export class ViewGroupGitLabStrategy
        implements ViewSourceStrategy<Group> {
        async execute(
            source: GitLabGateway,
            configuration: Configuration,
            filter: Filter | null,
        ): Promise<Group> {

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




            if (configuration.sortBy === 'epic') {
            
            const epicsResponse = await source.safeAxiosRequest<Array<Epic>>({
                method: 'GET',
                url: `/groups/${encodedGroup}/epics`,
                params: {
                    state: 'all',
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
                      state: 'all',
                      scope : 'all',
                 },
                });
                const epicPagination = getPaginationFromGitLabHeaders(headers);
                for (const gitlabIssue of data) {
                    console.log(gitlabIssue);
                    const task = getTaskFromGitLabIssue(gitlabIssue);
                    task.addState(gitlabIssue.state);
                    if (gitlabIssue.assignees) {
                        for (const user of gitlabIssue.assignees) {
                            task.addUser(user.username);
                        }
                    } 
                    if (gitlabIssue.labels) {
                        for (const labelName of gitlabIssue.labels) {
                            const label = await source.safeAxiosRequest<any>({
                                method: 'GET',
                                url: `/projects/${gitlabIssue.project_id}/labels/${labelName}`,
                            });
                            task.addLabel(labelName, label.data.color);
                        }
                    }
                    const blockedBy = await source.safeAxiosRequest<Array<any>>({
                        method: 'GET',
                        url: `/projects/${gitlabIssue.project_id}/issues/${gitlabIssue.iid}/links`,
                    });
                    for (const link of blockedBy.data) {
                        if (link.link_type === 'is_blocked_by') {
                        task.addBlockedBy(link.title);
                        }

                    }
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

            const {data, headers} = await source.safeAxiosRequest<Array<GitLabIssue>>({
                method: 'GET',
                url: `/groups/${encodedGroup}/issues`,
                params: {
                    state: 'all',
                    epic_id: 'none',
                    scope : 'all',
                },
            });
            const pagination = getPaginationFromGitLabHeaders(headers);
            for (const gitlabIssue of data) {

                const task = getTaskFromGitLabIssue(gitlabIssue);
                task.addState(gitlabIssue.state);
                if (gitlabIssue.assignees) {
                    for (const user of gitlabIssue.assignees) {
                        task.addUser(user.username);
                    }
                } 
                const blockedBy = await source.safeAxiosRequest<Array<any>>({
                    method: 'GET',
                    url: `/projects/${gitlabIssue.project_id}/issues/${gitlabIssue.iid}/links`,
                });
                for (const link of blockedBy.data) {
                    if (link.link_type === 'is_blocked_by') {
                    task.addBlockedBy(link.title);
                    }                    
                }
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
            }



            //does the group have projects?
            else if (configuration.sortBy === 'projects') {

            const projectsResponse = await source.safeAxiosRequest<Array<GitLabProject>>({
                method: 'GET',
                url: `/groups/${encodedGroup}/projects`,
                params: {
                    state: 'all',
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
                                state: 'all',
                                scope : 'all',
                            //  group: gitlabProject.name,
                            },
                        });
                    
                        for (const gitlabIssue of data) {
                            const task = getTaskFromGitLabIssue(gitlabIssue);
                            tasksList.push(task);
                            task.addState(gitlabIssue.state);
                            if (gitlabIssue.assignees) {
                                for (const user of gitlabIssue.assignees) {
                                    task.addUser(user.username);
                                }
                            } 
                            if (gitlabIssue.labels) {
                                for (const labelName of gitlabIssue.labels) {
                                    const label = await source.safeAxiosRequest<any>({
                                        method: 'GET',
                                        url: `/projects/${gitlabIssue.project_id}/labels/${labelName}`,
                                    });
                                    task.addLabel(labelName, label.data.color);
                                }
                            }
                            const blockedBy = await source.safeAxiosRequest<Array<any>>({
                                method: 'GET',
                                url: `/projects/${gitlabIssue.project_id}/issues/${gitlabIssue.iid}/links`,
                            });
                            for (const link of blockedBy.data) {
                                if (link.link_type === 'is_blocked_by') {
                                task.addBlockedBy(link.title);
                                }
                            }
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

            else if (configuration.sortBy === 'milestones') {
                const milestonesResponse = await source.safeAxiosRequest<
                    Array<GitLabMilestone>
                    >({
                    method: 'GET',
                    url: `/groups/${encodedGroup}/milestones`,
                    params: {
                        state: 'all',
                    },
                    });
                const milestonesList: Array<Milestone> = [];
                for (const gitlabMilestone of milestonesResponse.data) {
          
                    const milestone = getMilestoneFromGitLabMilestone(gitlabMilestone);
                    milestonesList.push(milestone);
                    console.log(milestone);
                    let tasksForMilestones: PaginatedListOfTasks | null = null;
                    let tasksListByMilestone: Array<Task> = [];
            
                    const { data, headers } = await source.safeAxiosRequest<Array<GitLabIssue>>({
                        method: 'GET',
                        url: `/groups/${encodedGroup}/issues`,
                        params: {
                            milestone: milestone.name,
                        },
                    });
                    const milestonePagination = getPaginationFromGitLabHeaders(headers);
                    for (const gitlabIssue of data) {
                        const task = getTaskFromGitLabIssue(gitlabIssue);
                        task.addState(gitlabIssue.state);
                        if (gitlabIssue.assignees) {
                            for (const user of gitlabIssue.assignees) {
                                task.addUser(user.username);
                            }
                        } 
                        if (gitlabIssue.labels) {
                            for (const labelName of gitlabIssue.labels) {
                                const label = await source.safeAxiosRequest<any>({
                                    method: 'GET',
                                    url: `/projects/${gitlabIssue.project_id}/labels/${labelName}`,
                                });
                                task.addLabel(labelName, label.data.color);
                            }
                        }
                        const blockedBy = await source.safeAxiosRequest<Array<any>>({
                            method: 'GET',
                            url: `/projects/${gitlabIssue.project_id}/issues/${gitlabIssue.iid}/links`,
                        });
                        for (const link of blockedBy.data) {
                            if (link.link_type === 'is_blocked_by') {
                                task.addBlockedBy(link.title);
                            }
                        }
                        tasksListByMilestone.push(task);
                    }
            
                    tasksForMilestones = new PaginatedListOfTasks(
                        tasksListByMilestone,
                        configuration.tasks.page as number,
                        configuration.tasks.pageSize as number,
                        milestonePagination.previousPage,
                        milestonePagination.nextPage,
                        milestonePagination.lastPage,
                        milestonePagination.total,
                    );
            
                    tasksListByMilestone.sort((a: Task, b: Task) => {
                        if (a.due && b.due) {
                            return a.due.getTime() - b.due.getTime();
                        }
                        return 0;
                    });
            
                    milestone.addTasks(tasksForMilestones);
                }
                activeGroup.addMilestones(milestonesList);
            
                const {data, headers} = await source.safeAxiosRequest<Array<GitLabIssue>>({
                    method: 'GET',
                    url: `/groups/${encodedGroup}/issues`,
                    params: {
                        state: 'all',
                        milestone: 'none',
                    },
                });
                const pagination = getPaginationFromGitLabHeaders(headers);
                for (const gitlabIssue of data) {
                    const task = getTaskFromGitLabIssue(gitlabIssue);
                    task.addState(gitlabIssue.state);
                    if (gitlabIssue.assignees) {
                        for (const user of gitlabIssue.assignees) {
                            task.addUser(user.username);
                        }
                    } 
                    if (gitlabIssue.labels) {
                        for (const labelName of gitlabIssue.labels) {
                            const label = await source.safeAxiosRequest<any>({
                                method: 'GET',
                                url: `/projects/${gitlabIssue.project_id}/labels/${labelName}`,
                            });
                            task.addLabel(labelName, label.data.color);
                        }
                    }
                    const blockedBy = await source.safeAxiosRequest<Array<any>>({
                        method: 'GET',
                        url: `/projects/${gitlabIssue.project_id}/issues/${gitlabIssue.iid}/links`,
                    });
                    for (const link of blockedBy.data) {
                        if (link.link_type === 'is_blocked_by') {
                            task.addBlockedBy(link.title);
                        }                    
                    }
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
            }


            else if (configuration.sortBy === 'iterations') {
                const iterationsResponse = await source.safeAxiosRequest<Array<GitLabIteration>>({
                    method: 'GET',
                    url: `/groups/${encodedGroup}/iterations`,
                });
                const iterationsList: Array<Iteration> = [];
                for (const gitlabIteration of iterationsResponse.data) {
                    console.log(gitlabIteration);
                    const iteration = getIterationFromGitLabIteration(gitlabIteration);
                    iterationsList.push(iteration);
                    let tasksForIterations: PaginatedListOfTasks | null = null;
                    let tasksListByIteration: Array<Task> = [];
            
                    const { data, headers } = await source.safeAxiosRequest<Array<GitLabIssue>>({
                        method: 'GET',
                        url: `/groups/${encodedGroup}/issues`,
                        params: {
                            iteration_id: gitlabIteration.iid,
                        },
                    });
                    const iterationPagination = getPaginationFromGitLabHeaders(headers);
                    for (const gitlabIssue of data) {
                        console.log(gitlabIssue);
                        const task = getTaskFromGitLabIssue(gitlabIssue);
                        // ... (traitement des problèmes comme dans le cas 'milestones')
                        tasksListByIteration.push(task);
                    }
            
                    tasksForIterations = new PaginatedListOfTasks(
                        tasksListByIteration,
                        configuration.tasks.page as number,
                        configuration.tasks.pageSize as number,
                        iterationPagination.previousPage,
                        iterationPagination.nextPage,
                        iterationPagination.lastPage,
                        iterationPagination.total,
                    );
            
                    tasksListByIteration.sort((a: Task, b: Task) => {
                        if (a.due && b.due) {
                            return a.due.getTime() - b.due.getTime();
                        }
                        return 0;
                    });
            
                    iteration.addTasks(tasksForIterations);
                }
                activeGroup.addIterations(iterationsList);
            
                const {data, headers} = await source.safeAxiosRequest<Array<GitLabIssue>>({
                    method: 'GET',
                    url: `/groups/${encodedGroup}/issues`,
                    params: {
                        state: 'all',
                        iteration_id: 'none',
                    },
                });
                const pagination = getPaginationFromGitLabHeaders(headers);
                for (const gitlabIssue of data) {
                    const task = getTaskFromGitLabIssue(gitlabIssue);
                    task.addState(gitlabIssue.state);
                    if (gitlabIssue.assignees) {
                        for (const user of gitlabIssue.assignees) {
                            task.addUser(user.username);
                        }
                    } 
                    if (gitlabIssue.labels) {
                        for (const labelName of gitlabIssue.labels) {
                            const label = await source.safeAxiosRequest<any>({
                                method: 'GET',
                                url: `/projects/${gitlabIssue.project_id}/labels/${labelName}`,
                            });
                            task.addLabel(labelName, label.data.color);
                        }
                    }
                    const blockedBy = await source.safeAxiosRequest<Array<any>>({
                        method: 'GET',
                        url: `/projects/${gitlabIssue.project_id}/issues/${gitlabIssue.iid}/links`,
                    });
                    for (const link of blockedBy.data) {
                        if (link.link_type === 'is_blocked_by') {
                            task.addBlockedBy(link.title);
                        }                    
                    }
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
            }



            console.log(activeGroup);

            
            return activeGroup;
          //  return tasksForAllProjects as PaginatedListOfTasks;
        }

        //post
        

    }
  