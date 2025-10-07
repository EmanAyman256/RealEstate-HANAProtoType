sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/m/MessageToast",

    "sap/ui/model/json/JSONModel"],
    (Controller, MessageBox, Dialog, Input, Button, Label, VBox,MessageToast, JSONModel) => {
        "use strict";
        return Controller.extend("dboperations.controller.Buildings", {
            onInit() {
                this.getOwnerComponent().getRouter()
                    .getRoute("Buildings")
                    .attachPatternMatched(this._onRouteMatched, this);

                var oModel = new sap.ui.model.json.JSONModel({
                    Buildings: [],
                });
                this.getView().setModel(oModel, "view");

                var oModel = new JSONModel();
                fetch("/odata/v4/real-estate/Buildings")
                    .then(response => response.json())
                    .then(data => {
                        oModel.setData({ Buildings: data.value });
                        this.getView().byId("BuildingsTable").setModel(oModel);
                    })
                    .catch(err => {
                        console.error("Error fetching Buildings", err);
                    });
            },
            _onRouteMatched: function () {
                this._loadBuildings();
            },
            _loadBuildings: function () {
                var oModel = new sap.ui.model.json.JSONModel();
                fetch("/odata/v4/real-estate/Buildings")
                    .then(response => response.json())
                    .then(data => {
                        oModel.setData({ Buildings: data.value });
                        this.getView().byId("BuildingsTable").setModel(oModel);
                    })
                    .catch(err => {
                        console.error("Error fetching Buildings ", err);
                    });
            },
            onAddBuilding: function () {
                if (!this._oAddDialog) {
                    var oNewBuildingModel = new sap.ui.model.json.JSONModel({
                        buildingId: "",
                        buildingDescription: "",
                        buildingOldCode: "",
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
                    });

                    this._oAddDialog = new sap.m.Dialog({
                        title: "Add New Project",
                        content: new sap.ui.layout.form.SimpleForm({
                            editable: true,
                            content: [
                                new sap.m.Label({ text: "Building ID" }),
                                new sap.m.Input({ value: "{/buildingId}" }),

                                new sap.m.Label({ text: "Building Description" }),
                                new sap.m.Input({ value: "{/buildingDescription}" }),

                                new sap.m.Label({ text: "Building Old Code" }),
                                new sap.m.Input({ value: "{/buildingOldCode}" }),

                                new sap.m.Label({ text: "Project ID" }),
                                new sap.m.Input({ value: "{/projectId}" }),

                                new sap.m.Label({ text: "Project Description" }),
                                new sap.m.Input({ value: "{/projectDescription}" }),

                                new sap.m.Label({ text: "Company Code" }),
                                new sap.m.Input({ value: "{/companyCodeId}" }),

                                new sap.m.Label({ text: "Company Code Description" }),
                                new sap.m.Input({ value: "{/companyCodeDescription}" }),

                                new sap.m.Label({ text: "Valid From" }),
                                new sap.m.DatePicker({ value: "{/validFrom}" }),

                                new sap.m.Label({ text: "Valid To" }),
                                new sap.m.DatePicker({ value: "{/validTo}" }),

                                new sap.m.Label({ text: "Location" }),
                                new sap.m.Input({ value: "{/location}" }),

                                new sap.m.Label({ text: "Business Area" }),
                                new sap.m.Input({ value: "{/businessArea}" }),

                                new sap.m.Label({ text: "Profit Center" }),
                                new sap.m.Input({ value: "{/profitCenter}" }),

                                new sap.m.Label({ text: "Functional Area" }),
                                new sap.m.Input({ value: "{/functionalArea}" }),
                            ]
                        }),
                        beginButton: new sap.m.Button({
                            text: "Save",
                            type: "Emphasized",
                            press: function () {
                                var oData = this._oAddDialog.getModel().getData();
                                if (oData.validFrom) {
                                    oData.validFrom = new Date(oData.validFrom).toISOString().split("T")[0];
                                }
                                if (oData.validTo) {
                                    oData.validTo = new Date(oData.validTo).toISOString().split("T")[0];
                                }
                                fetch("/odata/v4/real-estate/Buildings", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(oData)
                                })
                                    .then(response => {
                                        if (!response.ok) {
                                            throw new Error("Failed to create Building");
                                        }
                                        return response.json();
                                    })
                                    .then((newBuilding) => {
                                        sap.m.MessageToast.show("Building created!");

                                        // Get the table model
                                        var oTable = this.getView().byId("BuildingsTable");
                                        var oModel = oTable.getModel();
                                        var aBuildings = oModel.getProperty("/Buildings") || [];

                                        // Add the new building to the list
                                        aBuildings.push(newBuilding);

                                        // Update the model data
                                        oModel.setProperty("/Buildings", aBuildings);

                                        // Close dialog
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

                    this._oAddDialog.setModel(oNewBuildingModel);
                    this.getView().addDependent(this._oAddDialog);
                }
                this._oAddDialog.open();
            },
            onEdit: function (oEvent) {
                var oButton = oEvent.getSource();
                var oContext = oButton.getParent().getParent().getBindingContext();

                if (!oContext) {
                    sap.m.MessageBox.warning("Error: Unable to retrieve row data");
                    return;
                }

                var oSelectedData = oContext.getObject();
                var oTable = this.getView().byId("BuildingsTable");
                var oModel = oTable.getModel();

                // Create Edit Dialog if not exists
                if (!this._oEditDialog) {
                    // Create a reusable empty model structure
                    this._oEditBuildingModel = new sap.ui.model.json.JSONModel({
                        buildingId: "",
                        buildingDescription: "",
                        buildingOldCode: "",
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
                    });

                    this._oEditDialog = new sap.m.Dialog({
                        title: "Edit Building",
                        titleAlignment: "Center",
                        contentWidth: "600px",
                        content: [
                            new sap.ui.layout.form.SimpleForm({
                                editable: true,
                                layout: "ResponsiveGridLayout",
                                content: [
                                    new sap.m.Label({ text: "Building ID" }),
                                    new sap.m.Input({ value: "{/buildingId}", editable: false }),

                                    new sap.m.Label({ text: "Building Description" }),
                                    new sap.m.Input({ value: "{/buildingDescription}" }),

                                    new sap.m.Label({ text: "Building Old Code" }),
                                    new sap.m.Input({ value: "{/buildingOldCode}" }),

                                    new sap.m.Label({ text: "Project ID" }),
                                    new sap.m.Input({ value: "{/projectId}" }),

                                    new sap.m.Label({ text: "Project Description" }),
                                    new sap.m.Input({ value: "{/projectDescription}" }),

                                    new sap.m.Label({ text: "Company Code" }),
                                    new sap.m.Input({ value: "{/companyCodeId}" }),

                                    new sap.m.Label({ text: "Company Code Description" }),
                                    new sap.m.Input({ value: "{/companyCodeDescription}" }),

                                    new sap.m.Label({ text: "Valid From" }),
                                    new sap.m.DatePicker({ value: "{/validFrom}" }),

                                    new sap.m.Label({ text: "Valid To" }),
                                    new sap.m.DatePicker({ value: "{/validTo}" }),

                                    new sap.m.Label({ text: "Location" }),
                                    new sap.m.Input({ value: "{/location}" }),

                                    new sap.m.Label({ text: "Business Area" }),
                                    new sap.m.Input({ value: "{/businessArea}" }),

                                    new sap.m.Label({ text: "Profit Center" }),
                                    new sap.m.Input({ value: "{/profitCenter}" }),

                                    new sap.m.Label({ text: "Functional Area" }),
                                    new sap.m.Input({ value: "{/functionalArea}" }),
                                ]
                            })
                        ],
                        beginButton: new sap.m.Button({
                            text: "Save",
                            type: "Emphasized",
                            press: () => {
                                var oUpdated = this._oEditBuildingModel.getData();

                                // Format dates
                                if (oUpdated.validFrom)
                                    oUpdated.validFrom = new Date(oUpdated.validFrom).toISOString().split("T")[0];
                                if (oUpdated.validTo)
                                    oUpdated.validTo = new Date(oUpdated.validTo).toISOString().split("T")[0];

                                // Send PATCH request
                                fetch(`/odata/v4/real-estate/Buildings(${oUpdated.buildingId})`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(oUpdated)
                                })
                                    .then(response => {
                                        if (!response.ok) throw new Error("Failed to update Building");
                                        return response.json();
                                    })
                                    .then(updatedBuilding => {
                                        // Update local model instantly
                                        var aBuildings = oModel.getProperty("/Buildings") || [];
                                        var iIndex = aBuildings.findIndex(b => b.buildingId === updatedBuilding.buildingId);
                                        if (iIndex > -1) {
                                            aBuildings[iIndex] = updatedBuilding;
                                            oModel.setProperty("/Buildings", aBuildings);
                                        }

                                        sap.m.MessageToast.show("Building updated successfully!");
                                        this._oEditDialog.close();
                                    })
                                    .catch(err => {
                                        sap.m.MessageBox.error("Error: " + err.message);
                                    });
                            }
                        }),
                        endButton: new sap.m.Button({
                            text: "Cancel",
                            press: () => this._oEditDialog.close()
                        })
                    });

                    this._oEditDialog.setModel(this._oEditBuildingModel);
                    this.getView().addDependent(this._oEditDialog);
                }

                // Load the selected building data into the model
                this._oEditBuildingModel.setData(Object.assign({}, oSelectedData));

                // Open dialog
                this._oEditDialog.open();
            },
            onDelete: function (oEvent) {
                const oContext = oEvent.getSource().getBindingContext();
                const sBuildingId = oContext.getProperty("buildingId");
                MessageBox.confirm(`Delete Unit ${sBuildingId}?`, {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    onClose: (sAction) => {
                        if (sAction === MessageBox.Action.OK) {
                            fetch(`/odata/v4/real-estate/Buildings('${encodeURIComponent(sBuildingId)}')`, { method: "DELETE" })
                                .then(r => {
                                    if (r.ok) {
                                        MessageToast.show("Deleted successfully!");
                                        this. _loadBuildings();
                                    } else throw new Error("Delete failed");
                                })
                                .catch(err => MessageBox.error(err.message));
                        }
                    }
                });
            }

        });
    });