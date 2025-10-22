sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageBox, Dialog, Input, Button, Label, VBox, JSONModel) {
    "use strict";

    return Controller.extend("dboperations.controller.Reservations", {
      onInit: function () {
            this.getOwnerComponent().getRouter()
                .getRoute("Projects")
                .attachPatternMatched(this._onRouteMatched, this);

            var oModel = new sap.ui.model.json.JSONModel({
                Projects: [],
            });
            this.getView().setModel(oModel, "view");

            // Fetch data from CAP OData service
            var oModel = new JSONModel();
            fetch("/odata/v4/real-estate/Projects")
                .then(response => response.json())
                .then(data => {
                    oModel.setData({ Projects: data.value });
                    this.getView().byId("projectsTable").setModel(oModel);
                })
                .catch(err => {
                    console.error("Error fetching projects", err);
                });
        },


    });
});
