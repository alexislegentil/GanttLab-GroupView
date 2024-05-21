<template>
  <div ref="ganttContainer" style="height: 90vh; width: 99vw;"></div>
</template>
 
<script>
/* eslint-disable @typescript-eslint/camelcase */
import {gantt, Gantt} from 'dhtmlx-gantt';
import { getModule } from 'vuex-module-decorators';
import MainModule from '../../../../store/modules/MainModule';
import moment from 'moment-timezone';

const mainState = getModule(MainModule);

const dateToStr = gantt.date.date_to_str(gantt.config.task_date);

const dateEditor = {type: "date", map_to: "start_date"};
const durationEditor = {type: "number", map_to: "duration", min:0, max: 100};

const stateEditor = {type: "select", options: [
        {key: "Unassigned", label: "Unassigned"},
        {key: "Closed", label: "Closed"},
        {key: "InProgress", label: "In progress"},
        {key: "Late", label: "Late"},
        {key: "Unscheduled", label: "Unscheduled"}
    ], map_to: "state"};

const legend = document.createElement('div');
legend.className = 'gantt-legend';
legend.id = 'gantt-legend';

const header = document.createElement('header');
header.className = 'legend-head';

const h3 = document.createElement('h3');
h3.textContent = 'Legend';

header.appendChild(h3);
legend.appendChild(header);

const legendList = document.createElement('div');
legendList.className = 'legend-list';

const states = ['Unassigned', 'Closed', 'In progress', 'Late', 'Unscheduled', 'folder'];
const descriptions = ['Unassigned issues', 'Closed issues', 'In progress', 'Late issues', 'Unscheduled', 'Parent'];

for (let i = 0; i < states.length; i++) {
  const row = document.createElement('div');
  row.className = 'legend-row';

  const label = document.createElement('div');
  label.className = 'legend-label ' + states[i].toLowerCase().replace(' ', '-');

  const description = document.createElement('div');
  description.textContent = descriptions[i];

  row.appendChild(label);
  row.appendChild(description);
  legendList.appendChild(row);
}

legend.appendChild(legendList);

// Créer la modal et ses éléments
const modal = document.createElement('div');
const content = document.createElement('div');
const closeButton = document.createElement('span');
const text = document.createElement('p');
const okButton = document.createElement('button');
const cancelButton = document.createElement('button');

// Ajouter du texte aux éléments
closeButton.textContent = '×';
text.textContent = 'Send all changes to GitLab ?';
okButton.textContent = 'OK';
okButton.style.backgroundColor = '#4caf50';
cancelButton.textContent = 'Cancel';
cancelButton.style.backgroundColor = '#bbbbbb';

// Ajouter des classes aux éléments pour le style
modal.classList.add('modal');
content.classList.add('modal-content');
closeButton.classList.add('close-button');

// Ajouter des événements aux boutons
closeButton.addEventListener('click', () => modal.style.display = 'none');
cancelButton.addEventListener('click', () => modal.style.display = 'none');

// Ajouter les éléments à la modal
content.appendChild(closeButton);
content.appendChild(text);
content.appendChild(okButton);
content.appendChild(cancelButton);
modal.appendChild(content);

// Ajouter la modal au document
document.body.appendChild(modal);


const stateFilter = {
  Unassigned: true,
  Closed: true,
  InProgress: true,
  Late: true,
  Unscheduled: true
}; 

let standaloneFilter = true;

const daysStyle = function(date){
    const dateToStr = gantt.date.date_to_str("%D");
    if (dateToStr(date) == "Sun"||dateToStr(date) == "Sat")  return "weekend";
 
    return "";
};



export default {
  props: {
    tasks: {
      type: Object,
      default () {
        return {data: [], links: []}
      }
    },
    requestsQueue: {
      type: Array,
      required: true
    },
    users: {
      type: Array,
      required: true
    }
  },

  data() {
    return {
      selectedScale: "day",
      isHidden: false
    }
  },
  
  watch: {
    requestsQueue: {
      handler: function (requestsQueue) {
        const uploadButtonDiv = document.querySelector(".upload-logo-container");
        if (requestsQueue.length > 0 && mainState.viewGateway.configuration.admin) {
          if (uploadButtonDiv) {
            uploadButtonDiv.style.display = 'block';
          }
        }
        else {
          if (uploadButtonDiv) {
            uploadButtonDiv.style.display = 'none';
          }
        }
      },
      deep: true
    },
    selectedScale: {
      handler: function (newVal, oldVal) {
        const selectScale = document.querySelector(".selectScale");
        selectScale.value = newVal;
        let event = new Event('change');
        selectScale.dispatchEvent(event);
      },
      deep: true
    }
  },

  methods: {
    $_initGanttEvents: function() {
      if (!gantt.$_eventsInitialized) {
        gantt.attachEvent('onTaskSelected', (id) => {
          const task = gantt.getTask(id);
          this.$emit('task-selected', task);
        });
        gantt.attachEvent('onTaskIdChange', (id, new_id) => {
          if (gantt.getSelectedId() == new_id) {
            const task = gantt.getTask(new_id);
            this.$emit('task-selected', task);
          }
        });
        gantt.$_eventsInitialized = true;
      }
    },
    $_initDataProcessor: function() {
      if (!gantt.$_dataProcessorInitialized) {
        this.dp = gantt.createDataProcessor((entity, action, data, id) => {
          this.$emit(`${entity}-updated`, id, action, data);
        });
        this.dp.attachEvent("onBeforeUpdate", function (id, status, data) {
            if (!data.name) {
                gantt.message("The task's name can't be empty!");
                return false;
            }
            if (!data.start_date || !data.end_date || data.start_date > data.end_date) {
                gantt.message("Task's dates are invalid!");
                return false;
            }
            return true;
        });
        gantt.$_dataProcessorInitialized = true;
      }
    },
    addAssignUserToTask: function(id) {
      const task = gantt.getTask(id);
      task.users.push('');
    },
    toggleLegend() {
      const legend = document.getElementById('gantt-legend');
      legend.classList.toggle('hidden');
    }
  },
 
  mounted: function () {

    this.$_initGanttEvents();

    let isThereStandaloneTasks = false;
    for (const task of this.$props.tasks.data) {
      if (task.level === 1 && task.parent === 0) {
        isThereStandaloneTasks = true;
        break;
      }
    }

    gantt.plugins({ 
        marker: true,
        multiselect: true ,
        tooltip: true ,
        undo: true
    }); 

    gantt.config.undo = true;
    gantt.config.redo = true;

    gantt.config.date_format = "%Y-%m-%d";

    gantt.config.layout = {
    css: "gantt_container",
      rows:[
            {
                  html: `
                  <div class="gantt-controls">
                      <button class="gantt-undo" onclick="gantt.undo()">Undo</button>
                      <button class="gantt-redo" onclick="gantt.redo()">Redo</button>
                    <div class="state-filter">
                      <div class="state-filter-unassigned"><input type="checkbox" id="Unassigned" class="state-checkbox" checked=${stateFilter["Unassigned"]} onChange="stateCheckboxOnChange('Unassigned')"><label for="Unassigned">Unassigned</label></div>
                      <div class="state-filter-closed" style="display : ${mainState.viewGateway.configuration.addClosedIssue ? ``:`none`}"><input type="checkbox" id="Closed" class="state-checkbox" checked=${stateFilter["Closed"]} onChange="stateCheckboxOnChange('Closed')"><label for="Closed">Closed</label></div>
                      <div class="state-filter-inprogress"><input type="checkbox" id="InProgress" class="state-checkbox" checked=${stateFilter["InProgress"]} onChange="stateCheckboxOnChange('InProgress')"><label for="InProgress">InProgress</label></div>
                      <div class="state-filter-late"><input type="checkbox" id="Late" class="state-checkbox" checked=${stateFilter["Late"]} onChange="stateCheckboxOnChange('Late')"><label for="Late">Late</label></div>
                      <div class="state-filter-unscheduled"><input type="checkbox" id="Unscheduled" class="state-checkbox" checked=${stateFilter["Unscheduled"]} onChange="stateCheckboxOnChange('Unscheduled')"><label for="Unscheduled">Unscheduled</label></div>
                    </div>
                    <div class='searchEl'><label for="searchFilter">Search task :</label><input id='searchFilter' style='width: 120px;' type='text' placeholder='Search tasks...'></div>
                    ${isThereStandaloneTasks ? `<div class='standaloneFilter'><label for="standaloneFilter">Standalone tasks :</label><input id='standaloneFilter' type='checkbox' checked=${standaloneFilter}></div>` : ''}
                    <select v-model="${this.selectedScale}" class="selectScale">
                      <option value="day">Day</option>
                      <option value="2days">2 Days</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                    </select>
                    <button class="toggleLegend">Toggle Legend</button>
                    <div class="upload-logo-container" title="push all changes to GitLab" style="display: none">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                        <!--
                          <!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.>
                        -->
                       <path fill="#28bf2d" d="M246.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 109.3 192 320c0 17.7 14.3 32 32 32s32-14.3 32-32l0-210.7 73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-64z"/>
                       </svg>
                    </div>
                    </div>`
                  
                  , css:"gantt-controls", height: 40
                },
                { resizer: true, width: 1 },
              {
            cols: [
              {
                // the default grid view  
                view: "grid",  
                scrollX:"scrollHor", 
                scrollY:"scrollVer"
              },
              { resizer: true, width: 1 },
              {
                // the default timeline view
                view: "timeline", 
                scrollX:"scrollHor", 
                scrollY:"scrollVer"
              },
              {
                view: "scrollbar", 
                id:"scrollVer"
              }
          ]},
          {
              view: "scrollbar", 
              id:"scrollHor"
          }
      ]
    };
    
    gantt.config.fit_tasks = true;

    gantt.config.columns = [
      {name: "name", label: "Task name", tree: true, width: 170, resize: true },
      {name: "start_date", label: "Start time", align: "center", width: 150 , resize: true, editor: dateEditor},
      {name: "duration", label: "Duration", align: "center", width: 60, editor: durationEditor},
      {name: "users", label: "User", align: "center", width: 100, template:function(obj){
                                return obj.users ? obj.users.map(user => user.username).join(', ') : "";}},
      {name: "state", label: "State", align: "center", width: 100, editor: stateEditor}
    ];

    gantt.config.lightbox.sections = [
      {name: "name", label: "Name", height:30, map_to:"name", type:"textarea", focus:true},
      {name:"description", label: "Description", height:72, map_to:"description", type:"textarea"},
      {name:"state",    height:22, map_to:"state", type:"select", options: stateEditor.options},
      {name:"template", height:150, type:"template", map_to:"my_template"}, 
      {name: "time", height:72, map_to:"auto", type:"duration"}
    ];

    gantt.config.lightbox.project_sections = [
      {name: "name", label: "Name", height:30, map_to:"name", type:"textarea", focus:true},
      {name: "time", height:72, map_to:"auto", type:"duration"}
    ];

    gantt.locale.labels.section_name = "Title";
    gantt.locale.labels.section_state = "State";
    gantt.locale.labels.section_template = "Details";

    gantt.config.lightbox.project_sections.allow_root = false;

    gantt.attachEvent("onBeforeLightbox", (id) =>  {
      const task = gantt.getTask(id);
    
      //<!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
      const addButton = `<div class='addUserAssign' ><svg xmlns="http:www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg></div>`;

      task.my_template = "<span id='lightbox_users_title'>Assign to: </span><div class='lightbox_user'>" 
      + `${task.users.map((taskUser, index) => {
        return `<select id="userSelect${index}" class='userSelect'> <option value='none'> </option> ${this.$props.users.map(user =>{
          return `<option class="userOption" value='${JSON.stringify({ username: user.username, id: user.id })}' ${taskUser.username === user.username ? 'selected' : ''}>${user.username}</option>`
        }).join('')
        })} </select>`
      }).join('')}`
      + addButton + "</div>"
      + "<br>  <span id='lightbox_progress'>Progress: </span>"+ task.progress*100 +" %"
      + `<br>  <div class='lightbox_labels'>${task.labels.map(label => `<span style="padding: 3px;color: white;background-color:${label.color};border-radius:5px">${label.name}</span>`).join('')}</div>`;


      this.$nextTick(() => {
        const container = document.querySelector('.lightbox_user');
        const addUserAssign = document.querySelector('.addUserAssign');
        let selects = container.querySelectorAll('select');
        selects.forEach(select => {
          select.onchange = function(e) {
            if (e.target.value === 'none') {
              task.users[parseInt(select.id.split('userSelect')[1])] = '';
            }
            else {
              task.users[parseInt(select.id.split('userSelect')[1])] = JSON.parse(e.target.value);
            }
          };
        });
        if (addUserAssign) {
          addUserAssign.addEventListener('click', () => {
            this.addAssignUserToTask(id);
            const newUser = task.users[task.users.length - 1];
            const newUserSelect = document.createElement('select');
            newUserSelect.onchange = function(e) {
              if (e.target.value === 'none') {
                task.users[parseInt(newUserSelect.id.split('userSelect')[1])] = '';
              }
              else {
                task.users[parseInt(newUserSelect.id.split('userSelect')[1])] = JSON.parse(e.target.value);
              }
            };
            newUserSelect.id = `userSelect${task.users.length - 1}`;
            newUserSelect.className = 'userSelect';
            newUserSelect.innerHTML = `<option value='none'> </option>` + this.$props.users.map(user => `<option value='${JSON.stringify({ username: user.username, id: user.id })}'>${user.username}</option>`).join('');
            const lastChild = container.lastElementChild;
            container.insertBefore(newUserSelect, lastChild);

            // Mettre à jour la référence à selects
            selects = container.querySelectorAll('select');
          });
        }
      });
      return true;
    });


    gantt.config.lightbox.allow_root = false;

    gantt.templates.task_text = function(start, end, task) {
      return "<b>Name:</b> " + task.name ;
    };
    gantt.templates.tooltip_text = function(start, end, task) {
      // Personnalisez ici le texte du tooltip pour chaque tâche (hover)
      return "<b>" + task.name + "</b><br/>" 
      + "Start: " + gantt.templates.tooltip_date_format(start) + "<br/>" 
      + "End: " + gantt.templates.tooltip_date_format(end) + "<br/>" 
      + "Duration: " + task.duration + " days" + "<br/>"
      + (task.state ? "<br/>State: " + task.state : "")
      + (task.users ? "<br/>" + `${task.users.map(user => user.username).join(', ')}` : "");
    };

    gantt.templates.task_class = function(start, end, task){
      let css = "";

      switch(task.state){
          case "Unassigned":
              css = "unassigned";
              break;
          case "Closed":
              css = "closed";
              break;
          case "InProgress":
              css = "in-progress";
              break;
          case "Late":
              css = "late";
              break;
          case "Unscheduled":
              css = "unscheduled";
              break;
          case gantt.hasChild(task.id):
              css = "folder";
              break;
          default:
              css = "";
      }
      return css;
    };

    gantt.templates.grid_row_class = function(start, end, task){
        return task.level === 0 ? "gantt_row_project" : "";
    };  


    gantt.config.columns_resizable = true;
    gantt.config.columns_autoresize = true;

    let today = new Date();

    const todayMarker = gantt.addMarker({
      start_date: today, //a Date object that sets the marker's date
      css: "today", //a CSS class applied to the marker
      text: "Now", //the marker title
      title: dateToStr( today) // the marker's tooltip
    });

    let closestTask = this.$props.tasks.data.reduce((closest, current) => {
      let currentDate = new Date(current.start_date);
      let closestDate = new Date(closest.start_date);
      return Math.abs(today - currentDate) < Math.abs(today - closestDate) ? current : closest;
    });

    

    if (this.$props.tasks.data.length < 50) {
      gantt.config.open_tree_initially = true;   //if more than 50 tasks, epics will be closed by default
    }
    
    
    gantt.init(this.$refs.ganttContainer);
    gantt.parse(this.$props.tasks);

    const start = performance.now();

    gantt.sort((a, b) => new Date(a.end_date) - new Date(b.end_date), false, 0, false);

    const end = performance.now();
    const executionTime = end - start;
    console.log(`Temps d'exécution tri : ${executionTime} millisecondes.`);

    
    gantt.showDate(gantt.getMarker(todayMarker).start_date);
    gantt.showTask(closestTask.id);                             // this will scroll the timeline to the task, horizontally and vertically

    let firstElement = this.$props.tasks.data[0];
    let lastElement = this.$props.tasks.data[this.$props.tasks.data.length - 1];

    let startDate = new Date(firstElement.start_date);
    let endDate = new Date(lastElement.end_date);

    let diffInDays = moment(startDate).diff(moment(endDate), 'days');
   
      if (diffInDays <= 7) {
        this.selectedScale = "day";

      } else if (diffInDays <= 30) {
        this.selectedScale = "2days";

      } else if (diffInDays <= 200) {
        this.selectedScale = "week";
      } else {
        this.selectedScale = "month";

      }
    

    if (isThereStandaloneTasks) {
      document.getElementById('standaloneFilter').addEventListener('change', function(e) {
        standaloneFilter = e.target.checked;
        gantt.refreshData();
      });
    }

    document.querySelector(".toggleLegend").addEventListener('click', this.toggleLegend);
    
    document.querySelectorAll(".state-checkbox").forEach(function(checkbox) {
        checkbox.onchange = function(e) {
          stateFilter[e.target.id] = !stateFilter[e.target.id];
          gantt.refreshData();
        };
    });

   
    document.querySelector(".selectScale").addEventListener('change', function(e) {
      this.selectedScale = e.target.value;
  
      switch (this.selectedScale) {
        case 'day':
          gantt.config.scales = [
            {unit: "month", step: 1, format: "%F, %Y"},
            {unit: "day", step: 1, format: "%j, %D", css: daysStyle}
          ];
          break;
        case '2days':
          gantt.config.scales = [
            {unit: "month", step: 1, format: "%F, %Y"},
            {unit: "day", step: 2, format: "%j, %D", css: daysStyle}
          ];
          break;
        case 'week':
          gantt.config.scales = [
            {unit: "month", step: 1, format: "%F, %Y"},
            {unit: "week", step: 1, format: "%j, %D", css: daysStyle}
          ];
          break;
        case 'month':
          gantt.config.scales = [
            {unit: "month", step: 1, format: "%F, %Y"},
          ];
          break;
      }
      gantt.render(); // re-rendre le diagramme de Gantt avec la nouvelle configuration
    });

    document.querySelector(".upload-logo-container").addEventListener('click', () => {
      modal.style.display = 'block';
    });

    okButton.addEventListener('click', () => {
      this.$emit('upload-tasks');
      modal.style.display = 'none';
    });

    let filterValue = "";

    gantt.attachEvent("onDataRender", function () {
    const filterEl = document.querySelector("#searchFilter")
    filterEl.addEventListener('input', function (e) {
        filterValue = filterEl.value;
        gantt.refreshData();
    });
    });

    function filterLogic(task, match) {
      match = match || false;
      // check children
      gantt.eachTask(function (child) {
          if (filterLogic(child)) {
              match = true;
          }
      }, task.id);

      // check task
      if (task.name.toLowerCase().indexOf(filterValue.toLowerCase()) > -1) {
          match = true;
      }

      // check state
      if (stateFilter[task.state] === false) {
          match = false;
      }

      // check standalone
      if (!standaloneFilter && !gantt.hasChild(task.id) && task.level === 1 && task.parent == 0 ) {
        match = false;
      }

      return match;
    }

    gantt.attachEvent("onBeforeTaskDisplay", function (id, task) {
      let thereIsAtLeastOneFilterToApply = false;
      for (const state in stateFilter) {
        if (!stateFilter[state]) {
          thereIsAtLeastOneFilterToApply = true;
          break;
        }
      }

      if (!filterValue && !thereIsAtLeastOneFilterToApply && standaloneFilter) {
        return true;
    }
        return filterLogic(task);
    });

    gantt.attachEvent("onLightboxSave", function(id, item){
        if(!item.name){
            gantt.message({type:"error", text:"Enter task name!"});
            return false;
        }
        if (!item.start_date || !item.end_date || item.start_date > item.end_date) {
                gantt.message("Task's dates are invalid!");
                return false;
            }
        return true;
    });
  
    gantt.$root.appendChild(legend);
    this.$_initDataProcessor();
  },

  beforeDestroy: function() {
    gantt.clearAll();
    gantt.detachAllEvents();
    this.dp.destructor();
    gantt.$dataProcessor = null;
    gantt.$_eventsInitialized = false;
    gantt.$_dataProcessorInitialized = false;  
  }

}
</script>
 
<style>
    @import "../../../../../../../node_modules/dhtmlx-gantt/codebase/skins/dhtmlxgantt_broadway.css";

/* common styles for overriding */
.ganttContainer{
    height: 100%;
    width: 100%;
}
.gantt_task_line{
        border-color: rgba(0, 0, 0, 0.25);
}
.gantt_task_line .gantt_task_progress {
    background-color: rgba(0, 0, 0, 0.25);
    border-right: 1px solid black;
    box-shadow: none;
}

.gantt_tree_content {
    overflow:hidden;
    text-overflow: ellipsis;
}
/* .gantt_tree_icon.gantt_folder_open {
    background-image: url("../../../generic/icons/Folder\ Minus\ Classic.svg")!important;
}

.gantt_tree_icon.gantt_folder_closed {
    background-image: url("../../../generic/icons/Folder\ plus\ solid.svg")!important;
} */

.unassigned {
    background-color: #2b84cf;
}

.closed {
    background-color: #44b231;
}

.in-progress {
    background-color: #d8a338;
}

.late {
    background-color: #db4646;
}

.unscheduled {
    background-color: grey;
}

.folder {
    background-color: #4f4e4e;
}

.modal {
  display: none; /* Hidden by default */
  position: fixed; /* Stay in place */
  z-index: 1; /* Sit on top */
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  overflow: auto; /* Enable scroll if needed */
  background-color: rgb(0,0,0); /* Fallback color */
  background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
}

.modal-content {
  background-color: #fefefe;
  margin: 15% auto; /* 15% from the top and centered */
  padding: 20px;
  border: 1px solid #888;
  width: 30%; /* Could be more or less, depending on screen size */
}

.modal-content button {
  background-color: #168af0;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 5px 10px;
  margin: 0 10px;
}

.close-button {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close-button:hover,
.close-button:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

.gantt_row.gantt_row_project, .gantt_row.odd.gantt_row_project{
   background-color:#bbbbbb;
   font-weight: bold;
}


.weekend{
        background: rgba(0, 0, 0, 0.10) !important;
}

.gantt-controls {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 100%;
    padding: 5px;
}

.gantt-controls button {
    margin-right: 1rem;
    padding: 0.3rem 0.8rem;
    background-color: #168af0;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.toggleLegend {
  margin-left: 1rem;
}
.state-checkbox {
    display: flex;
    justify-content: space-between;

  vertical-align: middle;
  }
  
  input[type="checkbox"].state-checkbox   {
    display: none;
  }

  
  .state-filter input[type="checkbox"]:checked + label {
    background-color: #4caf50;
    color: white;
  }

  .state-filter {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-left: 2rem;
  }

.state-checkbox + label {
  vertical-align: middle;
  padding: 5px 10px;
  background-color: #f2f2f2;
  border-radius: 5px;
  cursor: pointer;
  user-select: none;
}
.searchEl {
  display: flex;
  align-items: center;
  margin-left: 2rem;
}

.searchEl label {
  margin-right: 10px;
  font-weight: bold;
}

.searchEl #searchFilter {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 120px;
  transition: border .3s ease;
}

.searchEl #searchFilter:focus {
  border-color: #007BFF;
}

.standaloneFilter {
  display: flex;
  align-items: center;
  margin-left: 2rem;
  gap: 10px;
}

.selectScale {
  margin-left: 3rem;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.upload-logo-container {
  width: 1.3em;
  margin-left: auto;
  margin-right: 2em;
  cursor: pointer;
}


.lightbox_labels {
  display: flex;
  gap: 5px;
}
.gantt-legend {
		position: absolute;
		right: 2rem;
		bottom: 2rem;
		top:auto;
		left:auto;

		width: 200px;
		height: auto;

		font-family: Arial, Helvetica, sans-serif;
		background: white;
		border:1px solid #cecece;



		--level-padding: 10px;
	}

  .legend-head {
		border-bottom: 1px solid #bebebe;
		padding-left: var(--level-padding);
	}

  .legend-list{
		flex-direction: column;
		padding-left: var(--level-padding);
	}

	.legend-row{
		line-height: 1rem;
		display: flex;
		flex-direction: row;
		margin:5px;
	}

	.legend-label {
		display: inline-block;
		width:0.7rem;
		height: 1rem;
		border-radius: 4px;
		flex-grow: 0;
		flex-shrink: 0;
		margin:0 5px;
	}

#lightbox_users_title {
  font-weight: bold;
  display: block;
}

.lightbox_user {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
}

.userSelect {
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
  max-width: 7em;
}

.userOption {
  padding: 5px;
}

.addUserAssign {
  border: none;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  width: 16px;
}

#lightbox_progress {
  font-weight: bold;
  margin-bottom: 10px;
  display: block;
}

.lightbox_labels {
  padding: 5px;
  border-radius: 5px;
}

</style>
