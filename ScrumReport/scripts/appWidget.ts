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

