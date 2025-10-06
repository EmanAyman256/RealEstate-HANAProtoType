sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/Label",
    "sap/ui/layout/form/SimpleForm",
    "sap/ui/model/json/JSONModel",
    "sap/m/DatePicker"
], function (Controller, MessageToast, MessageBox, Dialog, Input, Button, Label, SimpleForm, JSONModel, DatePicker) {
    "use strict";

    return Controller.extend("dboperations.controller.Units", {

        onInit: function () {
            this._loadUnits();
        },

        // === Load Data ===
        _loadUnits: function () {
            var oModel = new JSONModel();
            fetch("/odata/v4/real-estate/Units")
                .then(response => response.json())
                .then(data => {
                    oModel.setData({ Units: data.value });
                    this.getView().byId("unitsTable").setModel(oModel);
                })
                .catch(err => console.error("Error loading Units:", err));
        },

        // === CREATE ===
        onNavigateToAddUnit: function () {
            if (!this._oAddDialog) {
                const oNewUnitModel = new JSONModel({
                    unitId: "",
                    unitDescription: "",
                    companyCodeId: "",
                    companyCodeDescription: "",
                    projectId: "",
                    projectDescription: "",
                    buildingId: "",
                    buildingOldCode: "",
                    unitTypeCode: "",
                    unitTypeDescription: "",
                    usageTypeCode: "",
                    usageTypeDescription: "",
                    unitStatusCode: "",
                    unitStatusDescription: "",
                    floorCode: "",
                    floorDescription: "",
                    zone: "",
                    salesPhase: "",
                    finishingSpexCode: "",
                    finishingSpexDescription: "",
                    unitDeliveryDate: "",
                    originalPriceZU01: "",
                    parkingPriceZU03: "",
                    maintenancePrice: "",
                    builtUpAreaM2: "",
                    gardenAreaM2: "",
                    numberOfRoomsPc: "",
                    profitCenter: "",
                    functionalArea: "",
                    supplementaryText: ""
                });

                this._oAddDialog = new Dialog({
                    title: "Add New Unit",
                    contentWidth: "600px",
                    contentHeight: "600px",
                    resizable: true,
                    draggable: true,
                    content: new SimpleForm({
                        editable: true,
                        layout: "ResponsiveGridLayout",
                        labelSpanM: 4,
                        columnsM: 2,
                        content: [
                            new Label({ text: "Unit ID" }),
                            new Input({ value: "{/unitId}" }),

                            new Label({ text: "Unit Description" }),
                            new Input({ value: "{/unitDescription}" }),

                            new Label({ text: "Company Code ID" }),
                            new Input({ value: "{/companyCodeId}" }),

                            new Label({ text: "Company Code Description" }),
                            new Input({ value: "{/companyCodeDescription}" }),

                            new Label({ text: "Project ID" }),
                            new Input({ value: "{/projectId}" }),

                            new Label({ text: "Project Description" }),
                            new Input({ value: "{/projectDescription}" }),

                            new Label({ text: "Building ID" }),
                            new Input({ value: "{/buildingId}" }),

                            new Label({ text: "Unit Type Code" }),
                            new Input({ value: "{/unitTypeCode}" }),

                            new Label({ text: "Usage Type Code" }),
                            new Input({ value: "{/usageTypeCode}" }),

                            new Label({ text: "Zone" }),
                            new Input({ value: "{/zone}" }),

                            new Label({ text: "Sales Phase" }),
                            new Input({ value: "{/salesPhase}" }),

                            new Label({ text: "Original Price (ZU01)" }),
                            new Input({ value: "{/originalPriceZU01}", type: "Number" }),

                            new Label({ text: "Built-up Area (m²)" }),
                            new Input({ value: "{/builtUpAreaM2}", type: "Number" }),

                            new Label({ text: "Garden Area (m²)" }),
                            new Input({ value: "{/gardenAreaM2}", type: "Number" }),

                            new Label({ text: "Rooms" }),
                            new Input({ value: "{/numberOfRoomsPc}", type: "Number" }),

                            new Label({ text: "Profit Center" }),
                            new Input({ value: "{/profitCenter}" }),

                            new Label({ text: "Functional Area" }),
                            new Input({ value: "{/functionalArea}" }),

                            new Label({ text: "Supplementary Text" }),
                            new Input({ value: "{/supplementaryText}" })
                        ]
                    }),
                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",
                        press: function () {
                            const oData = this._oAddDialog.getModel().getData();

                            fetch("/odata/v4/real-estate/Units", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(oData)
                            })
                                .then(response => {
                                    if (!response.ok) {
                                        throw new Error("Failed to create Unit");
                                    }
                                    return response.json();
                                })
                                .then(() => {
                                    MessageToast.show("Unit created successfully!");
                                    this._loadUnits();
                                    this._oAddDialog.close();
                                })
                                .catch(err => MessageBox.error("Error: " + err.message));
                        }.bind(this)
                    }),
                    endButton: new Button({
                        text: "Cancel",
                        press: function () {
                            this._oAddDialog.close();
                        }.bind(this)
                    })
                });

                this._oAddDialog.setModel(oNewUnitModel);
                this.getView().addDependent(this._oAddDialog);
            }

            this._oAddDialog.open();
        },

        // === DELETE ===
        onDelete: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const sUnitId = oContext.getProperty("unitId");

            MessageBox.confirm(`Are you sure you want to delete Unit ${sUnitId}?`, {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        fetch(`/odata/v4/real-estate/Units(${sUnitId})`, {
                            method: "DELETE"
                        })
                            .then(response => {
                                if (response.ok) {
                                    MessageToast.show("Unit deleted successfully!");
                                    this._loadUnits();
                                } else {
                                    throw new Error("Failed to delete Unit");
                                }
                            })
                            .catch(err => MessageBox.error("Error deleting Unit: " + err.message));
                    }
                }
            });
        }

    });
});
