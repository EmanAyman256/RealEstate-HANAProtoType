sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("dboperations.controller.PaymentPlans", {

        onInit: function () {
            this.oModel = this.getView().getModel();
            this._loadPlans();
        },

        // Load all payment plans
        _loadPlans: function () {
            fetch("/odata/v4/real-estate/PaymentPlans?$expand=schedule,assignedProjects($expand=project)")
                .then(res => res.json())
                .then(data => {
                    this.getView().setModel(new JSONModel(data.value || []), "plans");
                })
                .catch(err => console.error("Failed to load plans:", err));
        },

        // Show plan details dialog
       onShowPlanDetails: async function (oEvent) {
    const oCtx = oEvent.getSource().getBindingContext("plans");
    if (!oCtx) return;
    const sPlanId = oCtx.getProperty("paymentPlanId");

    try {
        // Fetch the plan with schedules and assigned projects
        const res = await fetch(
            `/odata/v4/real-estate/PaymentPlans(paymentPlanId='${sPlanId}')?$expand=schedule,assignedProjects($expand=project)`
        );
        if (!res.ok) throw new Error("Failed to load plan details");
        const oData = await res.json();
        const oPlan = oData.value ? oData.value[0] : oData;

        // Create JSONModel directly since fields are now strings
        const oDialogModel = new sap.ui.model.json.JSONModel(oPlan);

        // Create the dialog if it doesn't exist yet
        if (!this._oDetailsDialog) {
            this._oDetailsDialog = new sap.m.Dialog({
                title: "Payment Plan Details",
                contentWidth: "90%",
                resizable: true,
                draggable: true,
                content: [
                    new sap.m.IconTabBar({
                        items: [
                            new sap.m.IconTabFilter({
                                text: "General Info",
                                content: [
                                    new sap.ui.layout.form.SimpleForm({
                                        editable: false,
                                        content: [
                                            new sap.m.Label({ text: "Payment Plan ID" }),
                                            new sap.m.Text({ text: "{/paymentPlanId}" }),
                                            new sap.m.Label({ text: "Description" }),
                                            new sap.m.Text({ text: "{/description}" }),
                                            new sap.m.Label({ text: "Company Code" }),
                                            new sap.m.Text({ text: "{/companyCodeId}" }),
                                            new sap.m.Label({ text: "Years" }),
                                            new sap.m.Text({ text: "{/planYears}" }),
                                            new sap.m.Label({ text: "Valid From" }),
                                            new sap.m.Text({ text: "{/validFrom}" }),
                                            new sap.m.Label({ text: "Valid To" }),
                                            new sap.m.Text({ text: "{/validTo}" }),
                                            new sap.m.Label({ text: "Status" }),
                                            new sap.m.Text({ text: "{/planStatus}" })
                                        ]
                                    })
                                ]
                            }),
                            new sap.m.IconTabFilter({
                                text: "Schedules",
                                content: [
                                    new sap.m.Table({
                                        columns: [
                                            new sap.m.Column({ header: new sap.m.Label({ text: "Condition Type" }) }),
                                            new sap.m.Column({ header: new sap.m.Label({ text: "Base Price" }) }),
                                            new sap.m.Column({ header: new sap.m.Label({ text: "Calculation Method" }) }),
                                            new sap.m.Column({ header: new sap.m.Label({ text: "Frequency" }) }),
                                            new sap.m.Column({ header: new sap.m.Label({ text: "%" }) }),
                                            new sap.m.Column({ header: new sap.m.Label({ text: "Due (Months)" }) }),
                                            new sap.m.Column({ header: new sap.m.Label({ text: "Installments" }) }),
                                            new sap.m.Column({ header: new sap.m.Label({ text: "Years" }) })
                                        ],
                                        items: {
                                            path: "/schedule",
                                            template: new sap.m.ColumnListItem({
                                                cells: [
                                                    new sap.m.Text({ text: "{conditionType}" }),
                                                    new sap.m.Text({ text: "{basePrice}" }),
                                                    new sap.m.Text({ text: "{calculationMethod}" }),
                                                    new sap.m.Text({ text: "{frequency}" }),
                                                    new sap.m.Text({ text: "{percentage}" }),
                                                    new sap.m.Text({ text: "{dueInMonth}" }),
                                                    new sap.m.Text({ text: "{numberOfInstallments}" }),
                                                    new sap.m.Text({ text: "{numberOfYears}" })
                                                ]
                                            })
                                        }
                                    })
                                ]
                            }),
                            new sap.m.IconTabFilter({
                                text: "Assigned Projects",
                                content: [
                                    new sap.m.Table({
                                        columns: [
                                            new sap.m.Column({ header: new sap.m.Label({ text: "Project ID" }) }),
                                            new sap.m.Column({ header: new sap.m.Label({ text: "Description" }) })
                                        ],
                                        items: {
                                            path: "/assignedProjects",
                                            template: new sap.m.ColumnListItem({
                                                cells: [
                                                    new sap.m.Text({ text: "{project/projectId}" }),
                                                    new sap.m.Text({ text: "{project/projectDescription}" })
                                                ]
                                            })
                                        }
                                    })
                                ]
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

    } catch (err) {
        sap.m.MessageBox.error("Error: " + err.message);
    }
},


        // Open Add or Edit dialog
        onAddPlan: function () {
            this._openPlanDialog({});
        },

        onEditPlan: async function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext("plans");
            const sPlanId = oCtx.getProperty("paymentPlanId");

            try {
                const res = await fetch(`/odata/v4/real-estate/PaymentPlans(paymentPlanId='${sPlanId}')?$expand=schedule,assignedProjects($expand=project)`);
                if (!res.ok) throw new Error("Failed to load payment plan for edit");
                const oData = await res.json();
                const oPlan = oData.value ? oData.value[0] : oData;
                this._openPlanDialog(oPlan);
            } catch (err) {
                MessageBox.error("Error: " + err.message);
            }
        },

        // Open dialog using XML dialog
    _openPlanDialog: function (oPlan) {
    if (!this._oAddDialog) {
        this._oAddDialog = this.getView().byId("planDialog"); // use XML dialog
    }

    // Map the OData response arrays to dialog model arrays
    const oModel = new JSONModel({
        paymentPlanId: oPlan.paymentPlanId || "",
        description: oPlan.description || "",
        companyCodeId: oPlan.companyCodeId || "",
        planYears: oPlan.planYears || 0,
        validFrom: oPlan.validFrom || "",
        validTo: oPlan.validTo || "",
        planStatus: oPlan.planStatus || "",
        schedules: oPlan.schedule || [],           
        projects: (oPlan.assignedProjects || []).map(p => ({
            projectId: p.project?.projectId || "",
            projectDescription: p.project?.projectDescription || ""
        }))                                        
    });

    this._oAddDialog.setModel(oModel, "local");
    this._oAddDialog.open();
},


        // Save Plan
        onSavePlan: async function () {
            const oDialog = this._oAddDialog;
            const oModel = oDialog.getModel("local");
            const oData = oModel.getData();

            try {
                const payload = {
                    paymentPlanId: oData.paymentPlanId || this._generateUUID(),
                    description: oData.description,
                    companyCodeId: oData.companyCodeId,
                    planYears: oData.planYears,
                    validFrom: oData.validFrom,
                    validTo: oData.validTo,
                    planStatus: oData.planStatus,
                    schedule: oData.schedules || [],
                    assignedProjects: (oData.projects || []).map(p => ({ project: p.projectId ? { projectId: p.projectId } : null }))
                };

                const method = oData.paymentPlanId ? "PUT" : "POST";
                const url = oData.paymentPlanId
                    ? `/odata/v4/real-estate/PaymentPlans(paymentPlanId='${oData.paymentPlanId}')`
                    : `/odata/v4/real-estate/PaymentPlans`;

                const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error("Failed to save payment plan");
                MessageToast.show("Payment plan saved successfully!");
                oDialog.close();
                this._loadPlans(); // reload updated list

            } catch (err) {
                MessageBox.error("Error: " + err.message);
            }
        },

        onCancelPlan: function () {
            this._oAddDialog.close();
        },

        onAddScheduleRow: function () {
            const oModel = this._oAddDialog.getModel("local");
            const aSchedules = oModel.getProperty("/schedules");
            aSchedules.push({});
            oModel.refresh();
        },

        onDeleteScheduleRow: function () {
            const oModel = this._oAddDialog.getModel("local");
            const aSchedules = oModel.getProperty("/schedules");
            aSchedules.pop();
            oModel.refresh();
        },

        onAddProjectRow: function () {
            const oModel = this._oAddDialog.getModel("local");
            const aProjects = oModel.getProperty("/projects");
            aProjects.push({});
            oModel.refresh();
        },

        onDeleteProjectRow: function () {
            const oModel = this._oAddDialog.getModel("local");
            const aProjects = oModel.getProperty("/projects");
            aProjects.pop();
            oModel.refresh();
        },

        _generateUUID: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        onDeletePlan: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext("plans");
            const oData = oCtx.getObject();

            MessageBox.confirm(`Delete plan ${oData.paymentPlanId}?`, {
                onClose: async (sAction) => {
                    if (sAction === "OK") {
                        try {
                            const res = await fetch(`/odata/v4/real-estate/PaymentPlans('${oData.paymentPlanId}')`, { method: "DELETE" });
                            if (!res.ok) throw new Error("Delete failed");
                            MessageToast.show("Deleted successfully");
                            this._loadPlans();
                        } catch (err) {
                            MessageBox.error(err.message);
                        }
                    }
                }
            });
        }
    });
});
