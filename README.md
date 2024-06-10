# GanttLab Group View Documentation

## Overview
This documentation provides specific instructions on installing and using the Group View feature of GanttLab. For general information about GanttLab, please refer to the [main GanttLab README](https://gitlab.com/ganttlab/ganttlab/-/blob/master/README.md#how-it-works).

## How to Install
1. Open a terminal and navigate to your desired installation directory:
    ```sh
    cd path/to/app
    ```
2. Clone the repository:
    ```sh
    git clone https://gitlab.greenwaves-tech.com/alexisr/gantlab-update.git
    # OR
    git clone https://github.com/alexislegentil/GanttLab-GroupView.git
    ```
3. Navigate to the project directory:
    ```sh
    cd ganttlab-update
    ```
4. Install dependencies:
    ```sh
    npm install
    ```
5. Build the web application:
    ```sh
    npm run build:webapp
    ```
6. Serve the application:
    - For stable production version:
      ```sh
      npm run serve:dist
      ```
    - For development version:
      ```sh
      npm run webapp
      ```
7. Open your browser and go to:
    ```sh
    http://localhost:8080
    ```

## How it Works

### Connexion
1. Select GitLab.
2. Enter the URL of your GitLab instance (e.g., `https://gitlab.greenwaves-tech.com/`).
3. Enter a personal access token, which you can create [here](https://gitlab.greenwaves-tech.com/-/user_settings/personal_access_tokens).

### Configuration Panel
- Select "Group view" from the header.
- Configure the following parameters before fetching tasks from GitLab:
  - **View by**: Epics, Projects, or Milestones.
  - **Admin Status**: Indicate if you are an Admin (Owner or Maintainer).
  - **Display Options**:
    - Show links between tasks ("blocked by" in GitLab).
    - Show closed tasks.
  - Note: Displaying links and closed tasks can increase loading time and reduce interface visibility.

### View

#### Containers
1. **Vertical Grid Container**:
   - Displays information about tasks or folders.
   - **Tasks**: Represented by a file icon, showing title, start date, duration, assigned user(s), and state.
     - **State Calculation**:
       - Closed issue: appears as "closed".
       - Open issue: 
         - Past due date: appears as "late".
         - Assigned: appears as "In progress".
         - Unassigned: appears as "Unassigned".
   - **Folders**: Represented by icons based on configuration (Epic, Project, or Milestone), showing name, start date, and duration.
   - Double-click on rows to open a lightbox with additional information and editing options.

2. **Gantt Chart Container**:
   - Evolutive timeline scaling according to the chosen group.
   - Users can resize and move tasks.
   - Admins can push changes to GitLab.

#### Control Bar
- Allows users to sort issues.

### Post Requests (Admin Only)
Admins can push the following information to GitLab:
- Name
- Description
- Start date (adds a row in the description such as "GanttStart : 2024-05-20")
- Due date
- Assigned users
- State (open or closed)

### Limitations
- Creating new links or deleting issues is not supported yet but may be considered for future updates.
