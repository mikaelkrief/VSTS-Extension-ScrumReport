//---------------------------------------------------------------------
// <copyright file="app.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF 
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
// <summary>TypeScript file for Widget Scrum report extension</summary>
//---------------------------------------------------------------------

/// <reference path='../node_modules/vss-sdk/typings/VSS.d.ts' />

import ScrumReport = require("scripts/app");


VSS.require("TFS/Dashboards/WidgetHelpers", function (WidgetHelpers) {
    VSS.register("scrumreportwidget", function () {
        return {
            load: function (widgetSettings) {

                var scrumReport = new ScrumReport.ScrumReport();
                scrumReport.LoadWidget();


                return WidgetHelpers.WidgetStatusHelper.Success();

            },
            reload: function (widgetSettings) {

                var scrumReport = new ScrumReport.ScrumReport();
                scrumReport.LoadWidget();


                return WidgetHelpers.WidgetStatusHelper.Success();

            }
        }
    });
    VSS.notifyLoadSucceeded();
});

