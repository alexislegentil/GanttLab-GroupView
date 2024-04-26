<template>
  <div ref="ganttContainer" style="height: 80vh;"></div>
</template>
 
<script>
/* eslint-disable @typescript-eslint/camelcase */
import {gantt} from 'dhtmlx-gantt';

const dateToStr = gantt.date.date_to_str(gantt.config.task_date);

const dateEditor = {type: "date", map_to: "start_date"};
const durationEditor = {type: "number", map_to: "duration", min:0, max: 100};

const stateEditor = {type: "select", options: [
        {key: "Opened", label: "Opened"},
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

const states = ['Opened', 'Closed', 'In progress', 'Late', 'Unscheduled', 'folder'];
const descriptions = ['Opened issues', 'Closed issues', 'In progress', 'Late issues', 'Unscheduled', 'Parent'];

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


const stateFilter = {
  Opened: true,
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
        gantt.createDataProcessor((entity, action, data, id) => {
          this.$emit(`${entity}-updated`, id, action, data);
        });
        gantt.$_dataProcessorInitialized = true;
      }
    },
  },
 
  mounted: function () {

    this.$_initGanttEvents();

    let isThereStandaloneTasks = false;
    for (const task of this.$props.tasks.data) {
      if (task.type !== 'project' && task.parent == 0) {
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
                      <div class="state-filter-opened"><input type="checkbox" id="Opened" class="state-checkbox" checked=${stateFilter["Opened"]} onChange="stateCheckboxOnChange('Opened')"><label for="Opened">Opened</label></div>
                      <div class="state-filter-closed"><input type="checkbox" id="Closed" class="state-checkbox" checked=${stateFilter["Closed"]} onChange="stateCheckboxOnChange('Closed')"><label for="Closed">Closed</label></div>
                      <div class="state-filter-inprogress"><input type="checkbox" id="InProgress" class="state-checkbox" checked=${stateFilter["InProgress"]} onChange="stateCheckboxOnChange('InProgress')"><label for="InProgress">InProgress</label></div>
                      <div class="state-filter-late"><input type="checkbox" id="Late" class="state-checkbox" checked=${stateFilter["Late"]} onChange="stateCheckboxOnChange('Late')"><label for="Late">Late</label></div>
                      <div class="state-filter-unscheduled"><input type="checkbox" id="Unscheduled" class="state-checkbox" checked=${stateFilter["Unscheduled"]} onChange="stateCheckboxOnChange('Unscheduled')"><label for="Unscheduled">Unscheduled</label></div>
                    </div>
                    <div class='searchEl'><label for="searchFilter">Search task :</label><input id='searchFilter' style='width: 120px;' type='text' placeholder='Search tasks...'></div>
                    ${isThereStandaloneTasks ? `<div class='standaloneFilter'><label for="standaloneFilter">Standalone tasks :</label><input id='standaloneFilter' type='checkbox' checked=${standaloneFilter}></div>` : ''}
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

    gantt.config.scales = [
      {unit: "month", step: 1, format: "%F, %Y"},
      {unit: "day", step: 1, format: "%j, %D",  css:daysStyle}  
    ];
    
    gantt.config.fit_tasks = true;

    gantt.config.columns = [
      {name: "name", label: "Task name", tree: true, width: 170, resize: true },
      {name: "start_date", label: "Start time", align: "center", width: 150 , resize: true, editor: dateEditor},
      {name: "duration", label: "Duration", align: "center", width: 60, editor: durationEditor},
      {name: "user", label: "User", align: "center", width: 100},
      {name: "state", label: "State", align: "center", width: 100, editor: stateEditor}
    ];

    gantt.config.lightbox.sections = [
      {name: "name", label: "Name", height:30, map_to:"name", type:"textarea", focus:true},
      {name:"state",    height:22, map_to:"state", type:"select", options: stateEditor.options},
      {name:"template", height:37, type:"template", map_to:"my_template"}, 
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

    gantt.attachEvent("onBeforeLightbox", function(id) {
    const task = gantt.getTask(id);
    task.my_template = "<span id='lightbox_users'>Assign to: </span>"+ task.user
    +"<br>  <span id='lightbox_progress'>Progress: </span>"+ task.progress*100 +" %";
    return true;
});


    gantt.config.lightbox.allow_root = false;

    gantt.templates.task_text = function(start, end, task) {
      return "<b>Name:</b> " + task.name + (task.user ? ",<b> Assign to:</b> " + task.user : "");
    };
    gantt.templates.tooltip_text = function(start, end, task) {
      // Personnalisez ici le texte du tooltip pour chaque tâche (hover)
      return "<b>" + task.name + "</b><br/>" 
      + "Start: " + gantt.templates.tooltip_date_format(start) + "<br/>" 
      + "End: " + gantt.templates.tooltip_date_format(end) + "<br/>" 
      + "Duration: " + task.duration + " days" + "<br/>"
      + (task.state ? "<br/>State: " + task.state : "")
      + (task.user ? "<br/>User: " + task.user : "");
    };

    gantt.templates.task_class = function(start, end, task){
      let css = "";

      switch(task.state){
          case "Opened":
              css = "opened";
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
          default:
              css = "";
      }
      return css;
    };


    gantt.config.columns_resizable = true;
    gantt.config.columns_autoresize = true;


    gantt.addMarker({
      start_date: new Date(), //a Date object that sets the marker's date
      css: "today", //a CSS class applied to the marker
      text: "Now", //the marker title
      title: dateToStr( new Date()) // the marker's tooltip
    });

    if (this.$props.tasks.data.length < 50) {
      gantt.config.open_tree_initially = true;   //if more than 50 tasks, tasks will be closed by default
    }

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
    

    gantt.init(this.$refs.ganttContainer);
    gantt.parse(this.$props.tasks);
    this.$_initDataProcessor();

    if (isThereStandaloneTasks) {
      document.getElementById('standaloneFilter').addEventListener('change', function(e) {
        standaloneFilter = e.target.checked;
        gantt.refreshData();
      });
    }
    
    document.querySelectorAll(".state-checkbox").forEach(function(checkbox) {
        checkbox.onchange = function(e) {
          stateFilter[e.target.id] = !stateFilter[e.target.id];
          gantt.refreshData();
        };
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
      if (!standaloneFilter && !gantt.hasChild(task.id) && task.type !== "project" && task.parent == 0 ) {
        match = false;
      }

      return match;
    }

    gantt.attachEvent("onBeforeTaskDisplay", function (id, task) {
      let thereIsAlmostOneFilterFalse = false;
      for (const state in stateFilter) {
        if (!stateFilter[state]) {
          thereIsAlmostOneFilterFalse = true;
          break;
        }
      }

      if (!filterValue && !thereIsAlmostOneFilterFalse && standaloneFilter) {
        return true;
    }
        return filterLogic(task);
    });
  
    gantt.$root.appendChild(legend);
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

.opened {
    background-color: #168af0;
}

.closed {
    background-color: #28bf2d;
}

.in-progress {
    background-color: #eda30e;
}

.late {
    background-color: #e32222;
}

.unscheduled {
    background-color: grey;
}

.folder {
    background-color: #4f4e4e;
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
    padding: 0.5rem 1rem;
    background-color: #168af0;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
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

</style>
