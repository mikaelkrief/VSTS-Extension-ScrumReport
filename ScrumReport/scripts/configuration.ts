/// <reference path='../typings/tsd.d.ts' />
"use strict";


export class Configuration {
    widgetConfigurationContext = null;

    $select = $('select');

    constructor(public WidgetHelpers) {

    }



    public load(widgetSettings, widgetConfigurationContext) {
        var _that = this;
        this.widgetConfigurationContext = widgetConfigurationContext;

        this.$select
            .change(() => {
                this.widgetConfigurationContext.notify(this.WidgetHelpers.WidgetEvent.ConfigurationChange,
                    this.WidgetHelpers.WidgetEvent.Args(this.getCustomSettings()));
            });
        return this.WidgetHelpers.WidgetStatusHelper.Success();
    }

    public getCustomSettings() {
        var result = JSON.stringify("");
        return result;
    }

    public onSave() {
        var customSettings = { data: JSON.stringify("") };
        return this.WidgetHelpers.WidgetConfigurationSave.Valid(customSettings);    
    }
}


VSS.require(["TFS/Dashboards/WidgetHelpers"], (WidgetHelpers) => {
    VSS.register("scrumreportwidget.Configuration", () => {
        var configuration = new Configuration(WidgetHelpers);
        return configuration;

    })

    VSS.notifyLoadSucceeded();
});

