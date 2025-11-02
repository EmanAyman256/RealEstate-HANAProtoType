sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/TextArea",
    "sap/m/VBox",
    "sap/m/DatePicker",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/ui/model/json/JSONModel",
    "sap/m/Title",
    "sap/m/IconTabBar",
    "sap/m/IconTabFilter",
    "sap/ui/layout/form/SimpleForm",

    "sap/ui/model/json/JSONModel"],
    (Controller, MessageBox, Dialog, Input, Button, Label, Text, TextArea, VBox,
        DatePicker, Table, Column, ColumnListItem, JSONModel, Title, IconTabBar, IconTabFilter, SimpleForm
    ) => {
        "use strict";
        return Controller.extend("dboperations.controller.Buildings", {
            onInit() {
                this.getOwnerComponent().getRouter()
                    .getRoute("Buildings")
                    .attachPatternMatched(this._onRouteMatched, this);

                var oModel = new sap.ui.model.json.JSONModel({
                    Buildings: [],
                    Projects: []
                });
                this.getView().setModel(oModel, "view");

                var oModel = new JSONModel();
                fetch("/odata/v4/real-estate/Buildings")
                    .then(response => response.json())
                    .then(data => {
                        oModel.setData({ Buildings: data.value });
                        this.getView().byId("buildingsTable").setModel(oModel);
                    })
                    .catch(err => {
                        console.error("Error fetching Buildings", err);
                    });
                fetch("/odata/v4/real-estate/Projects")
                    .then(response => response.json())
                    .then(data => {
                        oModel.setData({ Projects: data.value });
                        //this.getView().byId("BuildingsTable").setModel(oModel);
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
                        this.getView().byId("buildingsTable").setModel(oModel);
                    })
                    .catch(err => {
                        console.error("Error fetching Buildings ", err);
                    });
            },
            _loadUnits: function () {
                const oModel = new JSONModel();
                fetch("/odata/v4/real-estate/Units?$expand=measurements,conditions")
                    .then(res => {
                        if (!res.ok) throw new Error("Failed to load Units");
                        return res.json();
                    })
                    .then(data => {
                        oModel.setData({ Units: data.value || [] });
                        this.getView().byId("unitsTable").setModel(oModel);
                    })
                    .catch(err => {
                        console.error("Error loading Units:", err);
                        MessageBox.error("Error loading Units: " + err.message);
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
                        title: "Add New Building",
                        content: new sap.ui.layout.form.SimpleForm({
                            editable: true,
                            content: [
                                new sap.m.Label({ text: "Building ID" }),
                                new sap.m.Input({ value: "{/buildingId}" }),

                                new sap.m.Label({ text: "Building Description" }),
                                new sap.m.Input({ value: "{/buildingDescription}" }),

                                new sap.m.Label({ text: "Building Old Code" }),
                                new sap.m.Input({ value: "{/buildingOldCode}" }),

                                // Should be selected dropdown ...

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
                var oTable = this.getView().byId("buildingsTable");
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
                                        this._loadBuildings();
                                    } else throw new Error("Delete failed");
                                })
                                .catch(err => MessageBox.error(err.message));
                        }
                    }
                });
            },
            onNavigateToAddUnit: function () {
                const oData = {
                    unitId: "",
                    unitDescription: "",
                    companyCodeId: "",
                    companyCodeDescription: "",
                    projectId: "",
                    projectDescription: "",
                    buildingId: "",
                    zone: "",
                    salesPhase: "",
                    unitDeliveryDate: "",
                    supplementaryText: "",
                    measurements: [],
                    conditions: []
                };
                const oModel = new JSONModel(oData);

                if (!this._oAddDialog) {
                    this._oAddDialog = new Dialog({
                        title: "Add / Edit Unit",
                        contentWidth: "100%",
                        resizable: true,
                        draggable: true,
                        content: new VBox({ items: this._createAddEditForm() }),
                        beginButton: new Button({
                            text: "Save",
                            type: "Emphasized",
                            press: this.onSaveUnit.bind(this)
                        }),
                        endButton: new Button({
                            text: "Cancel",
                            press: function () { this._oAddDialog.close(); }.bind(this)
                        })
                    });
                    this._oAddDialog.setModel(oModel);
                    this.getView().addDependent(this._oAddDialog);
                }

                this._oAddDialog.getModel().setData(oData);
                this._oAddDialog.open();
            },
            _createAddEditForm: function () {
                return [
                    new Label({ text: "Unit ID" }), new Input({ value: "{/unitId}", editable: "{= ${/unitId} === '' }" }),
                    new Label({ text: "Unit Description" }), new Input({ value: "{/unitDescription}" }),
                    new Label({ text: "Company Code ID" }), new Input({ value: "{/companyCodeId}" }),
                    new Label({ text: "Company Code Description" }), new Input({ value: "{/companyCodeDescription}" }),
                    new Label({ text: "Project ID" }), new Input({ value: "{/projectId}" }),
                    new Label({ text: "Project Description" }), new Input({ value: "{/projectDescription}" }),
                    new Label({ text: "Building ID" }), new Input({ value: "{/buildingId}" }),
                    new Label({ text: "Zone" }), new Input({ value: "{/zone}" }),
                    new Label({ text: "Sales Phase" }), new Input({ value: "{/salesPhase}" }),
                    new Label({ text: "Delivery Date" }), new DatePicker({ value: "{/unitDeliveryDate}", valueFormat: "yyyy-MM-dd", displayFormat: "long" }),
                    new Label({ text: "Supplementary Text" }), new TextArea({ value: "{/supplementaryText}", rows: 3, width: "100%" }),
                    new Title({ text: "Measurements", level: "H3" }),
                    new Button({ text: "Add Measurement", press: this.onAddMeasurementRow.bind(this) }),
                    new Table({
                        id: "measurementsTable",
                        items: "{/measurements}",
                        columns: [
                            new Column({ header: new Label({ text: "Code" }) }),
                            new Column({ header: new Label({ text: "Description" }) }),
                            new Column({ header: new Label({ text: "Quantity" }) }),
                            new Column({ header: new Label({ text: "UOM" }) })
                        ],
                        items: {
                            path: "/measurements",
                            template: new ColumnListItem({
                                cells: [
                                    new Input({ value: "{code}" }),
                                    new Input({ value: "{description}" }),
                                    new Input({ value: "{quantity}", type: "Number" }),
                                    new Input({ value: "{uom}" })
                                ]
                            })
                        }
                    }),
                    new Title({ text: "Conditions", level: "H3" }),
                    new Button({ text: "Add Condition", press: this.onAddConditionRow.bind(this) }),
                    new Table({
                        id: "conditionsTable",
                        items: "{/conditions}",
                        columns: [
                            new Column({ header: new Label({ text: "Code" }) }),
                            new Column({ header: new Label({ text: "Description" }) }),
                            new Column({ header: new Label({ text: "Amount" }) }),
                            new Column({ header: new Label({ text: "Currency" }) })
                        ],
                        items: {
                            path: "/conditions",
                            template: new ColumnListItem({
                                cells: [
                                    new Input({ value: "{code}" }),
                                    new Input({ value: "{description}" }),
                                    new Input({ value: "{amount}", type: "Number" }),
                                    new Input({ value: "{currency}" })
                                ]
                            })
                        }
                    })
                ];
            },
            onAddMeasurementRow: function () {
                const oModel = this._oAddDialog.getModel();
                oModel.getProperty("/measurements").push({ code: "", description: "", quantity: 0, uom: "" });
                oModel.refresh();
            },

            onAddConditionRow: function () {
                const oModel = this._oAddDialog.getModel();
                oModel.getProperty("/conditions").push({ code: "", description: "", amount: 0, currency: "" });
                oModel.refresh();
            },

            _generateUUID: function () {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            },
            onSaveUnit: function () {
                const oData = this._oAddDialog.getModel().getData();
                const payload = {
                    unitId: oData.unitId || Date.now().toString().slice(-8),
                    unitDescription: oData.unitDescription,
                    companyCodeId: oData.companyCodeId,
                    companyCodeDescription: oData.companyCodeDescription,
                    projectId: oData.projectId,
                    projectDescription: oData.projectDescription,
                    buildingId: oData.buildingId,
                    zone: oData.zone,
                    salesPhase: oData.salesPhase,
                    unitDeliveryDate: oData.unitDeliveryDate || null,
                    supplementaryText: oData.supplementaryText,
                    profitCenter: oData.profitCenter || 0,
                    functionalArea: oData.functionalArea || 0,
                    measurements: oData.measurements,
                    conditions: oData.conditions
                };

                const isEdit = !!oData.unitId;
                const method = isEdit ? "PATCH" : "POST";
                const url = isEdit
                    ? `/odata/v4/real-estate/Units(unitId='${encodeURIComponent(oData.unitId)}')`
                    : "/odata/v4/real-estate/Units";

                fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })
                    .then(r => { if (!r.ok) throw new Error(isEdit ? "Update failed" : "Create failed"); })
                    .then(() => {
                        this._loadUnits();
                        MessageBox.success(isEdit ? "Unit updated successfully!" : "Unit created successfully!");
                        this._oAddDialog.close();
                    })
                    .catch(e => MessageBox.error(e.message));
            },
            onDetails: function (oEvent) {
                var oBindingContext = oEvent.getSource().getBindingContext();
                if (!oBindingContext) {
                    return;
                }

                var oData = oBindingContext.getObject();
                var oDialogModel = new sap.ui.model.json.JSONModel({
                    BuildingId: oData.buildingId,
                    BuildingDescription: oData.buildingDescription,
                    BuildingOldCode: oData.buildingOldCode,
                    ProjectId: oData.projectId,
                    ProjectDescription: oData.projectDescription,
                    CompanyCodeId: oData.companyCodeId,
                    CompanyCodeDescription: oData.companyCodeDescription,
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
                        title: "Building Details",
                        contentWidth: "100%",
                        resizable: true,
                        draggable: true,
                        content: [
                            new sap.m.IconTabBar({
                                expandable: true,
                                items: [
                                    // 🔹 Tab 1: Building General Data
                                    new sap.m.IconTabFilter({
                                        text: "General Data",
                                        icon: "sap-icon://building",
                                        content: [
                                            new sap.ui.layout.form.SimpleForm({
                                                editable: false,
                                                layout: "ResponsiveGridLayout",
                                                labelSpanL: 3,
                                                columnsL: 2,
                                                content: [
                                                    new sap.m.Label({ text: "Building ID (8 digits)" }),
                                                    new sap.m.Text({ text: "{/BuildingId}" }),

                                                    new sap.m.Label({ text: "Building Description" }),
                                                    new sap.m.Text({ text: "{/BuildingDescription}" }),

                                                    new sap.m.Label({ text: "Building Old Code" }),
                                                    new sap.m.Text({ text: "{/BuildingOldCode}" }),

                                                    new sap.m.Label({ text: "Project ID" }),
                                                    new sap.m.Text({ text: "{/ProjectId}" }),

                                                    new sap.m.Label({ text: "Project Description" }),
                                                    new sap.m.Text({ text: "{/ProjectDescription}" }),

                                                    new sap.m.Label({ text: "Company Code" }),
                                                    new sap.m.Text({ text: "{/CompanyCodeId}" }),

                                                    new sap.m.Label({ text: "Company Code Description" }),
                                                    new sap.m.Text({ text: "{/CompanyCodeDescription}" }),

                                                    new sap.m.Label({ text: "Valid From" }),
                                                    new sap.m.Text({ text: "{/validFrom}" }),

                                                    new sap.m.Label({ text: "Valid To" }),
                                                    new sap.m.Text({ text: "{/validTo}" }),

                                                    new sap.m.Label({ text: "Location" }),
                                                    new sap.m.Text({ text: "{/location}" })
                                                ]
                                            })
                                        ]
                                    }),

                                    // 🔹 Tab 2: Posting Parameters
                                    new sap.m.IconTabFilter({
                                        text: "Posting Parameters",
                                        icon: "sap-icon://post",
                                        content: [
                                            new sap.ui.layout.form.SimpleForm({
                                                editable: false,
                                                layout: "ResponsiveGridLayout",
                                                labelSpanL: 3,
                                                columnsL: 2,
                                                content: [
                                                    new sap.m.Label({ text: "Business Area" }),
                                                    new sap.m.Text({ text: "{/businessArea}" }),

                                                    new sap.m.Label({ text: "Profit Center" }),
                                                    new sap.m.Text({ text: "{/profitCenter}" }),

                                                    new sap.m.Label({ text: "Functional Area" }),
                                                    new sap.m.Text({ text: "{/functionalArea}" })
                                                ]
                                            })
                                        ]
                                    }),

                                    // 🔹 Tab 3: Supplementary Text
                                    new sap.m.IconTabFilter({
                                        text: "Supplementary Text",
                                        icon: "sap-icon://document-text",
                                        content: [
                                            new sap.ui.layout.form.SimpleForm({
                                                editable: false,
                                                layout: "ResponsiveGridLayout",
                                                content: [
                                                    new sap.m.Label({ text: "Supplementary Text" }),
                                                    new sap.m.TextArea({
                                                        value: "{/supplementaryText}",
                                                        width: "100%",
                                                        rows: 6,
                                                        editable: false,
                                                        growing: true,
                                                        growingMaxLines: 10
                                                    })
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            })
                        ],
                        endButton: new sap.m.Button({
                            text: "Close",
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
            }



        });
    });