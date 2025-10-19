sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/TextArea",
    "sap/m/HBox",
    "sap/ui/layout/form/SimpleForm",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageBox, Dialog, Input, Button, Label, Text, TextArea, HBox, SimpleForm, JSONModel) {
    "use strict";

    return Controller.extend("dboperations.controller.Units", {

        onInit: function () {
            // load all units initially
            this._loadUnits();

            // models placeholders for measurements/prices/unit
            this.getView().setModel(new JSONModel({ Measurements: [] }), "measurements");
            this.getView().setModel(new JSONModel({ Prices: [] }), "prices");
            this.getView().setModel(new JSONModel({ unitDetails: [] }), "unit"); // selected unit, wrapped in array for single-row binding
            this._selectedUnitId = null;
        },

        _loadUnits: function () {
            const oModel = new JSONModel();
            fetch("/odata/v4/real-estate/Units?$expand=measurements,prices")
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

        // selectionChange handler for units table
        onSelectUnit: function (oEvent) {
            // The event may be fired from selectionChange (param 'listItem') or from table selection programmatically.
            const oListItem = oEvent.getParameter && oEvent.getParameter("listItem")
                ? oEvent.getParameter("listItem")
                : (oEvent.getSource && oEvent.getSource().getSelectedItem && oEvent.getSource().getSelectedItem());

            if (!oListItem) {
                return;
            }

            // defensive: ensure we have a ColumnListItem with context
            const oCtx = oListItem.getBindingContext();
            if (!oCtx) {
                MessageBox.warning("Could not get selected unit context.");
                return;
            }

            const oUnit = oCtx.getObject();
            this._selectedUnitId = oUnit.unitId;

            // set selected unit into named model (wrapped in array for single-row tables in Details and Posting tabs)
            const oUnitModel = new JSONModel({ unitDetails: [oUnit] });
            this.getView().setModel(oUnitModel, "unit");

            // load measurements for the selected unit
            this._loadMeasurements(this._selectedUnitId);

            // load prices for the selected unit
            this._loadPrices(this._selectedUnitId);
        },

        onTabChange: function (oEvent) {
            // ensure measurement/price tabs refresh when selected
            const sKey = oEvent.getParameter("selectedKey");
            if ((sKey === "Measurements" || sKey === "Prices") && this._selectedUnitId) {
                this._loadMeasurements(this._selectedUnitId);
                this._loadPrices(this._selectedUnitId);
            }
        },

        _loadMeasurements: function (sUnitId) {
            if (!sUnitId) return;
            fetch(`/odata/v4/real-estate/UnitMeasurements?$filter=unit_unitId eq '${encodeURIComponent(sUnitId)}'`)
                .then(res => {
                    if (!res.ok) throw new Error("Failed to load measurements");
                    return res.json();
                })
                .then(data => {
                    const oMModel = new JSONModel({ Measurements: data.value || [] });
                    this.getView().setModel(oMModel, "measurements");
                })
                .catch(err => {
                    console.error("Error loading measurements:", err);
                });
        },

        _loadPrices: function (sUnitId) {
            if (!sUnitId) return;
            fetch(`/odata/v4/real-estate/UnitPrices?$filter=unit_unitId eq '${encodeURIComponent(sUnitId)}'`)
                .then(res => {
                    if (!res.ok) throw new Error("Failed to load prices");
                    return res.json();
                })
                .then(data => {
                    const oPModel = new JSONModel({ Prices: data.value || [] });
                    this.getView().setModel(oPModel, "prices");
                })
                .catch(err => {
                    console.error("Error loading prices:", err);
                });
        },

        // ---------------------------
        // Add / Edit / Delete Measurement
        // ---------------------------
        onAddMeasurement: function () {
            if (!this._selectedUnitId) {
                MessageBox.warning("Select a unit first.");
                return;
            }

            const oModel = new JSONModel({ builtUpAreaM2: "", gardenAreaM2: "", numberOfRoomsPc: "" });

            if (!this._oAddMeasurementDialog) {
                this._oAddMeasurementDialog = new Dialog({
                    id: "units--dlgAddMeasurement",
                    title: "Add Measurement",
                    contentWidth: "420px",
                    content: new SimpleForm({
                        editable: true,
                        content: [
                            new Label({ text: "Built-up Area (m²)" }),
                            new Input({ value: "{/builtUpAreaM2}", type: "Number" }),
                            new Label({ text: "Garden Area (m²)" }),
                            new Input({ value: "{/gardenAreaM2}", type: "Number" }),
                            new Label({ text: "Number of Rooms" }),
                            new Input({ value: "{/numberOfRoomsPc}", type: "Number" })
                        ]
                    }),
                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",
                        press: function () {
                            const data = this._oAddMeasurementDialog.getModel().getData();
                            // include unit association (both forms to be safe)
                            data.unit = { unitId: this._selectedUnitId };
                            data.unit_unitId = this._selectedUnitId;

                            fetch("/odata/v4/real-estate/UnitMeasurements", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(data)
                            })
                            .then(res => {
                                if (!res.ok) throw new Error("Failed to create measurement");
                                return res.json();
                            })
                            .then(() => {
                                MessageBox.success("Measurement added");
                                this._oAddMeasurementDialog.close();
                                this._loadMeasurements(this._selectedUnitId);
                            })
                            .catch(err => MessageBox.error("Error: " + err.message));
                        }.bind(this)
                    }),
                    endButton: new Button({ text: "Cancel", press: function () { this._oAddMeasurementDialog.close(); }.bind(this) })
                });
                this.getView().addDependent(this._oAddMeasurementDialog);
            }

            this._oAddMeasurementDialog.setModel(oModel);
            this._oAddMeasurementDialog.open();
        },

        onEditMeasurement: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext("measurements");
            if (!oCtx) {
                MessageBox.warning("Unable to determine selected measurement.");
                return;
            }
            const oData = Object.assign({}, oCtx.getObject());
            if (!oData.ID) {
                MessageBox.error("Measurement ID is missing. Check backend response.");
                return;
            }
            const oModel = new JSONModel(oData);

            if (!this._oEditMeasurementDialog) {
                this._oEditMeasurementDialog = new Dialog({
                    id: "units--dlgEditMeasurement",
                    title: "Edit Measurement",
                    contentWidth: "420px",
                    content: new SimpleForm({
                        editable: true,
                        content: [
                            new Label({ text: "Built-up Area (m²)" }),
                            new Input({ value: "{/builtUpAreaM2}", type: "Number" }),
                            new Label({ text: "Garden Area (m²)" }),
                            new Input({ value: "{/gardenAreaM2}", type: "Number" }),
                            new Label({ text: "Number of Rooms" }),
                            new Input({ value: "{/numberOfRoomsPc}", type: "Number" })
                        ]
                    }),
                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",
                        press: function () {
                            const data = this._oEditMeasurementDialog.getModel().getData();
                            // PATCH by ID
                            fetch(`/odata/v4/real-estate/UnitMeasurements(ID='${encodeURIComponent(data.ID)}')`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(data)
                            })
                            .then(res => {
                                if (!res.ok) throw new Error("Failed to update measurement");
                                MessageBox.success("Measurement updated");
                                this._oEditMeasurementDialog.close();
                                this._loadMeasurements(this._selectedUnitId);
                            })
                            .catch(err => MessageBox.error("Error: " + err.message));
                        }.bind(this)
                    }),
                    endButton: new Button({ text: "Cancel", press: function () { this._oEditMeasurementDialog.close(); }.bind(this) })
                });
                this.getView().addDependent(this._oEditMeasurementDialog);
            }

            this._oEditMeasurementDialog.setModel(oModel);
            this._oEditMeasurementDialog.open();
        },

        onDeleteMeasurement: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext("measurements");
            if (!oCtx) {
                MessageBox.warning("Unable to determine measurement to delete.");
                return;
            }
            const oData = oCtx.getObject();
            if (!oData.ID) {
                MessageBox.error("Measurement ID is missing.");
                return;
            }

            MessageBox.confirm(`Delete measurement ${oData.ID}?`, {
                onClose: (action) => {
                    if (action === MessageBox.Action.OK) {
                        fetch(`/odata/v4/real-estate/UnitMeasurements(ID='${encodeURIComponent(oData.ID)}')`, { method: "DELETE" })
                        .then(res => {
                            if (!res.ok) throw new Error("Failed to delete measurement");
                            MessageBox.success("Measurement deleted");
                            this._loadMeasurements(this._selectedUnitId);
                        })
                        .catch(err => MessageBox.error("Error: " + err.message));
                    }
                }
            });
        },

        // ---------------------------
        // Add / Edit / Delete Price
        // ---------------------------
        onAddPrice: function () {
            if (!this._selectedUnitId) {
                MessageBox.warning("Select a unit first.");
                return;
            }
            const oModel = new JSONModel({ originalPriceZU01: "", parkingPriceZU03: "", maintenancePrice: "" });

            if (!this._oAddPriceDialog) {
                this._oAddPriceDialog = new Dialog({
                    id: "units--dlgAddPrice",
                    title: "Add Price",
                    contentWidth: "420px",
                    content: new SimpleForm({
                        editable: true,
                        content: [
                            new Label({ text: "Original Price (ZU01)" }),
                            new Input({ value: "{/originalPriceZU01}", type: "Number" }),
                            new Label({ text: "Parking Price (ZU03)" }),
                            new Input({ value: "{/parkingPriceZU03}", type: "Number" }),
                            new Label({ text: "Maintenance Price" }),
                            new Input({ value: "{/maintenancePrice}", type: "Number" })
                        ]
                    }),
                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",
                        press: function () {
                            const data = this._oAddPriceDialog.getModel().getData();
                            data.unit = { unitId: this._selectedUnitId };
                            data.unit_unitId = this._selectedUnitId;

                            fetch("/odata/v4/real-estate/UnitPrices", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(data)
                            })
                            .then(res => {
                                if (!res.ok) throw new Error("Failed to create price");
                                return res.json();
                            })
                            .then(() => {
                                MessageBox.success("Price added");
                                this._oAddPriceDialog.close();
                                this._loadPrices(this._selectedUnitId);
                            })
                            .catch(err => MessageBox.error("Error: " + err.message));
                        }.bind(this)
                    }),
                    endButton: new Button({ text: "Cancel", press: function () { this._oAddPriceDialog.close(); }.bind(this) })
                });
                this.getView().addDependent(this._oAddPriceDialog);
            }

            this._oAddPriceDialog.setModel(oModel);
            this._oAddPriceDialog.open();
        },

        onEditPrice: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext("prices");
            if (!oCtx) {
                MessageBox.warning("Unable to determine selected price.");
                return;
            }
            const oData = Object.assign({}, oCtx.getObject());
            if (!oData.ID) {
                MessageBox.error("Price ID is missing. Check backend response.");
                return;
            }
            const oModel = new JSONModel(oData);

            if (!this._oEditPriceDialog) {
                this._oEditPriceDialog = new Dialog({
                    id: "units--dlgEditPrice",
                    title: "Edit Price",
                    contentWidth: "420px",
                    content: new SimpleForm({
                        editable: true,
                        content: [
                            new Label({ text: "Original Price (ZU01)" }),
                            new Input({ value: "{/originalPriceZU01}", type: "Number" }),
                            new Label({ text: "Parking Price (ZU03)" }),
                            new Input({ value: "{/parkingPriceZU03}", type: "Number" }),
                            new Label({ text: "Maintenance Price" }),
                            new Input({ value: "{/maintenancePrice}", type: "Number" })
                        ]
                    }),
                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",
                        press: function () {
                            const data = this._oEditPriceDialog.getModel().getData();
                            fetch(`/odata/v4/real-estate/UnitPrices(ID='${encodeURIComponent(data.ID)}')`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(data)
                            })
                            .then(res => {
                                if (!res.ok) throw new Error("Failed to update price");
                                MessageBox.success("Price updated");
                                this._oEditPriceDialog.close();
                                this._loadPrices(this._selectedUnitId);
                            })
                            .catch(err => MessageBox.error("Error: " + err.message));
                        }.bind(this)
                    }),
                    endButton: new Button({ text: "Cancel", press: function () { this._oEditPriceDialog.close(); }.bind(this) })
                });

                this.getView().addDependent(this._oEditPriceDialog);
            }

            this._oEditPriceDialog.setModel(oModel);
            this._oEditPriceDialog.open();
        },

        onDeletePrice: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext("prices");
            if (!oCtx) {
                MessageBox.warning("Unable to determine price to delete.");
                return;
            }
            const oData = oCtx.getObject();
            if (!oData.ID) {
                MessageBox.error("Price ID is missing.");
                return;
            }

            MessageBox.confirm(`Delete price ${oData.ID}?`, {
                onClose: (action) => {
                    if (action === MessageBox.Action.OK) {
                        fetch(`/odata/v4/real-estate/UnitPrices(ID='${encodeURIComponent(oData.ID)}')`, { method: "DELETE" })
                        .then(res => {
                            if (!res.ok) throw new Error("Failed to delete price");
                            MessageBox.success("Price deleted");
                            this._loadPrices(this._selectedUnitId);
                        })
                        .catch(err => MessageBox.error("Error: " + err.message));
                    }
                }
            });
        },

        // ---------------------------
        // Unit Create / Edit / Delete / Details
        // ---------------------------
        onNavigateToAddUnit: function () {
            const oData = {
                companyCodeId: "",
                companyCodeDescription: "",
                projectId: "",
                projectDescription: "",
                buildingId: "",
                buildingOldCode: "",
                unitId: "",
                unitOldCode: "",
                unitDescription: "",
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
                profitCenter: "",
                functionalArea: "",
                supplementaryText: ""
            };
            const oModel = new JSONModel(oData);

            if (!this._oAddUnitDialog) {
                this._oAddUnitDialog = new Dialog({
                    id: "units--dlgAddUnit",
                    title: "Add Unit",
                    contentWidth: "700px",
                    content: new SimpleForm({
                        editable: true,
                        layout: "ResponsiveGridLayout",
                        labelSpanM: 4,
                        columnsM: 2,
                        content: [
                            new Label({ text: "Company Code ID" }), new Input({ value: "{/companyCodeId}" }),
                            new Label({ text: "Company Code Description" }), new Input({ value: "{/companyCodeDescription}" }),
                            new Label({ text: "Project ID" }), new Input({ value: "{/projectId}" }),
                            new Label({ text: "Project Description" }), new Input({ value: "{/projectDescription}" }),
                            new Label({ text: "Building ID" }), new Input({ value: "{/buildingId}" }),
                            new Label({ text: "Building Old Code" }), new Input({ value: "{/buildingOldCode}" }),
                            new Label({ text: "Unit ID" }), new Input({ value: "{/unitId}" }),
                            new Label({ text: "Unit Old Code" }), new Input({ value: "{/unitOldCode}" }),
                            new Label({ text: "Unit Description" }), new Input({ value: "{/unitDescription}" }),
                            new Label({ text: "Unit Type Code" }), new Input({ value: "{/unitTypeCode}" }),
                            new Label({ text: "Unit Type Description" }), new Input({ value: "{/unitTypeDescription}" }),
                            new Label({ text: "Usage Type Code" }), new Input({ value: "{/usageTypeCode}" }),
                            new Label({ text: "Usage Type Description" }), new Input({ value: "{/usageTypeDescription}" }),
                            new Label({ text: "Unit Status Code" }), new Input({ value: "{/unitStatusCode}" }),
                            new Label({ text: "Unit Status Description" }), new Input({ value: "{/unitStatusDescription}" }),
                            new Label({ text: "Floor Code" }), new Input({ value: "{/floorCode}" }),
                            new Label({ text: "Floor Description" }), new Input({ value: "{/floorDescription}" }),
                            new Label({ text: "Zone" }), new Input({ value: "{/zone}" }),
                            new Label({ text: "Sales Phase" }), new Input({ value: "{/salesPhase}" }),
                            new Label({ text: "Finishing Spec Code" }), new Input({ value: "{/finishingSpexCode}" }),
                            new Label({ text: "Finishing Spec Description" }), new Input({ value: "{/finishingSpexDescription}" }),
                            new Label({ text: "Unit Delivery Date" }), new Input({ value: "{/unitDeliveryDate}" , placeholder:"YYYY-MM-DD"}),
                            new Label({ text: "Profit Center" }), new Input({ value: "{/profitCenter}", type: "Number" }),
                            new Label({ text: "Functional Area" }), new Input({ value: "{/functionalArea}", type: "Number" }),
                            new Label({ text: "Supplementary Text" }), new TextArea({ value: "{/supplementaryText}", rows: 3, width: "100%" })
                        ]
                    }),
                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",
                        press: function () {
                            const payload = this._oAddUnitDialog.getModel().getData();
                            // POST to Units
                            fetch("/odata/v4/real-estate/Units", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(payload)
                            })
                            .then(res => {
                                if (!res.ok) throw new Error("Failed to create unit");
                                return res.json();
                            })
                            .then(() => {
                                MessageBox.success("Unit created");
                                this._oAddUnitDialog.close();
                                this._loadUnits();
                            })
                            .catch(err => MessageBox.error("Error: " + err.message));
                        }.bind(this)
                    }),
                    endButton: new Button({ text: "Cancel", press: function () { this._oAddUnitDialog.close(); }.bind(this) })
                });
                this.getView().addDependent(this._oAddUnitDialog);
            }

            this._oAddUnitDialog.setModel(oModel);
            this._oAddUnitDialog.open();
        },

        onEditUnit: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext();
            if (!oCtx) { MessageBox.warning("Unable to get unit context."); return; }
            const oData = Object.assign({}, oCtx.getObject());
            const oModel = new JSONModel(oData);

            if (!this._oEditUnitDialog) {
                this._oEditUnitDialog = new Dialog({
                    id: "units--dlgEditUnit",
                    title: "Edit Unit",
                    contentWidth: "700px",
                    content: new SimpleForm({
                        editable: true,
                        layout: "ResponsiveGridLayout",
                        labelSpanM: 4,
                        columnsM: 2,
                        content: [
                            new Label({ text: "Company Code ID" }), new Input({ value: "{/companyCodeId}" }),
                            new Label({ text: "Company Code Description" }), new Input({ value: "{/companyCodeDescription}" }),
                            new Label({ text: "Project ID" }), new Input({ value: "{/projectId}" }),
                            new Label({ text: "Project Description" }), new Input({ value: "{/projectDescription}" }),
                            new Label({ text: "Building ID" }), new Input({ value: "{/buildingId}" }),
                            new Label({ text: "Building Old Code" }), new Input({ value: "{/buildingOldCode}" }),
                            new Label({ text: "Unit ID" }), new Input({ value: "{/unitId}", editable: false }),
                            new Label({ text: "Unit Old Code" }), new Input({ value: "{/unitOldCode}" }),
                            new Label({ text: "Unit Description" }), new Input({ value: "{/unitDescription}" }),
                            new Label({ text: "Unit Type Code" }), new Input({ value: "{/unitTypeCode}" }),
                            new Label({ text: "Unit Type Description" }), new Input({ value: "{/unitTypeDescription}" }),
                            new Label({ text: "Usage Type Code" }), new Input({ value: "{/usageTypeCode}" }),
                            new Label({ text: "Usage Type Description" }), new Input({ value: "{/usageTypeDescription}" }),
                            new Label({ text: "Unit Status Code" }), new Input({ value: "{/unitStatusCode}" }),
                            new Label({ text: "Unit Status Description" }), new Input({ value: "{/unitStatusDescription}" }),
                            new Label({ text: "Floor Code" }), new Input({ value: "{/floorCode}" }),
                            new Label({ text: "Floor Description" }), new Input({ value: "{/floorDescription}" }),
                            new Label({ text: "Zone" }), new Input({ value: "{/zone}" }),
                            new Label({ text: "Sales Phase" }), new Input({ value: "{/salesPhase}" }),
                            new Label({ text: "Finishing Spec Code" }), new Input({ value: "{/finishingSpexCode}" }),
                            new Label({ text: "Finishing Spec Description" }), new Input({ value: "{/finishingSpexDescription}" }),
                            new Label({ text: "Unit Delivery Date" }), new Input({ value: "{/unitDeliveryDate}", placeholder: "YYYY-MM-DD" }),
                            new Label({ text: "Profit Center" }), new Input({ value: "{/profitCenter}", type: "Number" }),
                            new Label({ text: "Functional Area" }), new Input({ value: "{/functionalArea}", type: "Number" }),
                            new Label({ text: "Supplementary Text" }), new TextArea({ value: "{/supplementaryText}", rows: 3, width: "100%" })
                        ]
                    }),
                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",
                        press: function () {
                            const data = this._oEditUnitDialog.getModel().getData();
                            fetch(`/odata/v4/real-estate/Units(unitId='${encodeURIComponent(data.unitId)}')`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(data)
                            })
                            .then(res => {
                                if (!res.ok) throw new Error("Failed to update unit");
                                return res.json();
                            })
                            .then(() => {
                                MessageBox.success("Unit updated");
                                this._oEditUnitDialog.close();
                                this._loadUnits();
                            })
                            .catch(err => MessageBox.error("Error: " + err.message));
                        }.bind(this)
                    }),
                    endButton: new Button({ text: "Cancel", press: function () { this._oEditUnitDialog.close(); }.bind(this) })
                });
                this.getView().addDependent(this._oEditUnitDialog);
            }

            this._oEditUnitDialog.setModel(oModel);
            this._oEditUnitDialog.open();
        },

        onDetails: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext();
            if (!oCtx) return;
            const oData = oCtx.getObject();
            const oModel = new JSONModel(oData);

            if (!this._oDetailsDialog) {
                this._oDetailsDialog = new Dialog({
                    id: "units--dlgDetails",
                    title: "Unit Details",
                    contentWidth: "800px",
                    content: [
                        new sap.m.IconTabBar({
                            expandable: true,
                            items: [
                                new sap.m.IconTabFilter({
                                    text: "General Data",
                                    icon: "sap-icon://home",
                                    content: new SimpleForm({
                                        editable: false,
                                        content: [
                                            new Label({ text: "Unit ID" }), new Text({ text: "{/unitId}" }),
                                            new Label({ text: "Unit Description" }), new Text({ text: "{/unitDescription}" }),
                                            new Label({ text: "Company Code" }), new Text({ text: "{/companyCodeId}" }),
                                            new Label({ text: "Building ID" }), new Text({ text: "{/buildingId}" }),
                                            new Label({ text: "Zone" }), new Text({ text: "{/zone}" }),
                                            new Label({ text: "Sales Phase" }), new Text({ text: "{/salesPhase}" }),
                                            new Label({ text: "Unit Delivery Date" }), new Text({ text: "{/unitDeliveryDate}" })
                                        ]
                                    })
                                }),
                                new sap.m.IconTabFilter({
                                    text: "Supplementary Text",
                                    icon: "sap-icon://document-text",
                                    content: new SimpleForm({
                                        editable: false,
                                        content: [
                                            new Label({ text: "Supplementary Text" }),
                                            new TextArea({ value: "{/supplementaryText}", rows: 6, width: "100%", editable: false })
                                        ]
                                    })
                                })
                            ]
                        })
                    ],
                    endButton: new Button({ text: "Close", press: function () { this._oDetailsDialog.close(); }.bind(this) })
                });
                this.getView().addDependent(this._oDetailsDialog);
            }

            this._oDetailsDialog.setModel(oModel);
            this._oDetailsDialog.open();
        },

        onDelete: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext();
            if (!oCtx) return;
            const oData = oCtx.getObject();

            MessageBox.confirm(`Delete Unit ${oData.unitId}?`, {
                onClose: (action) => {
                    if (action === MessageBox.Action.OK) {
                        fetch(`/odata/v4/real-estate/Units(unitId='${encodeURIComponent(oData.unitId)}')`, { method: "DELETE" })
                        .then(res => {
                            if (!res.ok) throw new Error("Failed to delete unit");
                            MessageBox.success("Unit deleted");
                            this._loadUnits();
                        })
                        .catch(err => MessageBox.error("Error: " + err.message));
                    }
                }
            });
        },

        // CSV export (simple)
        onExportUnits: function () {
            const oTableModel = this.getView().byId("unitsTable").getModel();
            if (!oTableModel) { MessageBox.information("No data to export."); return; }
            const aUnits = oTableModel.getProperty("/Units") || [];
            if (!aUnits.length) { MessageBox.information("No data to export."); return; }

            const header = ["Unit ID","Unit Description","Company Code","Company Desc","Building ID","Zone","Sales Phase","Unit Type","Unit Status"];
            const rows = aUnits.map(u => [
                u.unitId, u.unitDescription, u.companyCodeId, u.companyCodeDescription, u.buildingId, u.zone, u.salesPhase, u.unitTypeDescription, u.unitStatusDescription
            ]);
            const csv = [header.join(","), ...rows.map(r => r.map(c => (c===undefined||c===null) ? "" : String(c)).join(","))].join("\n");

            const blob = new Blob([csv], { type: "text/csv" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "Units_Export.csv";
            link.click();
            URL.revokeObjectURL(link.href);
        },

        // Edit additional data dialog (zone/sales/finishing/unitDeliveryDate)
        onEditAdditionalData: function (oEvent) {
            const oUnitModel = this.getView().getModel("unit");
            const data = oUnitModel.getData().unitDetails[0] || {};
            if (!data.unitId) { MessageBox.warning("Select a unit first."); return; }

            const oModel = new JSONModel(Object.assign({}, data));
            if (!this._oEditAdditionalDialog) {
                this._oEditAdditionalDialog = new Dialog({
                    id: "units--dlgEditAdditional",
                    title: "Edit Additional Data",
                    contentWidth: "420px",
                    content: new SimpleForm({
                        editable: true,
                        content: [
                            new Label({ text: "Zone" }), new Input({ value: "{/zone}" }),
                            new Label({ text: "Sales Phase" }), new Input({ value: "{/salesPhase}" }),
                            new Label({ text: "Finishing Spec Code" }), new Input({ value: "{/finishingSpexCode}" }),
                            new Label({ text: "Finishing Spec Description" }), new Input({ value: "{/finishingSpexDescription}" }),
                            new Label({ text: "Unit Delivery Date (YYYY-MM-DD)" }), new Input({ value: "{/unitDeliveryDate}" })
                        ]
                    }),
                    beginButton: new Button({
                        text: "Save",
                        press: function () {
                            const payload = this._oEditAdditionalDialog.getModel().getData();
                            fetch(`/odata/v4/real-estate/Units(unitId='${encodeURIComponent(payload.unitId)}')`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    zone: payload.zone,
                                    salesPhase: payload.salesPhase,
                                    finishingSpexCode: payload.finishingSpexCode,
                                    finishingSpexDescription: payload.finishingSpexDescription,
                                    unitDeliveryDate: payload.unitDeliveryDate
                                })
                            })
                            .then(res => {
                                if (!res.ok) throw new Error("Update failed");
                                MessageBox.success("Additional data updated");
                                this._oEditAdditionalDialog.close();
                                this._loadUnits(); // Reload to refresh unit model
                            })
                            .catch(err => MessageBox.error("Error: " + err.message));
                        }.bind(this)
                    }),
                    endButton: new Button({ text: "Cancel", press: function () { this._oEditAdditionalDialog.close(); }.bind(this) })
                });
                this.getView().addDependent(this._oEditAdditionalDialog);
            }
            this._oEditAdditionalDialog.setModel(oModel);
            this._oEditAdditionalDialog.open();
        },

        // Edit posting parameters
        onEditPostingParameters: function () {
            const oUnitModel = this.getView().getModel("unit");
            const data = oUnitModel.getData().unitDetails[0] || {};
            if (!data.unitId) { MessageBox.warning("Select a unit first."); return; }

            const oModel = new JSONModel(Object.assign({}, data));
            if (!this._oEditPostingDialog) {
                this._oEditPostingDialog = new Dialog({
                    id: "units--dlgEditPosting",
                    title: "Edit Posting Parameters",
                    contentWidth: "420px",
                    content: new SimpleForm({
                        editable: true,
                        content: [
                            new Label({ text: "Profit Center" }), new Input({ value: "{/profitCenter}", type: "Number" }),
                            new Label({ text: "Functional Area" }), new Input({ value: "{/functionalArea}", type: "Number" })
                        ]
                    }),
                    beginButton: new Button({
                        text: "Save",
                        press: function () {
                            const payload = this._oEditPostingDialog.getModel().getData();
                            fetch(`/odata/v4/real-estate/Units(unitId='${encodeURIComponent(payload.unitId)}')`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    profitCenter: payload.profitCenter,
                                    functionalArea: payload.functionalArea
                                })
                            })
                            .then(res => {
                                if (!res.ok) throw new Error("Update failed");
                                MessageBox.success("Posting parameters updated");
                                this._oEditPostingDialog.close();
                                this._loadUnits(); // Reload to refresh unit model
                            })
                            .catch(err => MessageBox.error("Error: " + err.message));
                        }.bind(this)
                    }),
                    endButton: new Button({ text: "Cancel", press: function () { this._oEditPostingDialog.close(); }.bind(this) })
                });
                this.getView().addDependent(this._oEditPostingDialog);
            }
            this._oEditPostingDialog.setModel(oModel);
            this._oEditPostingDialog.open();
        }

    });
});