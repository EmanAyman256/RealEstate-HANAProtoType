sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/DatePicker",
    "sap/m/StepInput",
    "sap/m/MessageToast",
    "sap/ui/layout/form/SimpleForm",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageBox, Dialog, Input, Button, Label, DatePicker, StepInput, MessageToast, SimpleForm, JSONModel) {
    "use strict";

    return Controller.extend("dboperations.controller.PaymentPlans", {

        onInit: function () {
            this.getOwnerComponent().getRouter()
                .getRoute("PaymentPlans")
                .attachPatternMatched(this._onRouteMatched, this);

            this._loadPaymentPlans();
            this._loadPlanSchedule();
        },

        _onRouteMatched: function () {
            this._loadPaymentPlans();
            this._loadPlanSchedule()
        },

        _loadPaymentPlans: function () {
            const oModel = new JSONModel();
            fetch("/odata/v4/real-estate/PaymentPlans")
                .then(response => response.json())
                .then(data => {
                    oModel.setData({ PaymentPlans: data.value });
                    this.getView().byId("paymentPlansTable").setModel(oModel);
                })
                .catch(err => console.error("Error fetching PaymentPlans", err));
        },

        onNavigateToAddPaymentPlan: function () {
            if (!this._oAddDialog) {
                const oNewModel = new JSONModel({
                    paymentPlanId: "",
                    description: "",
                    companyCodeId: "",
                    planYears: "",
                    validFrom: "",
                    validTo: "",
                    planStatus: ""
                });

                this._oAddDialog = new Dialog({
                    title: "Add New Payment Plan",
                    content: new SimpleForm({
                        editable: true,
                        content: [
                            new Label({ text: "Payment Plan ID" }),
                            new Input({ value: "{/paymentPlanId}" }),
                            new Label({ text: "Description" }),
                            new Input({ value: "{/description}" }),
                            new Label({ text: "Company Code ID" }),
                            new Input({ value: "{/companyCodeId}" }),
                            new Label({ text: "Plan Years" }),
                            new StepInput({ value: "{/planYears}", min: 0, step: 1 }),
                            new Label({ text: "Valid From" }),
                            new DatePicker({ value: "{/validFrom}", valueFormat: "yyyy-MM-dd", displayFormat: "long" }),
                            new Label({ text: "Valid To" }),
                            new DatePicker({ value: "{/validTo}", valueFormat: "yyyy-MM-dd", displayFormat: "long" }),
                            new Label({ text: "Plan Status" }),
                            new Input({ value: "{/planStatus}" })
                        ]
                    }),
                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",
                        press: function () {
                            const oData = this._oAddDialog.getModel().getData();
                            fetch("/odata/v4/real-estate/PaymentPlans", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(oData)
                            })
                                .then(response => {
                                    if (!response.ok) throw new Error("Failed to create Payment Plan");
                                    return response.json();
                                })
                                .then(() => {
                                    MessageToast.show("Payment Plan created successfully!");
                                    this._loadPaymentPlans();
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

                this._oAddDialog.setModel(oNewModel);
                this.getView().addDependent(this._oAddDialog);
            }
            this._oAddDialog.open();
        },

        onDetails: function (oEvent) {
            const oData = oEvent.getSource().getBindingContext().getObject();
            const oDialogModel = new JSONModel(oData);

            if (!this._oDetailsDialog) {
                this._oDetailsDialog = new Dialog({
                    title: "Payment Plan Details",
                    content: new SimpleForm({
                        editable: false,
                        content: [
                            new Label({ text: "Payment Plan ID" }),
                            new sap.m.Text({ text: "{/paymentPlanId}" }),
                            new Label({ text: "Description" }),
                            new sap.m.Text({ text: "{/description}" }),
                            new Label({ text: "Company Code ID" }),
                            new sap.m.Text({ text: "{/companyCodeId}" }),
                            new Label({ text: "Plan Years" }),
                            new sap.m.Text({ text: "{/planYears}" }),
                            new Label({ text: "Valid From" }),
                            new sap.m.Text({ text: "{/validFrom}" }),
                            new Label({ text: "Valid To" }),
                            new sap.m.Text({ text: "{/validTo}" }),
                            new Label({ text: "Plan Status" }),
                            new sap.m.Text({ text: "{/planStatus}" })
                        ]
                    }),
                    endButton: new Button({
                        text: "OK",
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

        onEditPaymentPlan: function (oEvent) {
            const oData = oEvent.getSource().getBindingContext().getObject();
            const oDialogModel = new JSONModel(Object.assign({}, oData));

            if (!this._oEditDialog) {
                this._oEditDialog = new Dialog({
                    title: "Edit Payment Plan",
                    content: new SimpleForm({
                        editable: true,
                        content: [
                            new Label({ text: "Payment Plan ID" }),
                            new Input({ value: "{/paymentPlanId}", editable: false }),
                            new Label({ text: "Description" }),
                            new Input({ value: "{/description}" }),
                            new Label({ text: "Company Code ID" }),
                            new Input({ value: "{/companyCodeId}" }),
                            new Label({ text: "Plan Years" }),
                            new StepInput({ value: "{/planYears}", min: 0, step: 1 }),
                            new Label({ text: "Valid From" }),
                            new DatePicker({ value: "{/validFrom}", valueFormat: "yyyy-MM-dd", displayFormat: "long" }),
                            new Label({ text: "Valid To" }),
                            new DatePicker({ value: "{/validTo}", valueFormat: "yyyy-MM-dd", displayFormat: "long" }),
                            new Label({ text: "Plan Status" }),
                            new Input({ value: "{/planStatus}" })
                        ]
                    }),
                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",
                        press: function () {
                            const oUpdated = this._oEditDialog.getModel().getData();
                            fetch(`/odata/v4/real-estate/PaymentPlans(paymentPlanId='${oUpdated.paymentPlanId}')`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(oUpdated)
                            })
                                .then(response => {
                                    if (!response.ok) throw new Error("Update failed");
                                    return response.json();
                                })
                                .then(() => {
                                    MessageToast.show("Payment Plan updated successfully!");
                                    this._loadPaymentPlans();
                                    this._oEditDialog.close();
                                })
                                .catch(err => MessageBox.error("Error: " + err.message));
                        }.bind(this)
                    }),
                    endButton: new Button({
                        text: "Cancel",
                        press: function () {
                            this._oEditDialog.close();
                        }.bind(this)
                    })
                });
                this.getView().addDependent(this._oEditDialog);
            }

            this._oEditDialog.setModel(oDialogModel);
            this._oEditDialog.open();
        },

        onDelete: function (oEvent) {
            const oModel = this.getView().byId("paymentPlansTable").getModel();
            const oData = oEvent.getSource().getBindingContext().getObject();

            MessageBox.confirm(`Delete Payment Plan ${oData.paymentPlanId}?`, {
                title: "Confirm Deletion",
                onClose: (action) => {
                    if (action === MessageBox.Action.OK) {
                        fetch(`/odata/v4/real-estate/PaymentPlans(paymentPlanId='${oData.paymentPlanId}')`, {
                            method: "DELETE"
                        })
                            .then(response => {
                                if (!response.ok) throw new Error("Deletion failed");
                                const aPlans = oModel.getProperty("/PaymentPlans");
                                const iIndex = aPlans.findIndex(p => p.paymentPlanId === oData.paymentPlanId);
                                if (iIndex > -1) {
                                    aPlans.splice(iIndex, 1);
                                    oModel.setProperty("/PaymentPlans", aPlans);
                                }
                                MessageToast.show("Payment Plan deleted successfully!");
                            })
                            .catch(err => MessageBox.error("Error: " + err.message));
                    }
                }
            });
        },
        /*  ____ Plan Schedule Functions ____   */
        _loadPlanSchedule: function () {
            const oModel = new JSONModel();
            fetch("/odata/v4/real-estate/PaymentPlanSchedules")
                .then(response => response.json())
                .then(data => {
                    oModel.setData({ PaymentPlanSchedules: data.value });
                    this.getView().byId("paymentPlanScheduleTable").setModel(oModel);
                })
                .catch(err => console.error("Error fetching PaymentPlans", err));
        }
        ,
        onNavigateToAddPlanSchedule: function () {
            if (!this._oAddDialog) {
                const oNewModel = new JSONModel({
                    ID: "",
                    conditionType: "",
                    percentage: "",
                    basePrice: "",
                    calculationMethod: "",
                    frequency: "",
                    dueInMonth:null,
                    numberOfInstallments: null,
                    numberOfYears: null

                });

                this._oAddDialog = new Dialog({
                    title: "Add New Payment Plan",
                    content: new SimpleForm({
                        editable: true,
                        content: [
                            new Label({ text: "Plan Schedule Id" }),
                            new Input({ value: "{/ID}" }),
                            new Label({ text: "Condition Type" }),
                            new Input({ value: "{/conditionType}" }),
                            new Label({ text: "Percentage" }),
                            new Input({ value: "{/percentage}" }),
                            new Label({ text: "Base Price" }),
                            new Input({ value: "{/basePrice}" }),
                            new Label({ text: "Calculation Method" }),
                            new Input({ value: "{/calculationMethod}" }),
                            new Label({ text: "Frequency" }),
                            new Input({ value: "{/frequency}" }),
                            new Label({ text: "Due In Month" }),
                            new Input({ value: "{/dueInMonth}" }),
                            new Label({ text: "Number Of Installments" }),
                            new Input({ value: "{/numberOfInstallments}" }),
                            new Label({ text: "Number Of Years" }),
                            new Input({ value: "{/numberOfYears}" })
                        ]
                    }),
                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",
                        press: function () {
                            const oData = this._oAddDialog.getModel().getData();
                            fetch("/odata/v4/real-estate/PaymentPlanSchedules", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(oData)
                            })
                                .then(response => {
                                    if (!response.ok) throw new Error("Failed to create Plan Schedule");
                                    return response.json();
                                })
                                .then(() => {
                                    MessageToast.show(" PlanSched created successfully!");
                                    this._loadPlanSchedule();
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

                this._oAddDialog.setModel(oNewModel);
                this.getView().addDependent(this._oAddDialog);
            }
            this._oAddDialog.open();
        },
    });
});
