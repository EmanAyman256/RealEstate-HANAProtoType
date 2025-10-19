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
            fetch("/odata/v4/real-estate/PaymentPlans")
                .then(res => res.json())
                .then(data => {
                    this.getView().setModel(new JSONModel(data.value), "plans");
                })
                .catch(err => console.error(err));
        },

        // Open Add/Edit Dialog
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
                    title: "Payment Plan",
                     contentWidth: "100%",
                    resizable: true,
                    draggable: true,
                    content: new sap.m.VBox({ items: this._createAddEditForm() }),
                    beginButton: new sap.m.Button({
                        text: "Save",
                        type: "Emphasized",
                        press: this._onSavePlan.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () { this._oAddDialog.close(); }.bind(this)
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

        // Build Add/Edit form content
        _createAddEditForm: function () {
            return [
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
                
                // Schedules section
                new sap.m.Title({ text: "Schedules", level: "H3" }),
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

                // Projects section
                new sap.m.Title({ text: "Assigned Projects", level: "H3" }),
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
            ];
        },

        // Save Add/Edit plan with immediate model update
        _onSavePlan: function () {
            const oData = this._oAddDialog.getModel().getData();
            const oPlansModel = this.getView().getModel("plans");
            const aPlans = oPlansModel.getData();

            const aSchedules = oData.schedules.map(s => ({
                ID: s.ID || this._generateUUID(),
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
                ID: p.ID || this._generateUUID(),
                project: { projectId: p.projectId }
            }));

            const payload = {
                paymentPlanId: oData.paymentPlanId || Date.now().toString(),
                description: oData.description,
                companyCodeId: oData.companyCodeId,
                planYears: oData.planYears,
                validFrom: oData.validFrom,
                validTo: oData.validTo,
                planStatus: oData.planStatus,
                schedule: aSchedules,
                assignedProjects: aProjects
            };

            const method = oData.paymentPlanId ? "PUT" : "POST";
            const url = oData.paymentPlanId 
                ? `/odata/v4/real-estate/PaymentPlans('${oData.paymentPlanId}')` 
                : "/odata/v4/real-estate/PaymentPlans";

            fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            .then(res => {
                if (!res.ok) throw new Error("Failed to save payment plan");
                return res.json();
            })
            .then(() => {
                MessageToast.show("Payment plan saved successfully!");

                if (oData.paymentPlanId) {
                    // Update existing plan in model
                    const iIndex = aPlans.findIndex(p => p.paymentPlanId === oData.paymentPlanId);
                    if (iIndex > -1) aPlans[iIndex] = payload;
                } else {
                    // Add new plan
                    aPlans.push(payload);
                }

                oPlansModel.setData(aPlans);
                oPlansModel.refresh();
                this._oAddDialog.close();
            })
            .catch(err => MessageBox.error(err.message));
        },

        // Edit existing plan
        onEditPlan: function (oEvent) {
            const oData = oEvent.getSource().getBindingContext().getObject();
            this.onAddPlan();  // reuse dialog
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
            const oData = oEvent.getSource().getBindingContext().getObject();
            const oPlansModel = this.getView().getModel("plans");
            const aPlans = oPlansModel.getData();

            MessageBox.confirm(`Are you sure you want to delete plan ${oData.paymentPlanId}?`, {
                title: "Delete Confirmation",
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        fetch(`/odata/v4/real-estate/PaymentPlans('${oData.paymentPlanId}')`, {
                            method: "DELETE"
                        })
                        .then(res => {
                            if (!res.ok) throw new Error("Failed to delete plan");

                            // Remove from local model
                            const iIndex = aPlans.findIndex(p => p.paymentPlanId === oData.paymentPlanId);
                            if (iIndex > -1) aPlans.splice(iIndex, 1);
                            oPlansModel.setData(aPlans);
                            oPlansModel.refresh();

                            MessageToast.show("Plan deleted successfully!");
                        })
                        .catch(err => MessageBox.error(err.message));
                    }
                }
            });
        },

        // Show plan details in a wide dialog
      onShowPlanDetails: function (oEvent) {
    const oBindingContext = oEvent.getSource().getBindingContext();
    if (!oBindingContext) return;

    const oData = oBindingContext.getObject();

    // Prepare JSON model for dialog
    const oDialogModel = new sap.ui.model.json.JSONModel({
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

    if (!this._oDetailsDialog) {
        this._oDetailsDialog = new sap.m.Dialog({
            title: "Payment Plan Details",
            contentWidth: "100%",
            resizable: true,
            draggable: true,
            content: [
                new sap.m.IconTabBar({
                    expandable: true,
                    items: [
                        // 🔹 Tab 1: General Info
                        new sap.m.IconTabFilter({
                            text: "General Info",
                            icon: "sap-icon://business-card",
                            content: [
                                new sap.ui.layout.form.SimpleForm({
                                    editable: false,
                                    layout: "ResponsiveGridLayout",
                                    labelSpanL: 3,
                                    columnsL: 2,
                                    content: [
                                        new sap.m.Label({ text: "Payment Plan ID" }),
                                        new sap.m.Text({ text: "{/paymentPlanId}" }),

                                        new sap.m.Label({ text: "Description" }),
                                        new sap.m.Text({ text: "{/description}" }),

                                        new sap.m.Label({ text: "Company Code ID" }),
                                        new sap.m.Text({ text: "{/companyCodeId}" }),

                                        new sap.m.Label({ text: "Plan Years" }),
                                        new sap.m.Text({ text: "{/planYears}" }),

                                        new sap.m.Label({ text: "Valid From" }),
                                        new sap.m.Text({ text: "{/validFrom}" }),

                                        new sap.m.Label({ text: "Valid To" }),
                                        new sap.m.Text({ text: "{/validTo}" }),

                                        new sap.m.Label({ text: "Plan Status" }),
                                        new sap.m.Text({ text: "{/planStatus}" })
                                    ]
                                })
                            ]
                        }),

                        // 🔹 Tab 2: Schedules
                        new sap.m.IconTabFilter({
                            text: "Schedules",
                            icon: "sap-icon://calendar",
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
                                        path: "/schedules",
                                        template: new sap.m.ColumnListItem({
                                            cells: [
                                                new sap.m.Text({ text: "{conditionType/code}" }),
                                                new sap.m.Text({ text: "{basePrice/code}" }),
                                                new sap.m.Text({ text: "{calculationMethod/code}" }),
                                                new sap.m.Text({ text: "{frequency/code}" }),
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

                        // 🔹 Tab 3: Assigned Projects
                        new sap.m.IconTabFilter({
                            text: "Assigned Projects",
                            icon: "sap-icon://project-definition",
                            content: [
                                new sap.m.Table({
                                    columns: [
                                        new sap.m.Column({ header: new sap.m.Label({ text: "Project ID" }) }),
                                        new sap.m.Column({ header: new sap.m.Label({ text: "Project Description" }) })
                                    ],
                                    items: {
                                        path: "/projects",
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
                type: "Emphasized",
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


        // Add/Delete schedule rows
        onAddScheduleRow: function () {
            const oModel = this._oAddDialog.getModel();
            const aSchedules = oModel.getProperty("/schedules");
            aSchedules.push({ conditionType: "", basePrice: "", calculationMethod: "", frequency: "", percentage: 0, dueInMonth: 0, numberOfInstallments: 0, numberOfYears: 0 });
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

        // Add/Delete project rows
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

        // Generate unique ID
        _generateUUID: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

    });
});
