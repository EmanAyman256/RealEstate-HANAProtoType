sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/DatePicker",
    "sap/ui/layout/form/SimpleForm",
    "sap/ui/model/json/JSONModel",
    "sap/m/IconTabBar",
    "sap/m/IconTabFilter",
    "sap/m/Text",
    "sap/m/TextArea"
], function (Controller, MessageBox, Dialog, Input, Button, Label, DatePicker, SimpleForm, JSONModel, IconTabBar, IconTabFilter, Text, TextArea) {
    "use strict";

    return Controller.extend("dboperations.controller.Reservations", {

        onInit: function () {
            this._loadReservations();
        },

        _loadReservations: function () {
            const oModel = new JSONModel();
            fetch("/odata/v4/real-estate/Reservations")
                .then(res => res.json())
                .then(data => {
                    oModel.setData({ Reservations: data.value });
                    this.getView().byId("reservationsTable").setModel(oModel);
                })
                .catch(err => console.error("Error loading reservations:", err));
        },

        onAddReservation: function () {
            if (!this._oAddDialog) {
                const oDataModel = new JSONModel({
                    reservationId: "",
                    companyCodeId: "",
                    oldReservationId: "",
                    eoiId: "",
                    description: "",
                    salesType: "",
                    status: "",
                    customerType: "",
                    currency: "",
                    validFrom: "",
                    project_projectId: "",
                    building_buildingId: "",
                    unit_unitId: "",
                    bua: "",
                    phase: "",
                    pricePlanYears: "",
                    planYears: "",
                    unitPrice: "",
                    planCurrency: "",
                    requestType: "",
                    reason: "",
                    cancellationDate: "",
                    cancellationStatus: "",
                    rejectionReason: "",
                    cancellationFees: "",
                    paymentPlan_paymentPlanId: ""
                });

                this._oAddDialog = new Dialog({
                    title: "Add Reservation",
                    resizable: true,
                    contentWidth: "90%",
                    content: new SimpleForm({
                        editable: true,
                        content: [
                            new Label({ text: "Reservation ID" }),
                            new Input({ value: "{/reservationId}" }),

                            new Label({ text: "Company Code" }),
                            new Input({ value: "{/companyCodeId}" }),

                            new Label({ text: "Old Reservation ID" }),
                            new Input({ value: "{/oldReservationId}" }),

                            new Label({ text: "EOI ID" }),
                            new Input({ value: "{/eoiId}" }),

                            new Label({ text: "Description" }),
                            new Input({ value: "{/description}" }),

                            new Label({ text: "Sales Type" }),
                            new Input({ value: "{/salesType}" }),

                            new Label({ text: "Customer Type" }),
                            new Input({ value: "{/customerType}" }),

                            new Label({ text: "Status" }),
                            new Input({ value: "{/status}" }),

                            new Label({ text: "Currency" }),
                            new Input({ value: "{/currency}" }),

                            new Label({ text: "Valid From" }),
                            new DatePicker({ value: "{/validFrom}", valueFormat: "yyyy-MM-dd" }),

                            new Label({ text: "Project ID" }),
                            new Input({ value: "{/project_projectId}" }),

                            new Label({ text: "Building ID" }),
                            new Input({ value: "{/building_buildingId}" }),

                            new Label({ text: "Unit ID" }),
                            new Input({ value: "{/unit_unitId}" }),

                            new Label({ text: "Payment Plan ID" }),
                            new Input({ value: "{/paymentPlan_paymentPlanId}" }),

                            new Label({ text: "BUA" }),
                            new Input({ value: "{/bua}" }),

                            new Label({ text: "Phase" }),
                            new Input({ value: "{/phase}" }),

                            new Label({ text: "Price Plan Years" }),
                            new Input({ value: "{/pricePlanYears}" }),

                            new Label({ text: "Plan Years" }),
                            new Input({ value: "{/planYears}" }),

                            new Label({ text: "Unit Price" }),
                            new Input({ value: "{/unitPrice}" }),

                            new Label({ text: "Plan Currency" }),
                            new Input({ value: "{/planCurrency}" }),

                            new Label({ text: "Request Type" }),
                            new Input({ value: "{/requestType}" }),

                            new Label({ text: "Reason" }),
                            new Input({ value: "{/reason}" }),

                            new Label({ text: "Cancellation Date" }),
                            new DatePicker({ value: "{/cancellationDate}", valueFormat: "yyyy-MM-dd" }),

                            new Label({ text: "Cancellation Status" }),
                            new Input({ value: "{/cancellationStatus}" }),

                            new Label({ text: "Rejection Reason" }),
                            new Input({ value: "{/rejectionReason}" }),

                            new Label({ text: "Cancellation Fees" }),
                            new Input({ value: "{/cancellationFees}" })
                        ]
                    }),
                    beginButton: new Button({
                        text: "Save",
                        press: function () {
                            const oData = this._oAddDialog.getModel().getData();

                            fetch("/odata/v4/real-estate/Reservations", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(oData)
                            })
                                .then(res => {
                                    if (!res.ok) throw new Error("Failed to create reservation");
                                    return res.json();
                                })
                                .then(() => {
                                    MessageBox.success("Reservation created successfully!");
                                    this._loadReservations();
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

                this._oAddDialog.setModel(oDataModel);
                this.getView().addDependent(this._oAddDialog);
            }
            this._oAddDialog.open();
        },


        onDetails: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext();
            const oData = oCtx.getObject();
            const oDialogModel = new sap.ui.model.json.JSONModel(oData);

            if (!this._oDetailsDialog) {
                this._oDetailsDialog = new sap.m.Dialog({
                    title: "Reservation Details",
                    contentWidth: "90%",
                    resizable: true,
                    content: [
                        new sap.m.IconTabBar({
                            expandable: true,
                            items: [
                                // 🟢 General Info Tab
                                new sap.m.IconTabFilter({
                                    text: "General Data",
                                    icon: "sap-icon://customer-history",
                                    content: new sap.ui.layout.form.SimpleForm({
                                        editable: false,
                                        content: [
                                            new sap.m.Label({ text: "Reservation ID" }),
                                            new sap.m.Text({ text: "{/reservationId}" }),

                                            new sap.m.Label({ text: "Company Code" }),
                                            new sap.m.Text({ text: "{/companyCodeId}" }),

                                            new sap.m.Label({ text: "Old Reservation ID" }),
                                            new sap.m.Text({ text: "{/oldReservationId}" }),

                                            new sap.m.Label({ text: "EOI ID" }),
                                            new sap.m.Text({ text: "{/eoiId}" }),

                                            new sap.m.Label({ text: "Description" }),
                                            new sap.m.Text({ text: "{/description}" }),

                                            new sap.m.Label({ text: "Sales Type" }),
                                            new sap.m.Text({ text: "{/salesType}" }),

                                            new sap.m.Label({ text: "Customer Type" }),
                                            new sap.m.Text({ text: "{/customerType}" }),

                                            new sap.m.Label({ text: "Status" }),
                                            new sap.m.Text({ text: "{/status}" }),

                                            new sap.m.Label({ text: "Currency" }),
                                            new sap.m.Text({ text: "{/currency}" }),

                                            new sap.m.Label({ text: "Valid From" }),
                                            new sap.m.Text({ text: "{/validFrom}" })
                                        ]
                                    })
                                }),

                                // 🏗️ Unit & Project Info
                                new sap.m.IconTabFilter({
                                    text: "Unit Details",
                                    icon: "sap-icon://building",
                                    content: new sap.ui.layout.form.SimpleForm({
                                        editable: false,
                                        content: [
                                            new sap.m.Label({ text: "Project ID" }),
                                            new sap.m.Text({ text: "{/project_projectId}" }),

                                            new sap.m.Label({ text: "Building ID" }),
                                            new sap.m.Text({ text: "{/building_buildingId}" }),

                                            new sap.m.Label({ text: "Unit ID" }),
                                            new sap.m.Text({ text: "{/unit_unitId}" }),

                                            new sap.m.Label({ text: "BUA" }),
                                            new sap.m.Text({ text: "{/bua}" }),

                                            new sap.m.Label({ text: "Phase" }),
                                            new sap.m.Text({ text: "{/phase}" }),

                                            new sap.m.Label({ text: "Price Plan Years" }),
                                            new sap.m.Text({ text: "{/pricePlanYears}" })
                                        ]
                                    })
                                }),

                                // 💰 Payment & Plan Info
                                new sap.m.IconTabFilter({
                                    text: "Payment Info",
                                    icon: "sap-icon://money-bills",
                                    content: new sap.ui.layout.form.SimpleForm({
                                        editable: false,
                                        content: [
                                            new sap.m.Label({ text: "Payment Plan ID" }),
                                            new sap.m.Text({ text: "{/paymentPlan_paymentPlanId}" }),

                                            new sap.m.Label({ text: "Plan Years" }),
                                            new sap.m.Text({ text: "{/planYears}" }),

                                            new sap.m.Label({ text: "Unit Price" }),
                                            new sap.m.Text({ text: "{/unitPrice}" }),

                                            new sap.m.Label({ text: "Plan Currency" }),
                                            new sap.m.Text({ text: "{/planCurrency}" })
                                        ]
                                    })
                                }),

                                // ❌ Cancellation Info
                                new sap.m.IconTabFilter({
                                    text: "Cancellation Info",
                                    icon: "sap-icon://cancel",
                                    content: new sap.ui.layout.form.SimpleForm({
                                        editable: false,
                                        content: [
                                            new sap.m.Label({ text: "Request Type" }),
                                            new sap.m.Text({ text: "{/requestType}" }),

                                            new sap.m.Label({ text: "Reason" }),
                                            new sap.m.Text({ text: "{/reason}" }),

                                            new sap.m.Label({ text: "Cancellation Date" }),
                                            new sap.m.Text({ text: "{/cancellationDate}" }),

                                            new sap.m.Label({ text: "Cancellation Status" }),
                                            new sap.m.Text({ text: "{/cancellationStatus}" }),

                                            new sap.m.Label({ text: "Rejection Reason" }),
                                            new sap.m.Text({ text: "{/rejectionReason}" }),

                                            new sap.m.Label({ text: "Cancellation Fees" }),
                                            new sap.m.Text({ text: "{/cancellationFees}" })
                                        ]
                                    })
                                })
                            ]
                        })
                    ],
                    endButton: new sap.m.Button({
                        text: "Close",
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


       onEditReservation: function (oEvent) {
    const oCtx = oEvent.getSource().getBindingContext();
    const oData = { ...oCtx.getObject() };
    const oModel = new sap.ui.model.json.JSONModel(oData);

    const oDialog = new sap.m.Dialog({
        title: "Edit Reservation",
        resizable: true,
        contentWidth: "90%",
        content: [
            new sap.m.IconTabBar({
                expandable: true,
                items: [
                    // 🟢 General Info
                    new sap.m.IconTabFilter({
                        text: "General Data",
                        icon: "sap-icon://customer-history",
                        content: new sap.ui.layout.form.SimpleForm({
                            editable: true,
                            content: [
                                new sap.m.Label({ text: "Reservation ID" }),
                                new sap.m.Input({ value: "{/reservationId}", editable: false }),

                                new sap.m.Label({ text: "Company Code" }),
                                new sap.m.Input({ value: "{/companyCodeId}" }),

                                new sap.m.Label({ text: "Old Reservation ID" }),
                                new sap.m.Input({ value: "{/oldReservationId}" }),

                                new sap.m.Label({ text: "EOI ID" }),
                                new sap.m.Input({ value: "{/eoiId}" }),

                                new sap.m.Label({ text: "Description" }),
                                new sap.m.Input({ value: "{/description}" }),

                                new sap.m.Label({ text: "Sales Type" }),
                                new sap.m.Input({ value: "{/salesType}" }),

                                new sap.m.Label({ text: "Customer Type" }),
                                new sap.m.Input({ value: "{/customerType}" }),

                                new sap.m.Label({ text: "Status" }),
                                new sap.m.Input({ value: "{/status}" }),

                                new sap.m.Label({ text: "Currency" }),
                                new sap.m.Input({ value: "{/currency}" }),

                                new sap.m.Label({ text: "Valid From" }),
                                new sap.m.DatePicker({
                                    value: "{/validFrom}",
                                    valueFormat: "yyyy-MM-dd"
                                })
                            ]
                        })
                    }),

                    // 🏗️ Unit Details
                    new sap.m.IconTabFilter({
                        text: "Unit Details",
                        icon: "sap-icon://building",
                        content: new sap.ui.layout.form.SimpleForm({
                            editable: true,
                            content: [
                                new sap.m.Label({ text: "Project ID" }),
                                new sap.m.Input({ value: "{/project_projectId}" }),

                                new sap.m.Label({ text: "Building ID" }),
                                new sap.m.Input({ value: "{/building_buildingId}" }),

                                new sap.m.Label({ text: "Unit ID" }),
                                new sap.m.Input({ value: "{/unit_unitId}" }),

                                new sap.m.Label({ text: "BUA" }),
                                new sap.m.Input({ value: "{/bua}" }),

                                new sap.m.Label({ text: "Phase" }),
                                new sap.m.Input({ value: "{/phase}" }),

                                new sap.m.Label({ text: "Price Plan Years" }),
                                new sap.m.Input({ value: "{/pricePlanYears}" })
                            ]
                        })
                    }),

                    // 💰 Payment Info
                    new sap.m.IconTabFilter({
                        text: "Payment Info",
                        icon: "sap-icon://money-bills",
                        content: new sap.ui.layout.form.SimpleForm({
                            editable: true,
                            content: [
                                new sap.m.Label({ text: "Payment Plan ID" }),
                                new sap.m.Input({ value: "{/paymentPlan_paymentPlanId}" }),

                                new sap.m.Label({ text: "Plan Years" }),
                                new sap.m.Input({ value: "{/planYears}" }),

                                new sap.m.Label({ text: "Unit Price" }),
                                new sap.m.Input({ value: "{/unitPrice}" }),

                                new sap.m.Label({ text: "Plan Currency" }),
                                new sap.m.Input({ value: "{/planCurrency}" })
                            ]
                        })
                    }),

                    // ❌ Cancellation Info
                    new sap.m.IconTabFilter({
                        text: "Cancellation Info",
                        icon: "sap-icon://cancel",
                        content: new sap.ui.layout.form.SimpleForm({
                            editable: true,
                            content: [
                                new sap.m.Label({ text: "Request Type" }),
                                new sap.m.Input({ value: "{/requestType}" }),

                                new sap.m.Label({ text: "Reason" }),
                                new sap.m.Input({ value: "{/reason}" }),

                                new sap.m.Label({ text: "Cancellation Date" }),
                                new sap.m.DatePicker({
                                    value: "{/cancellationDate}",
                                    valueFormat: "yyyy-MM-dd"
                                }),

                                new sap.m.Label({ text: "Cancellation Status" }),
                                new sap.m.Input({ value: "{/cancellationStatus}" }),

                                new sap.m.Label({ text: "Rejection Reason" }),
                                new sap.m.Input({ value: "{/rejectionReason}" }),

                                new sap.m.Label({ text: "Cancellation Fees" }),
                                new sap.m.Input({ value: "{/cancellationFees}" })
                            ]
                        })
                    })
                ]
            })
        ],
        beginButton: new sap.m.Button({
            text: "Save",
            press: function () {
                const updatedData = oModel.getData();

                fetch(`/odata/v4/real-estate/Reservations(reservationId='${updatedData.reservationId}')`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedData)
                })
                    .then(res => {
                        if (!res.ok) throw new Error("Failed to update reservation");
                        return res.json();
                    })
                    .then(() => {
                        sap.m.MessageBox.success("Reservation updated successfully!");
                        this._loadReservations();
                        oDialog.close();
                    })
                    .catch(err => sap.m.MessageBox.error("Error: " + err.message));
            }.bind(this)
        }),
        endButton: new sap.m.Button({
            text: "Cancel",
            press: function () {
                oDialog.close();
            }
        })
    });

    oDialog.setModel(oModel);
    this.getView().addDependent(oDialog);
    oDialog.open();
},


        onDelete: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext();
            const oData = oCtx.getObject();

            MessageBox.confirm(`Delete Reservation ${oData.reservationId}?`, {
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        fetch(`/odata/v4/real-estate/Reservations(reservationId='${oData.reservationId}')`, { method: "DELETE" })
                            .then(res => {
                                if (!res.ok) throw new Error("Failed to delete");
                                MessageBox.success("Deleted successfully!");
                                this._loadReservations();
                            })
                            .catch(err => MessageBox.error(err.message));
                    }
                }
            });
        }
    });
});
