sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("dboperations.controller.BasePrices", {

        onInit: function () {
            this._loadBasePrices();
        },

        // Load all BasePrices
        _loadBasePrices: function () {
            fetch("./odata/v4/real-estate/BasePrices")
                .then(res => res.json())
                .then(data => {
                    this.getView().setModel(new JSONModel(data.value || []), "basePrices");
                })
                .catch(err => console.error("Failed to load BasePrices:", err));
        },

        // Add new BasePrice
        onAddBasePrice: function () {
            this._openBasePriceDialog({});
        },

        // Edit existing BasePrice
        onEditBasePrice: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext("basePrices");
            const oData = oCtx.getObject();
            this._openBasePriceDialog(oData);
        },

        // Open dialog for add/edit
        _openBasePriceDialog: function (oBasePrice) {
            if (!this._oDialog) {
                this._oDialog = this.getView().byId("basePriceDialog");
            }

            const oModel = new JSONModel({
                code: oBasePrice.code || "",
                description: oBasePrice.description || "",
                isEdit: !!oBasePrice.code // Flag to disable code input on edit
            });

            this._oDialog.setModel(oModel, "local");
            this._oDialog.open();
        },

        // Save (Create or Update)
        onSaveBasePrice: async function () {
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
                    ? `./odata/v4/real-estate/BasePrices(code='${oData.code}')`
                    : `./odata/v4/real-estate/BasePrices`;

                const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code: oData.code, description: oData.description })
                });

                if (!res.ok) throw new Error("Failed to save BasePrice");
                MessageToast.show("BasePrice saved successfully!");
                oDialog.close();
                this._loadBasePrices();

            } catch (err) {
                MessageBox.error("Error: " + err.message);
            }
        },

        // Cancel dialog
        onCancelBasePrice: function () {
            this._oDialog.close();
        },

        // Delete BasePrice
        onDeleteBasePrice: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext("basePrices");
            const oData = oCtx.getObject();

            MessageBox.confirm(`Delete BasePrice ${oData.code}?`, {
                onClose: async (sAction) => {
                    if (sAction === "OK") {
                        try {
                            const res = await fetch(`./odata/v4/real-estate/BasePrices(code='${oData.code}')`, { method: "DELETE" });
                            if (!res.ok) throw new Error("Delete failed");
                            MessageToast.show("Deleted successfully");
                            this._loadBasePrices();
                        } catch (err) {
                            MessageBox.error(err.message);
                        }
                    }
                }
            });
        }
    });
});