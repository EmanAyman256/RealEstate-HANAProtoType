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

    return Controller.extend("dboperations.controller.Projects", {
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

        _onRouteMatched: function () {
            this._loadProjects();
        },

        _loadProjects: function () {
            var oModel = new sap.ui.model.json.JSONModel();
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

        onNavigateToAddProject: function () {
            if (!this._oAddDialog) {
                var oNewProjectModel = new sap.ui.model.json.JSONModel({
                    projectId: "",
                    projectDescription: "",
                    companyCodeId: "",
                    companyCodeDescription: "",
                    validFrom: "",
                    validTo: "",
                    location: "",
                    businessArea: "",
                    profitCenter: "",
                    functionalArea: "",
                    supplementaryText: ""
                });

                this._oAddDialog = new sap.m.Dialog({
                    title: "Add New Project",
                    content: new sap.ui.layout.form.SimpleForm({
                        editable: true,
                        content: [
                            new sap.m.Label({ text: "Project ID" }),
                            new sap.m.Input({ value: "{/projectId}" }),

                            new sap.m.Label({ text: "Description" }),
                            new sap.m.Input({ value: "{/projectDescription}" }),

                            new sap.m.Label({ text: "Company Code" }),
                            new sap.m.Input({ value: "{/companyCodeId}" }),

                            new sap.m.Label({ text: "Company Code Description" }),
                            new sap.m.Input({ value: "{/companyCodeDescription}" }),

                            new sap.m.Label({ text: "Valid From" }),
                            new sap.m.DatePicker({
                                value: "{/validFrom}",
                                displayFormat: "long",       // user sees: Oct 7, 2025
                                valueFormat: "yyyy-MM-dd",   // backend: 2025-10-07
                                placeholder: "Select a date",// shows empty until chosen
                                showClearIcon: true          // lets user clear the field
                            }),
                            new sap.m.Label({ text: "Valid To" }),
                            new sap.m.DatePicker({
                                value: "{/validTo}",
                                displayFormat: "long",
                                valueFormat: "yyyy-MM-dd",
                                placeholder: "Select a date",
                                showClearIcon: true
                            }),
                            new sap.m.Label({ text: "Location" }),
                            new sap.m.Input({ value: "{/location}" }),

                            new sap.m.Label({ text: "Business Area" }),
                            new sap.m.StepInput({
                                value: "{/businessArea}",
                                min: 0,
                                step: 1
                            }),

                            new sap.m.Label({ text: "Profit Center" }),
                            new sap.m.StepInput({
                                value: "{/profitCenter}",
                                min: 0,
                                step: 1
                            }),
                            new sap.m.Label({ text: "Functional Area" }),
                            new sap.m.StepInput({
                                value: "{/functionalArea}",
                                min: 0,
                                step: 1
                            }),
                            new sap.m.Label({ text: "Supplementary Text" }),
                            new sap.m.Input({ value: "{/supplementaryText}" })
                        ]
                    }),
                    beginButton: new sap.m.Button({
                        text: "Save",
                        type: "Emphasized",
                        press: function () {
                            var oData = this._oAddDialog.getModel().getData();
                            // if (oData.validFrom) {
                            //     oData.validFrom = new Date(oData.validFrom).toISOString().split("T")[0];
                            // }
                            // if (oData.validTo) {
                            //     oData.validTo = new Date(oData.validTo).toISOString().split("T")[0];
                            // }
                            if (oData.validFrom) {
                                oData.validFrom = oData.validFrom; // already "YYYY-MM-DD"
                            }
                            if (oData.validTo) {
                                oData.validTo = oData.validTo;
                            }
                            fetch("/odata/v4/real-estate/Projects", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(oData)
                            })
                                .then(response => {
                                    if (!response.ok) {
                                        throw new Error("Failed to create project");
                                    }
                                    return response.json();
                                })
                                .then(() => {
                                    sap.m.MessageToast.show("Project created!");
                                    this._loadProjects();
                                    this._oAddDialog.close();
                                })
                                .catch(err => {
                                    sap.m.MessageBox.error("Error: " + err.message);
                                });
                        }.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () {
                            this._oAddDialog.close();
                        }.bind(this)
                    })
                });

                this._oAddDialog.setModel(oNewProjectModel);
                this.getView().addDependent(this._oAddDialog);
            }
            this._oAddDialog.open();
        },


        onDetails: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            if (!oBindingContext) {
                return;
            }

            var oData = oBindingContext.getObject();
            var oDialogModel = new sap.ui.model.json.JSONModel({
                ProjectId: oData.projectId,
                Description: oData.projectDescription,
                CompanyCode: oData.companyCodeId,
                companyCodeDescription: oData.companyCodeDescription,
                projectDescription: oData.projectDescription,
                validFrom: oData.validFrom,
                validTo: oData.validTo,
                location: oData.location,
                businessArea: oData.businessArea,
                profitCenter: oData.profitCenter,
                functionalArea: oData.functionalArea,
                supplementaryText: oData.supplementaryText
            });

            if (!this._oDetailsDialog) {
                this._oDetailsDialog = new sap.m.Dialog({
                    title: "Project Details",
                    content: new sap.ui.layout.form.SimpleForm({
                        editable: false,
                        content: [
                            new sap.m.Label({ text: "Project ID:" }),
                            new sap.m.Text({ text: "{/ProjectId}" }),

                            new sap.m.Label({ text: "Description:" }),
                            new sap.m.Text({ text: "{/Description}" }),

                            new sap.m.Label({ text: "Company Code:" }),
                            new sap.m.Text({ text: "{/CompanyCode}" }),

                            new sap.m.Label({ text: "From:" }),
                            new sap.m.Text({ text: "{/validFrom}" }),

                            new sap.m.Label({ text: "To:" }),
                            new sap.m.Text({ text: "{/validTo}" }),

                            new sap.m.Label({ text: "location:" }),
                            new sap.m.Text({ text: "{/location}" }),

                            new sap.m.Label({ text: "Business Area:" }),
                            new sap.m.Text({ text: "{/businessArea}" }),

                            new sap.m.Label({ text: "Profit Center:" }),
                            new sap.m.Text({ text: "{/profitCenter}" }),

                            new sap.m.Label({ text: "Functional Area:" }),
                            new sap.m.Text({ text: "{/functionalArea}" }),

                            new sap.m.Label({ text: "Supplementary Text:" }),
                            new sap.m.Text({ text: "{/supplementaryText}" }),
                        ]
                    }),
                    endButton: new sap.m.Button({
                        text: "Ok",
                        type: "Emphasized",
                        press: function () {
                            this._oDetailsDialog.close();
                        }.bind(this)
                    })
                });

                this.getView().addDependent(this._oDetailsDialog);
            }
            this._oDetailsDialog.setModel(oDialogModel);
            this._oDetailsDialog.open();
        },

        onDelete: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            if (oBindingContext) {
                var sPath = oBindingContext.getPath();
                var oModel = this.getView().byId("projectsTable").getModel();
                var oItem = oModel.getProperty(sPath);

                if (!oItem) {
                    sap.m.MessageBox.error("Could not find model data for deletion.");
                    return;
                }

                MessageBox.confirm("Are you sure you want to delete " + oItem.projectId + "?", {
                    title: "Confirm Deletion",
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            fetch(`/odata/v4/real-estate/Projects(projectId='${oItem.projectId}')`, {
                                method: "DELETE"
                            })
                                .then(response => {
                                    if (!response.ok) {
                                        throw new Error("Failed to delete: " + response.statusText);
                                    }

                                    var aRecords = oModel.getProperty("/Projects");
                                    var iIndex = aRecords.findIndex(st => st.projectId === oItem.projectId);
                                    if (iIndex > -1) {
                                        aRecords.splice(iIndex, 1);
                                        oModel.setProperty("/Projects", aRecords);
                                    }

                                    sap.m.MessageToast.show("Project deleted successfully!");
                                })
                                .catch(err => {
                                    console.error("Error deleting Project:", err);
                                    sap.m.MessageBox.error("Error: " + err.message);
                                });
                        }
                    }
                });
            }
        }
        ,
        onEditProject: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            if (!oBindingContext) return;

            var oData = oBindingContext.getObject();

            var oDialogModel = new sap.ui.model.json.JSONModel(Object.assign({}, oData));

            if (!this._oEditDialog) {
                this._oEditDialog = new sap.m.Dialog({
                    title: "Edit Project",
                    content: new sap.ui.layout.form.SimpleForm({
                        editable: true,
                        content: [
                            new sap.m.Label({ text: "Project ID" }),
                            new sap.m.Input({ value: "{/projectId}", editable: false }), // ID not editable

                            new sap.m.Label({ text: "Description" }),
                            new sap.m.Input({ value: "{/projectDescription}" }),

                            new sap.m.Label({ text: "Company Code" }),
                            new sap.m.Input({ value: "{/companyCodeId}" }),

                            new sap.m.Label({ text: "Company Code Description" }),
                            new sap.m.Input({ value: "{/companyCodeDescription}" }),

                            new sap.m.Label({ text: "Valid From" }),
                            new sap.m.DatePicker({
                                value: "{/validFrom}",
                                displayFormat: "long",       // user sees: Oct 7, 2025
                                valueFormat: "yyyy-MM-dd",   // backend: 2025-10-07
                                placeholder: "Select a date",// shows empty until chosen
                                showClearIcon: true          // lets user clear the field
                            }),
                            new sap.m.Label({ text: "Valid To" }),
                            new sap.m.DatePicker({
                                value: "{/validTo}",
                                displayFormat: "long",
                                valueFormat: "yyyy-MM-dd",
                                placeholder: "Select a date",
                                showClearIcon: true
                            }),
                            new sap.m.Label({ text: "Location" }),
                            new sap.m.Input({ value: "{/location}" }),

                            new sap.m.Label({ text: "Business Area" }),
                            new sap.m.StepInput({ value: "{/businessArea}", min: 0, step: 1 }),

                            new sap.m.Label({ text: "Profit Center" }),
                            new sap.m.StepInput({ value: "{/profitCenter}", min: 0, step: 1 }),

                            new sap.m.Label({ text: "Functional Area" }),
                            new sap.m.StepInput({ value: "{/functionalArea}", min: 0, step: 1 }),

                            new sap.m.Label({ text: "Supplementary Text" }),
                            new sap.m.Input({ value: "{/supplementaryText}" })
                        ]
                    }),
                    beginButton: new sap.m.Button({
                        text: "Save",
                        type: "Emphasized",
                        press: function () {
                            var oUpdatedData = this._oEditDialog.getModel().getData();

                            // handle dates properly
                            if (oUpdatedData.validFrom) {
                                oUpdatedData.validFrom = new Date(oUpdatedData.validFrom).toISOString().split("T")[0];
                            }
                            if (oUpdatedData.validTo) {
                                oUpdatedData.validTo = new Date(oUpdatedData.validTo).toISOString().split("T")[0];
                            }

                            fetch(`/odata/v4/real-estate/Projects(projectId='${oUpdatedData.projectId}')`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(oUpdatedData)
                            })
                                .then(response => {
                                    if (!response.ok) throw new Error("Update failed");
                                    return response.json();
                                })
                                .then(() => {
                                    sap.m.MessageToast.show("Project updated successfully!");
                                    this._loadProjects();
                                    this._oEditDialog.close();
                                })
                                .catch(err => sap.m.MessageBox.error("Error: " + err.message));
                        }.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () {
                            this._oEditDialog.close();
                        }.bind(this)
                    })
                });

                this.getView().addDependent(this._oEditDialog);
            }

            this._oEditDialog.setModel(oDialogModel);
            this._oEditDialog.open();
        },

    });
});
