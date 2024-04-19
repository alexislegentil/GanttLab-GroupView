<template>
  <div ref="ganttContainer" style="height: 80vh;"></div>
</template>
 
<script>
import {gantt} from 'dhtmlx-gantt';

var dateToStr = gantt.date.date_to_str(gantt.config.task_date);

var dateEditor = {type: "date", map_to: "start_date"};
var durationEditor = {type: "number", map_to: "duration", min:0, max: 100};

var stateEditor = {type: "select", options: [
        {key: "Opened", label: "Opened"},
        {key: "Closed", label: "Closed"},
        {key: "InProgress", label: "In progress"},
        {key: "Late", label: "Late"},
        {key: "Unscheduled", label: "Unscheduled"}
    ], map_to: "state"};

let undoBtn = document.createElement('button');
undoBtn.className = 'gantt-undo';
undoBtn.textContent = 'Undo';
undoBtn.onclick = function(){
    gantt.undo();
};

let redoBtn = document.createElement('button');
redoBtn.className = 'gantt-redo';
redoBtn.textContent = 'Redo';
redoBtn.onclick = function(){
    gantt.redo();
};

let controlsDiv = document.createElement('div');
controlsDiv.className = 'gantt-controls';
controlsDiv.appendChild(undoBtn);
controlsDiv.appendChild(redoBtn);


let legend = document.createElement('div');
legend.className = 'gantt-legend';
legend.id = 'gantt-legend';

let header = document.createElement('header');
header.className = 'legend-head';

let h3 = document.createElement('h3');
h3.textContent = 'Legend';

header.appendChild(h3);
legend.appendChild(header);

let legendList = document.createElement('div');
legendList.className = 'legend-list';

let states = ['Opened', 'Closed', 'In progress', 'Late', 'Unscheduled', 'folder'];
let descriptions = ['Opened issues', 'Closed issues', 'In progress', 'Late issues', 'Unscheduled', 'Parent'];

for (let i = 0; i < states.length; i++) {
  let row = document.createElement('div');
  row.className = 'legend-row';

  let label = document.createElement('div');
  label.className = 'legend-label ' + states[i].toLowerCase().replace(' ', '-');

  let description = document.createElement('div');
  description.textContent = descriptions[i];

  row.appendChild(label);
  row.appendChild(description);
  legendList.appendChild(row);
}

legend.appendChild(legendList);



var daysStyle = function(date){
    var dateToStr = gantt.date.date_to_str("%D");
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
 
  mounted: function () {

    gantt.plugins({ 
        marker: true,
        multiselect: true ,
        tooltip: true ,
        undo: true
    }); 

    gantt.config.undo = true;
    gantt.config.redo = true;

    gantt.config.date_format = "%Y-%m-%d";

    gantt.config.scales = [
      {unit: "month", step: 1, format: "%F, %Y"},
      {unit: "day", step: 1, format: "%j, %D",  css:daysStyle}  
    ];
    gantt.config.fit_tasks = true;

    gantt.config.columns = [
      {name: "name", label: "Task name", tree: true, width: 170, tree : true, resize: true },
      {name: "start_date", label: "Start time", align: "center", width: 150 , resize: true, editor: dateEditor},
      {name: "duration", label: "Duration", align: "center", width: 50, editor: durationEditor},
      {name: "user", label: "User", align: "center", width: 100},
      {name: "state", label: "State", align: "center", width: 100, editor: stateEditor}
    ];

    gantt.config.lightbox.sections = [
      {name: "name", label: "Name", height:30, map_to:"name", type:"textarea", focus:true},
      {name:"state",    height:22, map_to:"state", type:"select", options: stateEditor.options},
      {name: "time", height:72, map_to:"auto", type:"duration"}
    ];

    gantt.config.lightbox.project_sections = [
      {name: "name", label: "Name", height:30, map_to:"name", type:"textarea", focus:true},
      {name: "time", height:72, map_to:"auto", type:"duration"}
    ];

    gantt.locale.labels.section_name = "Title";
    gantt.locale.labels.section_state = "State";

    gantt.config.lightbox.project_sections.allow_root = false;


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
      var css = "";

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
    gantt.config.links = false;

    gantt.addMarker({
      start_date: new Date(), //a Date object that sets the marker's date
      css: "today", //a CSS class applied to the marker
      text: "Now", //the marker title
      title: dateToStr( new Date()) // the marker's tooltip
    });

    if (this.$props.tasks.data.length < 50) {
      gantt.config.open_tree_initially = true;   //if more than 50 tasks, tasks will be closed by default
    }
    

    gantt.init(this.$refs.ganttContainer);
    gantt.parse(this.$props.tasks);

    gantt.$root.appendChild(controlsDiv);
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

.gantt_row.gantt_row_project{
   background-color:#bbbbbb;
   font-weight: bold;
}


.weekend{
        background: rgba(0, 0, 0, 0.10) !important;
}

.gantt-controls {
    position: absolute;
    bottom: 2rem;
    left: 2rem;
    font-family: Arial, Helvetica, sans-serif;
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
