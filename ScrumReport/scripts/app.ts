
//---------------------------------------------------------------------
// <copyright file="app.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF 
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
// <summary>TypeScript file for Scrum report extension</summary>
//---------------------------------------------------------------------

/// <reference path='../node_modules/vss-sdk/typings/VSS.d.ts' />




import Service = require("VSS/Service");
import Core_Client = require("TFS/Core/RestClient");
import Core_Contracts = require("TFS/Core/Contracts");
import Core_Contacts = require("VSS/WebApi/Contracts");
import Work_Client = require("TFS/Work/RestClient");
import RestClient = require("TFS/WorkItemTracking/RestClient");
import Work_WorkItemTrackingContracts = require("TFS/WorkItemTracking/Contracts");
import Utils_String = require("VSS/Utils/String");
import Controls = require("VSS/Controls");
import Grids = require("VSS/Controls/Grids");
import Q = require("q");


var QueryName = "Shared Queries/Scrum Report";
var CurrentProject = VSS.getWebContext().project.name;

var projectTemplate: string;

function GetProjectTemplate(): IPromise<string> {
    var deferred = Q.defer<string>();
    var client = Core_Client.getClient();
    client.getProject(VSS.getWebContext().project.id, true).then((q: Core_Contracts.TeamProject) => {
        var processT = q.capabilities["processTemplate"];
        deferred.resolve(processT["templateName"]);
    });

    return deferred.promise;
}

//retrieve list of all Wi id that as return by the query
function GetListWiId(): IPromise<Work_WorkItemTrackingContracts.WorkItem[]> {

    var client = RestClient.getClient();

    var p1 = Q.Promise((resolve: any, reject) => {
        //get the query id
        client.getQuery(CurrentProject, QueryName).then((q: Work_WorkItemTrackingContracts.QueryHierarchyItem) => {
            var QueryId = q.id;
            //get the result of the query
            
            client.queryById(QueryId).then((q: Work_WorkItemTrackingContracts.WorkItemQueryResult) => {
                var listeId: number[] = [];
                //push all id the array
                q.workItems.forEach((wiRef: Work_WorkItemTrackingContracts.WorkItemReference) => {
                    listeId.push(wiRef.id);
                });
                if (listeId.length > 0) {
                    client.getWorkItems(listeId).then((listeWI: Work_WorkItemTrackingContracts.WorkItem[]) => {
                        resolve(listeWI);
                    });
                } else {
                    reject(Error("listeId is Empty"));
                }
            });
        },
            function (r) {
                console.log(r);
                if (r.message.indexOf("TF401243") == 0) {//if the query is not created
                    //TODO: if the query is not created => create the query
                    CreateQuery();
                    document.getElementById("content").innerHTML = "<strong>The query 'Scrum Report' as created in the root on Shared Queries folder.<br />Refresh this page for view the result.</strong>";
                }
            });
    });
    return p1;
}

//create the query
function CreateQuery() {
    var client = RestClient.getClient();
    var queryWiql: string;
    switch (projectTemplate) {
        case "Scrum":
            queryWiql = "SELECT [System.Id], [System.WorkItemType], [System.Title], [System.AssignedTo], [System.State], [System.Tags], [Microsoft.VSTS.Common.StateChangeDate] FROM WorkItems WHERE [System.TeamProject] = @project and [System.WorkItemType] <> '' and [Microsoft.VSTS.Common.StateChangeDate] >= @today - 1 and [System.State] IN ('In Progress', 'Done', 'New', 'Open') ORDER BY [System.AssignedTo], [System.Id]";
            break;
        case "Agile":
            queryWiql = "SELECT [System.Id], [System.WorkItemType], [System.Title], [System.AssignedTo], [System.State], [System.Tags], [Microsoft.VSTS.Common.StateChangeDate] FROM WorkItems WHERE [System.TeamProject] = @project and [System.WorkItemType] <> '' and [Microsoft.VSTS.Common.StateChangeDate] >= @today - 1 and [System.State] IN ('Active', 'Closed', 'New') ORDER BY [System.AssignedTo], [System.Id]";
            break;
        case "CMMI":
            queryWiql = "SELECT [System.Id], [System.WorkItemType], [System.Title], [System.AssignedTo], [System.State], [System.Tags], [Microsoft.VSTS.Common.StateChangeDate] FROM WorkItems WHERE [System.TeamProject] = @project and [System.WorkItemType] <> '' and [Microsoft.VSTS.Common.StateChangeDate] >= @today - 1 and [System.State] IN ('Active', 'Closed', 'Proposed') ORDER BY [System.AssignedTo], [System.Id]";
            break;
    }

    var newQuery = <Work_WorkItemTrackingContracts.QueryHierarchyItem>{};
    newQuery.name = "Scrum Report";
    newQuery.path = "Shared Queries/";
    newQuery.wiql = queryWiql;
    newQuery.queryType = Work_WorkItemTrackingContracts.QueryType.Flat;

    client.createQuery(newQuery, CurrentProject, "Shared Queries/").then((t) => {
        //console.log(t);
    },
        function (f) {
            document.getElementById("content").innerHTML = "Error the query is not found :<br />Create the query 'Scrum Report' on the root on Shared Queries folder";
        }
    );
}

//construct array with distinct member with as in the result of the query
function GetAllTeamMembers(wi: IPromise<Work_WorkItemTrackingContracts.WorkItem[]>): IPromise<string[]> {
    var deferred = Q.defer<string[]>();
    var ret: string[] = [];
    listeIdWi.then((wiRef: Work_WorkItemTrackingContracts.WorkItem[]) => {

        var f = wiRef.filter((e: Work_WorkItemTrackingContracts.WorkItem) => {
            return e.fields["System.AssignedTo"] != "";
        });

        f.forEach((w: Work_WorkItemTrackingContracts.WorkItem) => {

            if (w.fields["System.AssignedTo"] != undefined) {
                if (ret.indexOf(w.fields["System.AssignedTo"]) < 0) {
                    ret.push(w.fields["System.AssignedTo"]);
                }
            }
        });
        deferred.resolve(ret);
    }, function (r) {
        //here the message that indicate no results
        document.getElementById("content").innerHTML = "There is no information for the current Report for this day.";
    });
    return deferred.promise;
}

function GetMemberAvatar() {
    var deferred = Q.defer<Core_Contacts.IdentityRef[]>();
    var client = Core_Client.getClient();
    var project = VSS.getWebContext().project.id;
    client.getTeams(project).then((val) => {
        client.getTeamMembers(VSS.getWebContext().project.id, VSS.getWebContext().team.id).then((t) => {
            deferred.resolve(t);
        });
    });
    return deferred.promise;
}

//Main
//Get the template project
GetProjectTemplate().then((pt: string) => {
    projectTemplate = pt;
});
var listeIdWi: IPromise<Work_WorkItemTrackingContracts.WorkItem[]>;
listeIdWi = GetListWiId();


Q.all([GetAllTeamMembers(listeIdWi), GetMemberAvatar()]).then((values: any[]) => {
    var tm: string[] = values[0];
    var avatars: Core_Contacts.IdentityRef[] = values[1];

    //Filter by state
    var wiState: string[];
    switch (projectTemplate) {
        case "Scrum":
            wiState = ["Done", "In Progress", "New", "Open"]; //Open for Impediment
            break;
        case "Agile":
            wiState = ["Closed", "Active", "New"];
            break;
        case "CMMI":
            wiState = ["Closed", "Active", "Proposed"];
            break;
    }

    listeIdWi.then((wiRef: Work_WorkItemTrackingContracts.WorkItem[]) => {
        var resultHTML: string = "";
        var counter = 0;

        var counterMember = 0;
        var allData = [];
        //for each team member
        var _currentMember;
        tm.forEach((t: string) => {
            _currentMember = t;

            var filterByMember = wiRef.filter((e: Work_WorkItemTrackingContracts.WorkItem) => { return e.fields["System.AssignedTo"] == t });
            var showMemberName = false;

            var counter2 = 0;
            //for each wi state
            wiState.forEach((_wit: string) => {
                
                //list for the member and by type
                var filtreByType = filterByMember.filter((e: Work_WorkItemTrackingContracts.WorkItem) => { return e.fields["System.State"] == _wit });
                if (filtreByType.length > 0) {
                    var data = [];
                   
                    //add wi in array for grid
                    filtreByType.forEach((tm: Work_WorkItemTrackingContracts.WorkItem) => {
                        data.push({
                            "workItemId": tm.id,
                            "type": tm.fields["System.WorkItemType"],
                            "title": tm.fields["System.Title"]
                        });
                    });

                    allData.push(data);
                    if (counter2 == 0) {
                        var user = avatars.filter((a) => { return a.displayName + " <" + a.uniqueName + ">" == t });
                        var avatar: string;
                        if (user != undefined) {
                            avatar = user[0].imageUrl;
                        }
                        var htmlimgAvatar = "<img src=" + avatar + " height='22px' width='22px' style='vertical-align:middle'/>";

                        if (counterMember == 0) {
                            //height:300px
                            resultHTML += "<div>" + htmlimgAvatar + " <strong>" + t + "</strong><div><br />";
                        } else {

                            resultHTML += "<div style='border-top:2px solid #CBC7C9;padding-top:10px;'>" + htmlimgAvatar + " <strong>" + t + "</strong><div><br />";
                        }
                    }
                    if (_wit != "Open") {
                        resultHTML += "<div class='grid-caption' style='padding-bottom:15px;' id='grid" + counter + "'><strong>" + _wit + "</strong></div>";
                    } else {
                        resultHTML += "<div class='grid-caption' style='padding-bottom:15px;' id='grid" + counter + "'><strong>Impediments</strong></div>";
                    }
                    document.getElementById("content").innerHTML += resultHTML;


                    counter2++;
                    counter++;
                }
                resultHTML = "";
            });
            counterMember++;
        });

        //at the end (innerHTML is complete) show all grid
        var c = 0;
        allData.forEach((ad) => {

            var heightG = 28 + (30 * ad.length);
            var h: string;
            h = heightG.toString() + "px";


            var gridOptions: Grids.IGridOptions = {
                height: h,
                source: ad,
                columns: [
                    { text: "Id", index: "workItemId", width: 100 },
                    { text: "Type", index: "type", width: 100 },
                    { text: "Title", index: "title", width: 250 }
                ]
            };

            var grid = Controls.create<Grids.Grid, Grids.IGridOptions>(Grids.Grid, $("#grid" + c.toString()), gridOptions);

            //double click action for open the wi details on new window
            grid.onRowDoubleClick = function () {
                var index = grid.getSelectedRowIndex();
                var datas = grid.getRowData(index);

                var wiUrl = VSS.getWebContext().host.uri + "/" + CurrentProject + "/_workitems#_a=edit&id=" + datas.workItemId + "&fullScreen=true";
                window.open(wiUrl, '_blank');
            }
            c++;

        });

    });
},
    function (r) {
        console.log(r);
    }
);

VSS.notifyLoadSucceeded();
       
       
