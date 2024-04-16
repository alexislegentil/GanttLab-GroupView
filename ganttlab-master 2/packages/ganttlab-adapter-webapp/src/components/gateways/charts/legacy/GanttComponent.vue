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
    {unit: "day", step: 1, format: "%j, %D"}
    ];
    gantt.config.fit_tasks = true;
    gantt.config.columns = [
    {name: "name", label: "Task name", tree: true, width: 170, tree : true, resize: true, editor: textEditor },
    {name: "start_date", label: "Start time", align: "center", width: 150 , resize: true, editor: dateEditor},
    {name: "duration", label: "Duration", align: "center", width: 50, editor: durationEditor},
    {name: "user", label: "User", align: "center", width: 100, editor: usersEditor}
    ];
    gantt.templates.task_text = function(start, end, task) {
      return "<b>Name:</b> " + task.name + (task.user ? ",<b> Holders:</b> " + task.user : "");
    };
    gantt.templates.tooltip_text = function(start, end, task) {
    // Personnalisez ici le texte du tooltip pour chaque tâche
    return "<b>" + task.name + "</b><br/>" + "Start: " + gantt.templates.tooltip_date_format(start) + "<br/>" + "End: " + gantt.templates.tooltip_date_format(end) + "<br/>" + (task.user ? "User: " + task.user + "<br/>" : "") + (task.duration ? "Duration: " + task.duration + " days" : "");
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
    @import "../../../../../../../node_modules/dhtmlx-gantt/codebase/dhtmlxgantt.css";
</style>
