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
        Source,
        User,
    } from 'ganttlab-entities';
    import { GitLabGateway } from '../../../sources/gitlab/GitLabGateway';
    import { GitLabIssue } from '../../../sources/gitlab/types/GitLabIssue';
    import {
        getTaskFromGitLabIssue,
        getPaginationFromGitLabHeaders,
        getMilestoneFromGitLabMilestone,
    } from '../../../sources/gitlab/helpers';
import { GitLabProject } from '../../../sources/gitlab/types/GitLabProject';
import { Epic } from 'ganttlab-entities/dist/core/Epic';
import { GitLabMilestone } from '../../../sources/gitlab/types/GitLabMilestone';
import { GitLabUser } from '../../../sources/gitlab/types/GitLabUser';
    
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

            const usersResponse = await source.safeAxiosRequest<Array<GitLabUser>>({
                method: 'GET',
                url: `/users`,
                params: {
                    per_page: 100,
                  //  without_project_bots: true,
                },
            });
            const users: Array<User> = [];
            for (const gitlabUser of usersResponse.data) {
                const user = new User(gitlabUser.email, gitlabUser.username, gitlabUser.avatar_url, gitlabUser.web_url);
                users.push(user);
            }
            

            const gitlabGroup = groupResponse.data;
            activeGroup = new Group(gitlabGroup.name, gitlabGroup.path, [] , users , gitlabGroup.avatar_url , gitlabGroup.web_url , gitlabGroup.description);

         

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

            console.log(activeGroup);            
            return activeGroup;
          //  return tasksForAllProjects as PaginatedListOfTasks;
        }

        async uploadTasks(source: GitLabGateway, configuration: Configuration, tasks: Array<any>): Promise<void> {
        
            for (const task of tasks) {
               
                if (task.type === 'task'  && task.task_iid && task.project_id) {
                    const data = {
                        title: task.name,
                        description: `GanttStart: ${task.start_date}`,
                        due_date: task.end_date
                    };
            
                    try {
                        await source.safeAxiosRequest({
                            method: 'PUT',
                            url: `/projects/${task.project_id}/issues/${task.task_iid}`,
                            data: data
                        });
                        console.log(`Task ${task.id} updated successfully.`);
                    } catch (error) {
                        console.error(`Failed to update task ${task.id}: ${error}`);
                    }
                }
                else if (task.type === "task" && task.epic_id) {
                    const encodedGroup = encodeURIComponent(
                        configuration.group.path as string,
                    );
                    const data = {
                        title: task.name,
                        start_date_fixed : task.start_date,
                        due_date_fixed : task.end_date
                    };
            
                    try {
                        await source.safeAxiosRequest({
                            method: 'PUT',
                            url: `/groups/${encodedGroup}/epics/${task.epic_id}`,
                            data: data
                        });
                        console.log(`Project ${task.id} updated successfully.`);
                    } catch (error) {
                        console.error(`Failed to update project ${task.id}: ${error}`);
                    }
                }
            }
        }
        
    }
  