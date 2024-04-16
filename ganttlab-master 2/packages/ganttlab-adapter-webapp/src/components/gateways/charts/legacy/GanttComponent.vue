<template>
  <div ref="ganttContainer"></div>
</template>
 
<script>
import {gantt} from 'dhtmlx-gantt';

var dateToStr = gantt.date.date_to_str(gantt.config.task_date);
var textEditor = {type: "text", map_to: "name"};
var dateEditor = {type: "date", map_to: "start_date"};
var durationEditor = {type: "number", map_to: "duration", min:0, max: 100};
var usersEditor = {type: "text", map_to: "user"};

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
    console.log(this.tasks);
    gantt.plugins({ 
        marker: true,
        multiselect: true ,
        tooltip: true 
    }); 
    gantt.config.date_format = "%Y-%m-%d";
    gantt.config.scales = [
    {unit: "month", step: 1, format: "%F, %Y"},
    {unit: "day", step: 2, format: "%j, %D"}
    ];
    gantt.config.fit_tasks = true;
    gantt.config.columns = [
    {name: "name", label: "Task name", tree: true, width: 170, tree : true, resize: true, editor: textEditor },
    {name: "start_date", label: "Start time", align: "center", width: 150 , resize: true, editor: dateEditor},
    {name: "duration", label: "Duration", align: "center", width: 50, editor: durationEditor},
    {name: "user", label: "User", align: "center", width: 100, editor: usersEditor},
    {name: "state", label: "State", align: "center", width: 100,
     editor: {type: "select", options: [
        {key: "1", label: "Opened"},
        {key: "2", label: "Closed"},
        {key: "3", label: "In progress"},
        {key: "4", label: "Late"},
        {key: "5", label: "Unscheduled"}
    ]}}
    ];
    gantt.templates.task_text = function(start, end, task) {
      return "<b>Name:</b> " + task.name + (task.user ? ",<b> Holders:</b> " + task.user : "");
    };
    gantt.templates.tooltip_text = function(start, end, task) {
    // Personnalisez ici le texte du tooltip pour chaque tâche
    return "<b>" + task.name + "</b><br/>" + "Start: " + gantt.templates.tooltip_date_format(start) + "<br/>" + "End: " + gantt.templates.tooltip_date_format(end) + "<br/>" + (task.user ? "User: " + task.user + "<br/>" : "") + (task.duration ? "Duration: " + task.duration + " days" : "");
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
    gantt.addMarker({
      start_date: new Date(), //a Date object that sets the marker's date
      css: "today", //a CSS class applied to the marker
      text: "Now", //the marker title
      title: dateToStr( new Date()) // the marker's tooltip
    });

    
    gantt.init(this.$refs.ganttContainer);
    gantt.parse(this.$props.tasks);
  }
}
</script>
 
<style>
    @import "../../../../../../../node_modules/dhtmlx-gantt/codebase/skins/dhtmlxgantt_broadway.css";

/* common styles for overriding borders/progress color */
.gantt_task_line{
        border-color: rgba(0, 0, 0, 0.25);
    }
    .gantt_task_line .gantt_task_progress {
        background-color: rgba(0, 0, 0, 0.25);
    }

.gantt_task_line.opened {
    background-color: #168af0;
}

.gantt_task_line.closed {
    background-color: #28bf2d;
}

.gantt_task_line.in-progress {
    background-color: #eda30e;
}

.gantt_task_line.late {
    background-color: #e32222;
}

.gantt_task_line.unscheduled {
    background-color: grey;
}

</style>
