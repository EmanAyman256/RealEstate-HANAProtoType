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
    "sap/ui/layout/form/SimpleForm"
], function (
    Controller, MessageBox, Dialog, Input, Button, Label, Text, TextArea, VBox,
    DatePicker, Table, Column, ColumnListItem, JSONModel, Title, IconTabBar, IconTabFilter, SimpleForm
) {
    "use strict";

    return Controller.extend("dboperations.controller.Units", {

        onInit: function () {
            this._loadUnits();
            this.getView().setModel(new JSONModel({ unitDetails: [] }), "unit");
            this._selectedUnitId = null;
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

        onSelectUnit: function (oEvent) {
            const oListItem = oEvent.getParameter("listItem");
            if (!oListItem) return;

            const oCtx = oListItem.getBindingContext();
            const oUnit = oCtx.getObject();
            this._selectedUnitId = oUnit.unitId;

            const oUnitModel = new JSONModel({ unitDetails: [oUnit] });
            this.getView().setModel(oUnitModel, "unit");
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

        onEditUnit: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext();
            if (!oCtx) return MessageBox.warning("Unable to get unit context.");

            const oData = Object.assign({}, oCtx.getObject());
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
            const oCtx = oEvent.getSource().getBindingContext();
            if (!oCtx) return;
            const oData = oCtx.getObject();
            const oModel = new JSONModel(oData);

            if (!this._oDetailsDialog) {
                this._oDetailsDialog = new Dialog({
                    title: "Unit Details",
                    contentWidth: "900px",
                    resizable: true,
                    draggable: true,
                    content: [
                        new IconTabBar({
                            items: [
                                new IconTabFilter({
                                    text: "General Data",
                                    icon: "sap-icon://home",
                                    content: new SimpleForm({
                                        editable: false,
                                        content: [
                                            new Label({ text: "Unit ID" }), new Text({ text: "{/unitId}" }),
                                            new Label({ text: "Description" }), new Text({ text: "{/unitDescription}" }),
                                            new Label({ text: "Company Code" }), new Text({ text: "{/companyCodeId}" }),
                                            new Label({ text: "Building ID" }), new Text({ text: "{/buildingId}" }),
                                            new Label({ text: "Zone" }), new Text({ text: "{/zone}" }),
                                            new Label({ text: "Sales Phase" }), new Text({ text: "{/salesPhase}" }),
                                            new Label({ text: "Delivery Date" }), new Text({ text: "{/unitDeliveryDate}" })
                                        ]
                                    })
                                }),
                                new IconTabFilter({
                                    text: "Measurements",
                                    icon: "sap-icon://measure",
                                    content: [
                                        new Table({
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
                                                        new Text({ text: "{code}" }),
                                                        new Text({ text: "{description}" }),
                                                        new Text({ text: "{quantity}" }),
                                                        new Text({ text: "{uom}" })
                                                    ]
                                                })
                                            }
                                        })
                                    ]
                                }),
                                new IconTabFilter({
                                    text: "Conditions",
                                    icon: "sap-icon://list",
                                    content: [
                                        new Table({
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
                                                        new Text({ text: "{code}" }),
                                                        new Text({ text: "{description}" }),
                                                        new Text({ text: "{amount}" }),
                                                        new Text({ text: "{currency}" })
                                                    ]
                                                })
                                            }
                                        })
                                    ]
                                })
                            ]
                        })
                    ],
                    endButton: new Button({
                        text: "Close",
                        press: function () { this._oDetailsDialog.close(); }.bind(this)
                    })
                });
                this.getView().addDependent(this._oDetailsDialog);
            }

            this._oDetailsDialog.setModel(oModel);
            this._oDetailsDialog.open();
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
        }
    });
});
