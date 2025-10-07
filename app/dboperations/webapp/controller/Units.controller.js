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
    "sap/m/DatePicker",
    "sap/m/ScrollContainer"
], function (Controller, MessageToast, MessageBox, Dialog, Input, Button, Label, SimpleForm, JSONModel, DatePicker, ScrollContainer) {
    "use strict";

    return Controller.extend("dboperations.controller.Units", {

        onInit: function () {
            this._loadUnits();
        },

        _loadUnits: function () {
            var oModel = new JSONModel();
            fetch("/odata/v4/real-estate/Units")
                .then(res => res.json())
                .then(data => {
                    oModel.setData({ Units: data.value });
                    this.getView().byId("unitsTable").setModel(oModel);
                })
                .catch(err => console.error("Error loading Units:", err));
        },

        _openUnitDialog: function (mode, oData) {
            const isEdit = mode === "edit";
            const title = isEdit ? "Edit Unit" : "Add New Unit";

            const defaultData = {
                companyCodeId: "", companyCodeDescription: "",
                projectId: "", projectDescription: "",
                buildingId: "", buildingOldCode: "",
                unitId: "", unitOldCode: "", unitDescription: "",
                unitTypeCode: "", unitTypeDescription: "",
                usageTypeCode: "", usageTypeDescription: "",
                unitStatusCode: "", unitStatusDescription: "",
                floorCode: "", floorDescription: "",
                zone: "", salesPhase: "",
                finishingSpexCode: "", finishingSpexDescription: "",
                unitDeliveryDate: "",
                originalPriceZU01: "", parkingPriceZU03: "", maintenancePrice: "",
                builtUpAreaM2: "", gardenAreaM2: "", numberOfRoomsPc: "",
                profitCenter: "", functionalArea: "",
                supplementaryText: ""
            };

            const oUnitModel = new JSONModel(oData || defaultData);

            if (this._oDialog) this._oDialog.destroy();

            this._oDialog = new Dialog({
                title,
                contentWidth: "950px",
                contentHeight: "600px",
                resizable: true,
                draggable: true,
                content: new ScrollContainer({
                    height: "550px",
                    vertical: true,
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
                            new Label({ text: "Unit ID" }), new Input({ value: "{/unitId}", editable: !isEdit }),
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
                            new Label({ text: "Finishing Spex Code" }), new Input({ value: "{/finishingSpexCode}" }),
                            new Label({ text: "Finishing Spex Description" }), new Input({ value: "{/finishingSpexDescription}" }),
                            new Label({ text: "Unit Delivery Date" }), new DatePicker({
                                value: "{/unitDeliveryDate}",
                                displayFormat: "long",
                                valueFormat: "yyyy-MM-dd"
                            }),
                            new Label({ text: "Original Price (ZU01)" }), new Input({ value: "{/originalPriceZU01}", type: "Number" }),
                            new Label({ text: "Parking Price (ZU03)" }), new Input({ value: "{/parkingPriceZU03}", type: "Number" }),
                            new Label({ text: "Maintenance Price" }), new Input({ value: "{/maintenancePrice}", type: "Number" }),
                            new Label({ text: "Built-up Area (m²)" }), new Input({ value: "{/builtUpAreaM2}", type: "Number" }),
                            new Label({ text: "Garden Area (m²)" }), new Input({ value: "{/gardenAreaM2}", type: "Number" }),
                            new Label({ text: "Number of Rooms" }), new Input({ value: "{/numberOfRoomsPc}", type: "Number" }),
                            new Label({ text: "Profit Center" }), new Input({ value: "{/profitCenter}" }),
                            new Label({ text: "Functional Area" }), new Input({ value: "{/functionalArea}" }),
                            new Label({ text: "Supplementary Text" }), new Input({ value: "{/supplementaryText}" })
                        ]
                    })
                }),
                beginButton: new Button({
                    text: isEdit ? "Update" : "Save",
                    type: "Emphasized",
                    press: function () {
                        const oPayload = this._oDialog.getModel().getData();
                        const sUrl = isEdit
                            ? `/odata/v4/real-estate/Units('${encodeURIComponent(oPayload.unitId)}')`
                            : "/odata/v4/real-estate/Units";

                        fetch(sUrl, {
                            method: isEdit ? "PATCH" : "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(oPayload)
                        })
                            .then(r => {
                                if (!r.ok) throw new Error("Save failed");
                                return r.json();
                            })
                            .then(() => {
                                MessageToast.show(isEdit ? "Updated successfully!" : "Created successfully!");
                                this._loadUnits();
                                this._oDialog.close();
                            })
                            .catch(err => MessageBox.error(err.message));
                    }.bind(this)
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function () { this._oDialog.close(); }.bind(this)
                })
            });

            this._oDialog.setModel(oUnitModel);
            this.getView().addDependent(this._oDialog);
            this._oDialog.open();
        },

        onNavigateToAddUnit: function () {
            this._openUnitDialog("add");
        },

        onEditUnit: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const oData = oContext.getObject();
            this._openUnitDialog("edit", oData);
        },

        onDelete: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const sUnitId = oContext.getProperty("unitId");
            MessageBox.confirm(`Delete Unit ${sUnitId}?`, {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        fetch(`/odata/v4/real-estate/Units('${encodeURIComponent(sUnitId)}')`, { method: "DELETE" })
                            .then(r => {
                                if (r.ok) {
                                    MessageToast.show("Deleted successfully!");
                                    this._loadUnits();
                                } else throw new Error("Delete failed");
                            })
                            .catch(err => MessageBox.error(err.message));
                    }
                }
            });
        }
    });
});
