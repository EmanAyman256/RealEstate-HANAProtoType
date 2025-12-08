sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("dboperations.controller.CalculationMethods", {

        onInit: function () {
            this._loadCalculationMethods();
        },

        // Load all CalculationMethods
        _loadCalculationMethods: function () {
            fetch("./odata/v4/real-estate/CalculationMethods")
                .then(res => res.json())
                .then(data => {
                    this.getView().setModel(new JSONModel(data.value || []), "calculationMethods");
                })
                .catch(err => console.error("Failed to load CalculationMethods:", err));
        },

        // Add new CalculationMethod
        onAddCalculationMethod: function () {
            this._openCalculationMethodDialog({});
        },

        // Edit existing CalculationMethod
        onEditCalculationMethod: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext("calculationMethods");
            const oData = oCtx.getObject();
            this._openCalculationMethodDialog(oData);
        },

        // Open dialog for add/edit
        _openCalculationMethodDialog: function (oCalculationMethod) {
            if (!this._oDialog) {
                this._oDialog = this.getView().byId("calculationMethodDialog");
            }

            const oModel = new JSONModel({
                code: oCalculationMethod.code || "",
                description: oCalculationMethod.description || "",
                isEdit: !!oCalculationMethod.code // Flag to disable code input on edit
            });

            this._oDialog.setModel(oModel, "local");
            this._oDialog.open();
        },

        // Save (Create or Update)
        onSaveCalculationMethod: async function () {
            const oDialog = this._oDialog;
            const oModel = oDialog.getModel("local");
            const oData = oModel.getData();

            if (!oData.code || !oData.description) {
                MessageBox.error("Code and Description are required.");
                return;
            }

            try {
                const method = oData.isEdit ? "PUT" : "POST";
                const url = oData.isEdit
                    ? `./odata/v4/real-estate/CalculationMethods(code='${oData.code}')`
                    : `./odata/v4/real-estate/CalculationMethods`;

                const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code: oData.code, description: oData.description })
                });

                if (!res.ok) throw new Error("Failed to save CalculationMethod");
                MessageToast.show("CalculationMethod saved successfully!");
                oDialog.close();
                this._loadCalculationMethods();

            } catch (err) {
                MessageBox.error("Error: " + err.message);
            }
        },

        // Cancel dialog
        onCancelCalculationMethod: function () {
            this._oDialog.close();
        },

        // Delete CalculationMethod
        onDeleteCalculationMethod: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext("calculationMethods");
            const oData = oCtx.getObject();

            MessageBox.confirm(`Delete CalculationMethod ${oData.code}?`, {
                onClose: async (sAction) => {
                    if (sAction === "OK") {
                        try {
                            const res = await fetch(`./odata/v4/real-estate/CalculationMethods(code='${oData.code}')`, { method: "DELETE" });
                            if (!res.ok) throw new Error("Delete failed");
                            MessageToast.show("Deleted successfully");
                            this._loadCalculationMethods();
                        } catch (err) {
                            MessageBox.error(err.message);
                        }
                    }
                }
            });
        }
    });
});