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

        _loadPlans: function () {
            fetch("/odata/v4/real-estate/PaymentPlans")
                .then(res => res.json())
                .then(data => {
                    this.getView().setModel(new JSONModel(data.value), "plans");
                })
                .catch(err => console.error(err));
        },

        onAddPlan: function () {
            if (!this._oAddDialog) {
                const oNewPlanModel = new JSONModel({
                    paymentPlanId: "",
                    description: "",
                    companyCodeId: "",
                    planYears: 0,
                    validFrom: "",
                    validTo: "",
                    planStatus: "",
                    schedules: [],
                    projects: []
                });

                this._oAddDialog = new sap.m.Dialog({
                    title: "Add Payment Plan",
                    content: new sap.m.VBox({
                        items: [
                            new sap.m.Label({ text: "Company Code ID" }),
                            new sap.m.Input({ value: "{/companyCodeId}" }),

                            new sap.m.Label({ text: "Description" }),
                            new sap.m.Input({ value: "{/description}" }),

                            new sap.m.Label({ text: "Plan Years" }),
                            new sap.m.Input({ value: "{/planYears}", type: "Number" }),

                            new sap.m.Label({ text: "Valid From" }),
                            new sap.m.DatePicker({ value: "{/validFrom}", valueFormat: "yyyy-MM-dd", displayFormat: "long" }),

                            new sap.m.Label({ text: "Valid To" }),
                            new sap.m.DatePicker({ value: "{/validTo}", valueFormat: "yyyy-MM-dd", displayFormat: "long" }),

                            new sap.m.Label({ text: "Plan Status" }),
                            new sap.m.Input({ value: "{/planStatus}" }),

                            new sap.m.Title({ text: "Schedules" }),
                            new sap.m.Toolbar({
                                content: [
                                    new sap.m.Button({ text: "Add Row", press: this.onAddScheduleRow.bind(this) }),
                                    new sap.m.Button({ text: "Delete Row", press: this.onDeleteScheduleRow.bind(this) })
                                ]
                            }),
                            new sap.m.Table({
                                id: "scheduleTable",
                                items: "{/schedules}",
                                columns: [
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Condition Type" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Base Price" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Calc. Method" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Frequency" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "%" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Due (Months)" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Installments" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Years" }) })
                                ],
                                items: {
                                    path: "/schedules",
                                    template: new sap.m.ColumnListItem({
                                        cells: [
                                            new sap.m.Input({ value: "{conditionType}" }),
                                            new sap.m.Input({ value: "{basePrice}" }),
                                            new sap.m.Input({ value: "{calculationMethod}" }),
                                            new sap.m.Input({ value: "{frequency}" }),
                                            new sap.m.Input({ value: "{percentage}", type: "Number" }),
                                            new sap.m.Input({ value: "{dueInMonth}", type: "Number" }),
                                            new sap.m.Input({ value: "{numberOfInstallments}", type: "Number" }),
                                            new sap.m.Input({ value: "{numberOfYears}", type: "Number" })
                                        ]
                                    })
                                }
                            }),

                            new sap.m.Title({ text: "Assigned Projects" }),
                            new sap.m.Toolbar({
                                content: [
                                    new sap.m.Button({ text: "Add Project", press: this.onAddProjectRow.bind(this) }),
                                    new sap.m.Button({ text: "Delete", press: this.onDeleteProjectRow.bind(this) })
                                ]
                            }),
                            new sap.m.Table({
                                id: "projectsTable",
                                items: "{/projects}",
                                columns: [
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Project ID" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Project Description" }) })
                                ],
                                items: {
                                    path: "/projects",
                                    template: new sap.m.ColumnListItem({
                                        cells: [
                                            new sap.m.Input({ value: "{projectId}" }),
                                            new sap.m.Input({ value: "{projectDescription}" })
                                        ]
                                    })
                                }
                            })
                        ]
                    }),
                    beginButton: new sap.m.Button({
                        text: "Save",
                        type: "Emphasized",
                        press: function () {
                            const oData = this._oAddDialog.getModel().getData();

                            // Transform schedules & projects to CAP composition format
                            const aSchedules = oData.schedules.map(s => ({
                                ID: this._generateUUID(),
                                conditionType: { code: s.conditionType },
                                basePrice: { code: s.basePrice },
                                calculationMethod: { code: s.calculationMethod },
                                frequency: { code: s.frequency },
                                percentage: s.percentage,
                                dueInMonth: s.dueInMonth,
                                numberOfInstallments: s.numberOfInstallments,
                                numberOfYears: s.numberOfYears
                            }));

                            const aProjects = oData.projects.map(p => ({
                                ID: this._generateUUID(),
                                project: { projectId: p.projectId }
                            }));

                            const payload = {
                                paymentPlanId: Date.now().toString(),
                                description: oData.description,
                                companyCodeId: oData.companyCodeId,
                                planYears: oData.planYears,
                                validFrom: oData.validFrom,
                                validTo: oData.validTo,
                                planStatus: oData.planStatus,
                                schedule: aSchedules,
                                assignedProjects: aProjects
                            };

                            fetch("/odata/v4/real-estate/PaymentPlans", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(payload)
                            })
                                .then(res => {
                                    if (!res.ok) throw new Error("Failed to save payment plan");
                                    return res.json();
                                })
                                .then(() => {
                                    MessageToast.show("Payment plan created successfully!");
                                    this._loadPlans();
                                    this._oAddDialog.close();
                                })
                                .catch(err => MessageBox.error(err.message));
                        }.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () {
                            this._oAddDialog.close();
                        }.bind(this)
                    })
                });

                this._oAddDialog.setModel(oNewPlanModel);
                this.getView().addDependent(this._oAddDialog);
            }

            // Reset model data for new plan
            this._oAddDialog.getModel().setData({
                paymentPlanId: "",
                description: "",
                companyCodeId: "",
                planYears: 0,
                validFrom: "",
                validTo: "",
                planStatus: "",
                schedules: [],
                projects: []
            });

            this._oAddDialog.open();
        },

        _generateUUID: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        onAddScheduleRow: function () {
            const oModel = this._oAddDialog.getModel();
            const aSchedules = oModel.getProperty("/schedules");
            aSchedules.push({
                conditionType: "",
                basePrice: "",
                calculationMethod: "",
                frequency: "",
                percentage: 0,
                dueInMonth: 0,
                numberOfInstallments: 0,
                numberOfYears: 0
            });
            oModel.refresh();
        },

        onDeleteScheduleRow: function () {
            const oTable = sap.ui.getCore().byId(this._oAddDialog.getId() + "--scheduleTable");
            const oSelected = oTable.getSelectedItem();
            if (!oSelected) return MessageBox.warning("Select a schedule to delete");
            const iIndex = oTable.indexOfItem(oSelected);
            const oModel = this._oAddDialog.getModel();
            const aSchedules = oModel.getProperty("/schedules");
            aSchedules.splice(iIndex, 1);
            oModel.refresh();
        },

        onAddProjectRow: function () {
            const oModel = this._oAddDialog.getModel();
            const aProjects = oModel.getProperty("/projects");
            aProjects.push({ projectId: "", projectDescription: "" });
            oModel.refresh();
        },

        onDeleteProjectRow: function () {
            const oTable = sap.ui.getCore().byId(this._oAddDialog.getId() + "--projectsTable");
            const oSelected = oTable.getSelectedItem();
            if (!oSelected) return MessageBox.warning("Select a project to delete");
            const iIndex = oTable.indexOfItem(oSelected);
            const oModel = this._oAddDialog.getModel();
            const aProjects = oModel.getProperty("/projects");
            aProjects.splice(iIndex, 1);
            oModel.refresh();
        },
        // Show details (you already have)
onShowPlanDetails: function (oEvent) {
    const oCtx = oEvent.getSource().getBindingContext();
    const oData = oCtx.getObject();
    MessageToast.show(`Details for plan ${oData.paymentPlanId}`);
    // Optional: open a dialog and display full details
},

// Edit plan
onEditPlan: function (oEvent) {
    const oCtx = oEvent.getSource().getBindingContext();
    const oData = oCtx.getObject();

    // Open the same dialog used for Add, but prefill data
    this.onAddPlan();  // reuse dialog creation
    const oDialogModel = this._oAddDialog.getModel();
    oDialogModel.setData({
        paymentPlanId: oData.paymentPlanId,
        description: oData.description,
        companyCodeId: oData.companyCodeId,
        planYears: oData.planYears,
        validFrom: oData.validFrom,
        validTo: oData.validTo,
        planStatus: oData.planStatus,
        schedules: oData.schedule || [],
        projects: oData.assignedProjects || []
    });

    this._oAddDialog.open();
},

// Delete plan
onDeletePlan: function (oEvent) {
    const oCtx = oEvent.getSource().getBindingContext();
    const oData = oCtx.getObject();

    MessageBox.confirm(`Are you sure you want to delete plan ${oData.paymentPlanId}?`, {
        title: "Delete Confirmation",
        onClose: (sAction) => {
            if (sAction === MessageBox.Action.OK) {
                fetch(`/odata/v4/real-estate/PaymentPlans(${oData.paymentPlanId})`, {
                    method: "DELETE"
                })
                .then(res => {
                    if (!res.ok) throw new Error("Failed to delete plan");
                    MessageToast.show("Plan deleted successfully!");
                    this._loadPlans(); // refresh table
                })
                .catch(err => MessageBox.error(err.message));
            }
        }
    });
}

    });
});
