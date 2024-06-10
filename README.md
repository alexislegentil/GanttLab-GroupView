Here is the GanttLab doc, which describe everythings except the group view : https://gitlab.com/ganttlab/ganttlab/-/blob/master/README.md#how-it-works

For the specific Group view, you’ll find here the documentation. 

#How to install : 
	(in a terminal, go where you want to install with cd path/to/app)
Git clone https://gitlab.greenwaves-tech.com/alexisr/gantlab-update.git OR 
Git clone https://github.com/alexislegentil/GanttLab-GroupView.git
cd ganttlab-update
npm install 
npm run build:webapp
npm run serve:dist (version de production stable)
ou npm run webapp (version de développement)
http://localhost:8080

#How it works : 

Connexion 
Select GitLab, then enter the url of your instance (for example https://gitlab.greenwaves-tech.com/) 
And a personnel access token that you can create here : 
https://gitlab.greenwaves-tech.com/-/user_settings/personal_access_tokens

Configuration Panel
When you select “Group view” on the header of the page, you’ll have access to some configuration before getting all the tasks from GitLab. These parameters allow you to show a view by Epics, Projects or Milestones. You can also inform if you’re an Admin or not (this corresponds to the user's rôle on group, Owner and Maintainer being considered as admin). Two more checkboxes allow you to select if you want to display links between tasks (this corresponds to “blocked by” in GitLab), and to display closed tasks. These options can increase loading time and reduce the interface's visibility. 
 
View
	The view is splitted in two containers : First one is a vertical grid which displays information about a task or a folder. Tasks are represented by a file icon, and folders icons represent either an Epic, a Project or a Milestone, depending on what the user chose on the configuration panel. Empty folders appear as opened. 
For a task, the interface informs about the task's title, start date, duration, assign user(s), and state of the issue. State is calculated this way : a closed issue will appear closed. For an opened one, if its due date is in the past, it appears as “late”. Else, if it's assigned to someone, it appears as “In progress”, and “Unassigned” if not. 
For a folder, it shows the name, start date and duration only. 
Each row of this grid can be double-clicked to appear a lightbox with additional information, such as labels, and allow User to make changes. 

	The second container is the gantt chart, with an evolutive timeline which scales according to the chosen group. Users are allowed to resize and move tasks, but only Admin will have the push button to send changes to GitLab.  

	There is also a control bar which allows users to sort issues.

Post requests (Admin only)
For the time being, Admin can push this information to GitLab : Name, description, start date (will add a row in description such as “GanttStart : 2024-05-20”), due date, assign users, state (open or closed). 

For now, it’s impossible to create new links or to delete issues, but that might be an idea.
	
