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

    return Controller.extend("dboperations.controller.EOI", {

        onInit: function () {
            this._loadEOIs();
            this.getView().setModel(new JSONModel({ eoiDetails: [] }), "eoi");
            this._selectedEoiId = null;
        },

        _loadEOIs: function () {
            const oModel = new JSONModel();
            fetch("/odata/v4/real-estate/EOI?$expand=paymentDetails")
                .then(res => res.json())
                .then(data => {
                    oModel.setData({ EOI: data.value || [] });
                    this.getView().setModel(oModel); // ✅ set on view
                })
                .catch(err => {
                    console.error("Error loading EOIs:", err);
                    MessageBox.error("Error loading EOIs: " + err.message);
                });
        },

        onSelectEOI: function (oEvent) {
            const oListItem = oEvent.getParameter("listItem");
            if (!oListItem) return;
            const oCtx = oListItem.getBindingContext();
            const oEoi = oCtx.getObject();
            this._selectedEoiId = oEoi.eoiId;
            const oEoiModel = new JSONModel({ eoiDetails: [oEoi] });
            this.getView().setModel(oEoiModel, "eoi");
        },

        onNavigateToAddEOI: function () {
            const oData = {
                eoiId: "",
                eoiType: "",
                status: "",
                date: "",
                companyCode: "",
                projectId: "",
                totalEoiValue: 0,
                collectedAmount: 0,
                remainingAmount: 0,
                nationality: "",
                mobile1: "",
                customerId: "",
                validatedBy: "",
                validatedOn: "",
                paymentDetails: []
            };
            const oModel = new JSONModel(oData);

            if (!this._oAddDialog) {
                this._oAddDialog = new Dialog({
                    title: "Add / Edit EOI",
                    contentWidth: "100%",
                    resizable: true,
                    draggable: true,
                    content: new VBox({ items: this._createAddEditForm() }),
                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",
                        press: this.onSaveEOI.bind(this)
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

        onEditEOI: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext();
            if (!oCtx) return MessageBox.warning("Unable to get EOI context.");
            const oData = Object.assign({}, oCtx.getObject());
            const oModel = new JSONModel(oData);

            if (!this._oAddDialog) {
                this._oAddDialog = new Dialog({
                    title: "Add / Edit EOI",
                    contentWidth: "100%",
                    resizable: true,
                    draggable: true,
                    content: new VBox({ items: this._createAddEditForm() }),
                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",
                        press: this.onSaveEOI.bind(this)
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
                new Label({ text: "EOI ID" }), new Input({ value: "{/eoiId}", editable: "{= ${/eoiId} === '' }" }),
                new Label({ text: "EOI Type" }), new Input({ value: "{/eoiType}" }),
                new Label({ text: "Status" }), new Input({ value: "{/status}" }),
                new Label({ text: "Date" }), new DatePicker({ value: "{/date}", valueFormat: "yyyy-MM-dd" }),
                new Label({ text: "Company Code" }), new Input({ value: "{/companyCode}" }),
                new Label({ text: "Project ID" }), new Input({ value: "{/projectId}" }),
                new Label({ text: "Total EOI Value" }), new Input({ value: "{/totalEoiValue}", type: "Number" }),
                new Label({ text: "Collected Amount" }), new Input({ value: "{/collectedAmount}", type: "Number" }),
                new Label({ text: "Remaining Amount" }), new Input({ value: "{/remainingAmount}", type: "Number" }),
                new Label({ text: "Customer ID" }), new Input({ value: "{/customerId}" }),
                new Label({ text: "Nationality" }), new Input({ value: "{/nationality}" }),
                new Label({ text: "Mobile 1" }), new Input({ value: "{/mobile1}" }),
                new Label({ text: "Validated By" }), new Input({ value: "{/validatedBy}" }),
                new Label({ text: "Validated On" }), new DatePicker({ value: "{/validatedOn}", valueFormat: "yyyy-MM-dd" }),

                new Title({ text: "Payment Details", level: "H3" }),
                new Button({ text: "Add Payment", press: this.onAddPaymentRow.bind(this) }),
                new Table({
                    id: "paymentDetailsTable",
                    items: "{/paymentDetails}",
                    columns: [
                        new Column({ header: new Label({ text: "Receipt Type" }) }),
                        new Column({ header: new Label({ text: "Status" }) }),
                        new Column({ header: new Label({ text: "Payment Method" }) }),
                        new Column({ header: new Label({ text: "Amount" }) }),
                        new Column({ header: new Label({ text: "Due Date" }) }),
                        new Column({ header: new Label({ text: "House Bank" }) }),
                        new Column({ header: new Label({ text: "Collected Amount" }) })
                    ],
                    items: {
                        path: "/paymentDetails",
                        template: new ColumnListItem({
                            cells: [
                                new Input({ value: "{receiptType}" }),
                                new Input({ value: "{receiptStatus}" }),
                                new Input({ value: "{paymentMethod}" }),
                                new Input({ value: "{amount}", type: "Number" }),
                                new DatePicker({ value: "{dueDate}", valueFormat: "yyyy-MM-dd" }),
                                new Input({ value: "{houseBank}" }),
                                new Input({ value: "{collectedAmount}", type: "Number" })
                            ]
                        })
                    }
                })
            ];
        },

        onSaveEOI: function () {
            const oData = this._oAddDialog.getModel().getData();
            const payload = Object.assign({}, oData);
            payload.eoiId = oData.eoiId || Date.now().toString().slice(-8);

            const isEdit = !!oData.eoiId;
            const method = isEdit ? "PATCH" : "POST";
            const url = isEdit
                ? `/odata/v4/real-estate/EOI(eoiId='${encodeURIComponent(oData.eoiId)}')`
                : "/odata/v4/real-estate/EOI";

            fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
                .then(r => { if (!r.ok) throw new Error(isEdit ? "Update failed" : "Create failed"); })
                .then(() => {
                    this._loadEOIs();
                    this.getView().getModel()?.refresh(true);
                    MessageBox.success(isEdit ? "EOI updated successfully!" : "EOI created successfully!");
                    this._oAddDialog.close();
                })
                .catch(e => MessageBox.error(e.message));
        },


        onAddPaymentRow: function () {
            const oModel = this._oAddDialog.getModel();
            oModel.getProperty("/paymentDetails").push({
                receiptType: "",
                receiptStatus: "",
                paymentMethod: "",
                amount: 0,
                dueDate: "",
                houseBank: "",
                collectedAmount: 0
            });
            oModel.refresh();
        }
    });
});
