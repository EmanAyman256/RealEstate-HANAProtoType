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
    "sap/ui/layout/form/SimpleForm",
    "sap/m/ComboBox",
    "sap/ui/core/Item"
], function (
    Controller, MessageBox, Dialog, Input, Button, Label, Text, TextArea, VBox,
    DatePicker, Table, Column, ColumnListItem, JSONModel, Title, IconTabBar, IconTabFilter, SimpleForm,
    ComboBox, Item
) {
    "use strict";

    return Controller.extend("dboperations.controller.Units", {
        onInit: function () {
            this.getOwnerComponent().getRouter()
                .getRoute("Units")
                .attachPatternMatched(this._onRouteMatched, this);

            var oModel = new sap.ui.model.json.JSONModel({
                Units: [],
            });
            oModel.setProperty("/selectedUnitStatus", "");
            oModel.setProperty("/selectedUnitId", "");
            this.getView().setModel(oModel, "view");

            // Fetch units data
            this._loadUnits();

            // Fetch config lists for dropdowns
            this._loadMeasurementsList();
            this._loadConditionsList();

            // New: Fetch lists for search helps
            this._loadCompanyCodesList();
            this._loadProjectsList();
            this._loadBuildingsList();
        },

        _onRouteMatched: function () {
            this._loadUnits();
        },

        _loadUnits: function () {
            var oModel = new sap.ui.model.json.JSONModel();
            fetch("/odata/v4/real-estate/Units?$expand=measurements,conditions")
                .then(response => response.json())
                .then(data => {
                    // 🔹 Post-process units to extract BUA & Original Price
                    const enrichedUnits = data.value.map(unit => {
                        // Extract BUA (from measurements where code = 'BUA')
                        let buaMeasurement = unit.measurements?.find(m => m.code?.toUpperCase() === "BUA");
                        let bua = buaMeasurement ? buaMeasurement.quantity : null;

                        // Extract Original Price (from first condition or based on some rule)
                        let firstCondition = unit.conditions?.[0];
                        let originalPrice = firstCondition ? firstCondition.amount : null;
                        console.log("Units", data.value);

                        return { ...unit, bua, originalPrice };
                    });

                    oModel.setData({ Units: enrichedUnits });

                    const uniqueStatuses = [];
                    const unitId = []
                    enrichedUnits.forEach(u => {
                        if (u.unitStatusDescription && !uniqueStatuses.includes(u.unitStatusDescription)) {
                            uniqueStatuses.push(u.unitStatusDescription);
                        }
                        if (u.unitId && !unitId.includes(u.unitId)) {
                            unitId.push(u.unitId)
                        }
                    });
                    console.log("united status", uniqueStatuses);
                    console.log("unitIDS", unitId);


                    oModel.setProperty("/UnitStatuses", uniqueStatuses.map(s => ({ status: s })));
                    oModel.setProperty("/UnitId", unitId.map(s => ({ id: s })));



                    this.getView().setModel(oModel, "view");


                    this.getView().byId("unitsTable").setModel(oModel);[]
                })
                .catch(err => {
                    console.error("Error fetching units", err);
                });
        },

        // Fetch measurements config for dropdown
        _loadMeasurementsList: function () {
            fetch("/odata/v4/real-estate/Measurements")
                .then(res => res.json())
                .then(data => {
                    this.getView().setModel(new JSONModel(data.value || []), "measurementsList");
                })
                .catch(err => console.error("Failed to load Measurements list:", err));
        },

        // Fetch conditions config for dropdown
        _loadConditionsList: function () {
            fetch("/odata/v4/real-estate/Conditions")
                .then(res => res.json())
                .then(data => {
                    this.getView().setModel(new JSONModel(data.value || []), "conditionsList");
                })
                .catch(err => console.error("Failed to load Conditions list:", err));
        },

        // New: Fetch unique company codes from Projects
        _loadCompanyCodesList: function () {
            fetch("/odata/v4/real-estate/Projects")
                .then(res => res.json())
                .then(data => {
                    const uniqueCompanyCodes = data.value.reduce((acc, curr) => {
                        if (!acc.find(c => c.companyCodeId === curr.companyCodeId)) {
                            acc.push({
                                companyCodeId: curr.companyCodeId,
                                companyCodeDescription: curr.companyCodeDescription
                            });
                        }
                        return acc;
                    }, []);
                    this.getView().setModel(new JSONModel(uniqueCompanyCodes), "companyCodesList");
                })
                .catch(err => console.error("Failed to load Company Codes list:", err));
        },

        // New: Fetch projects list
        _loadProjectsList: function () {
            fetch("/odata/v4/real-estate/Projects")
                .then(res => res.json())
                .then(data => {
                    this.getView().setModel(new JSONModel(data.value || []), "projectsList");
                })
                .catch(err => console.error("Failed to load Projects list:", err));
        },

        // New: Fetch buildings list
        _loadBuildingsList: function () {
            fetch("/odata/v4/real-estate/Buildings")
                .then(res => res.json())
                .then(data => {
                    this.getView().setModel(new JSONModel(data.value || []), "buildingsList");
                })
                .catch(err => console.error("Failed to load Buildings list:", err));
        },

        // New: Update filtered buildings based on projectId
        _updateFilteredBuildings: function (sProjectId, oModel) {
            const allBuildings = this.getView().getModel("buildingsList").getData();
            const filtered = allBuildings.filter(b => b.projectId === sProjectId);
            oModel.setProperty("/filteredBuildings", filtered);
        },

        onNavigateToAddUnit: function () {
            // If dialog is not yet created, create it once
            if (!this._oAddDialog) {
                var oNewUnitModel = new sap.ui.model.json.JSONModel({
                    unitId: "",
                    unitDescription: "",
                    companyCodeId: "",
                    companyCodeDescription: "",
                    projectId: "",
                    projectDescription: "",
                    buildingId: "",
                    unitTypeDescription: "",
                    usageTypeDescription: "",
                    unitStatusDescription: "",
                    floorDescription: "",
                    zone: "",
                    salesPhase: "",
                    finishingSpexDescription: "",
                    profitCenter: "",
                    functionalArea: "",
                    unitDeliveryDate: "",
                    supplementaryText: "",
                    measurements: [],
                    conditions: [],
                    filteredBuildings: []  // New: for filtered buildings
                });

                this._oAddDialog = new sap.m.Dialog({
                    title: "Add New Unit",
                    content: new sap.m.VBox({
                        items: [
                            new sap.m.Label({ text: "Unit ID", required: true }),
                            new sap.m.Input("unitIdInput", {
                                value: "{/unitId}",
                                tooltip: "Must be 8 characters or fewer"
                            }),

                            new sap.m.Label({ text: "Unit Description", required: true }),
                            new sap.m.Input("unitDescInput", {
                                value: "{/unitDescription}",
                                tooltip: "Up to 60 characters"
                            }),

                            new sap.m.Label({ text: "Company Code ID", required: true }),
                            new ComboBox("companyCodeIdInput", {
                                selectedKey: "{/companyCodeId}",
                                change: this.onCompanyCodeChange.bind(this),
                                items: {
                                    path: "companyCodesList>/",
                                    template: new Item({
                                        key: "{companyCodesList>companyCodeId}",
                                        text: "{companyCodesList>companyCodeId} - {companyCodesList>companyCodeDescription}"
                                    })
                                },
                                tooltip: "Must be 4 characters"
                            }),

                            new sap.m.Label({ text: "Company Code Description", required: true }),
                            new sap.m.Input("companyCodeDescInput", {
                                value: "{/companyCodeDescription}",
                                tooltip: "Up to 60 characters"
                            }),

                            new sap.m.Label({ text: "Project ID", required: true }),
                            new ComboBox("projectIdInput", {
                                selectedKey: "{/projectId}",
                                change: this.onProjectChange.bind(this),
                                items: {
                                    path: "projectsList>/",
                                    template: new Item({
                                        key: "{projectsList>projectId}",
                                        text: "{projectsList>projectId} - {projectsList>projectDescription}"
                                    })
                                },
                                tooltip: "Must be 8 characters"
                            }),

                            new sap.m.Label({ text: "Project Description", required: true }),
                            new sap.m.Input("projectDescInput", {
                                value: "{/projectDescription}",
                                tooltip: "Up to 60 characters"
                            }),

                            // new sap.m.Label({ text: "Building ID", required: true }),
                            // new ComboBox("buildingIdInput", {
                            //     selectedKey: "{/buildingId}",
                            //     items: {
                            //         path: "/filteredBuildings",
                            //         template: new Item({
                            //             key: "{buildingId}",
                            //             text: "{buildingId} - {buildingDescription}"
                            //         })
                            //     }
                            // }),

                            new sap.m.Label({ text: "Unit Type Description", required: true }),
                            new sap.m.Input("unitTypeDescInput", { value: "{/unitTypeDescription}" }),

                            new sap.m.Label({ text: "Usage Type Description", required: true }),
                            new sap.m.Input("usageTypeDescInput", { value: "{/usageTypeDescription}" }),

                            new sap.m.Label({ text: "Unit Status Description", required: true }),
                            new sap.m.Input("unitStatusDescInput", { value: "{/unitStatusDescription}" }),

                            new sap.m.Label({ text: "Floor Description", required: true }),
                            new sap.m.Input("floorDescInput", { value: "{/floorDescription}" }),

                            new sap.m.Label({ text: "Zone", required: true }),
                            new sap.m.Input("zoneInput", { value: "{/zone}" }),

                            new sap.m.Label({ text: "Sales Phase", required: true }),
                            new sap.m.Input("salesPhaseInput", { value: "{/salesPhase}" }),

                            new sap.m.Label({ text: "Finishing Spex Description", required: true }),
                            new sap.m.Input("finishingSpexDescInput", { value: "{/finishingSpexDescription}" }),

                            new sap.m.Label({ text: "Profit Center", required: true }),
                            new sap.m.Input("profitCenterInput", { value: "{/profitCenter}" }),

                            new sap.m.Label({ text: "Functional Area", required: true }),
                            new sap.m.Input("functionalAreaInput", { value: "{/functionalArea}" }),

                            new sap.m.Label({ text: "Delivery Date", required: true }),
                            new sap.m.DatePicker("unitDeliveryDateInput", {
                                value: "{/unitDeliveryDate}",
                                displayFormat: "long",
                                valueFormat: "yyyy-MM-dd",
                                placeholder: "Select a date"
                            }),

                            new sap.m.Label({ text: "Supplementary Text", required: true }),
                            new sap.m.Input("supplementaryTextInput", { value: "{/supplementaryText}" }),

                            new sap.m.Title({ text: "Measurements", level: "H3" }),
                            new sap.m.Button({ text: "Add Measurement", press: this.onAddMeasurementRow.bind(this) }),
                            new sap.m.Button({ text: "Delete Measurement", press: this.onDeleteMeasurementRow.bind(this) }),
                            new sap.m.Table({
                                id: "addMeasurementsTable",
                                items: "{/measurements}",
                                columns: [
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Code" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Description" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Quantity" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "UOM" }) })
                                ],
                                items: {
                                    path: "/measurements",
                                    template: new sap.m.ColumnListItem({
                                        cells: [
                                            new ComboBox({
                                                selectedKey: "{code}",
                                                change: this.onMeasurementCodeChange.bind(this),
                                                items: {
                                                    path: "measurementsList>/",
                                                    template: new Item({
                                                        key: "{measurementsList>code}",
                                                        text: "{measurementsList>code} - {measurementsList>description}"
                                                    })
                                                }
                                            }),
                                            new Text({ text: "{description}" }),
                                            new Input({ value: "{quantity}", type: "Number" }),
                                            new Input({ value: "{uom}" })
                                        ]
                                    })
                                }
                            }),

                            new sap.m.Title({ text: "Conditions", level: "H3" }),
                            new sap.m.Button({ text: "Add Condition", press: this.onAddConditionRow.bind(this) }),
                            new sap.m.Button({ text: "Delete Condition", press: this.onDeleteConditionRow.bind(this) }),
                            new sap.m.Table({
                                id: "addConditionsTable",
                                items: "{/conditions}",
                                columns: [
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Code" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Description" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Amount" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Currency" }) })
                                ],
                                items: {
                                    path: "/conditions",
                                    template: new sap.m.ColumnListItem({
                                        cells: [
                                            new ComboBox({
                                                selectedKey: "{code}",
                                                change: this.onConditionCodeChange.bind(this),
                                                items: {
                                                    path: "conditionsList>/",
                                                    template: new Item({
                                                        key: "{conditionsList>code}",
                                                        text: "{conditionsList>code} - {conditionsList>description}"
                                                    })
                                                }
                                            }),
                                            new Text({ text: "{description}" }),
                                            new Input({ value: "{amount}", type: "Number" }),
                                            new Input({ value: "{currency}" })
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
                            var oData = this._oAddDialog.getModel().getData();

                            // 🧩 Required field validation
                            var aRequiredFields = [
                                { id: "unitIdInput", name: "Unit ID" },
                                { id: "unitDescInput", name: "Unit Description" },
                                { id: "companyCodeIdInput", name: "Company Code ID" },
                                { id: "companyCodeDescInput", name: "Company Code Description" },
                                { id: "projectIdInput", name: "Project ID" },
                                { id: "projectDescInput", name: "Project Description" },
                                // { id: "buildingIdInput", name: "Building ID" },
                                { id: "unitTypeDescInput", name: "Unit Type Description" },
                                { id: "usageTypeDescInput", name: "Usage Type Description" },
                                { id: "unitStatusDescInput", name: "Unit Status Description" },
                                { id: "floorDescInput", name: "Floor Description" },
                                { id: "zoneInput", name: "Zone" },
                                { id: "salesPhaseInput", name: "Sales Phase" },
                                { id: "finishingSpexDescInput", name: "Finishing Spex Description" },
                                { id: "profitCenterInput", name: "Profit Center" },
                                { id: "functionalAreaInput", name: "Functional Area" },
                                { id: "unitDeliveryDateInput", name: "Delivery Date" },
                                { id: "supplementaryTextInput", name: "Supplementary Text" }
                            ];

                            var bValid = true;
                            aRequiredFields.forEach(function (field) {
                                var oControl = sap.ui.getCore().byId(field.id);
                                if (!oControl.getValue()) {
                                    oControl.setValueState("Error");
                                    oControl.setValueStateText(field.name + " is required");
                                    bValid = false;
                                } else {
                                    oControl.setValueState("None");
                                }
                            });

                            if (!bValid) {
                                sap.m.MessageBox.warning("Please fill all required fields before saving.");
                                return;
                            }

                            // Revert to original POST logic with defaults
                            const payload = {
                                unitId: oData.unitId || Date.now().toString().slice(-8),
                                unitDescription: oData.unitDescription,
                                companyCodeId: oData.companyCodeId,
                                companyCodeDescription: oData.companyCodeDescription,
                                projectId: oData.projectId,
                                projectDescription: oData.projectDescription,
                                // buildingId: oData.buildingId,
                                unitTypeDescription: oData.unitTypeDescription,
                                usageTypeDescription: oData.usageTypeDescription,
                                unitStatusDescription: oData.unitStatusDescription,
                                floorDescription: oData.floorDescription,
                                zone: oData.zone,
                                salesPhase: oData.salesPhase,
                                finishingSpexDescription: oData.finishingSpexDescription,
                                unitDeliveryDate: oData.unitDeliveryDate || null,
                                supplementaryText: oData.supplementaryText,
                                profitCenter: oData.profitCenter || 0,
                                functionalArea: oData.functionalArea || 0,
                                measurements: oData.measurements,
                                conditions: oData.conditions
                            };

                            // Fix for the error: Remove empty compositions from payload
                            if (payload.measurements.length === 0) {
                                delete payload.measurements;
                            }
                            if (payload.conditions.length === 0) {
                                delete payload.conditions;
                            }

                            // ✅ Proceed with POST request
                            fetch("/odata/v4/real-estate/Units", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(payload)
                            })
                                .then(response => {
                                    if (!response.ok) {
                                        throw new Error("Failed to create unit");
                                    }
                                    return response.json();
                                })
                                .then(() => {
                                    sap.m.MessageToast.show("Unit created!");
                                    this._loadUnits();

                                    // 🧹 Reset form after save
                                    this._resetAddDialogFields();

                                    this._oAddDialog.close();
                                })
                                .catch(err => {
                                    sap.m.MessageBox.error("Error: " + err.message);
                                });
                        }.bind(this)
                    }),

                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () {
                            // 🧹 Clear data on cancel
                            this._resetAddDialogFields();
                            this._oAddDialog.close();
                        }.bind(this)
                    })
                });

                this._oAddDialog.setModel(oNewUnitModel);
                this.getView().addDependent(this._oAddDialog);
            }

            // 🧼 Reset data every time dialog opens
            this._resetAddDialogFields();

            this._oAddDialog.open();
        },

        // 🧹 Helper function to reset dialog data and value states
        _resetAddDialogFields: function () {
            var oModel = this._oAddDialog.getModel();
            oModel.setData({
                unitId: "",
                unitDescription: "",
                companyCodeId: "",
                companyCodeDescription: "",
                projectId: "",
                projectDescription: "",
                // buildingId: "",
                unitTypeDescription: "",
                usageTypeDescription: "",
                unitStatusDescription: "",
                floorDescription: "",
                zone: "",
                salesPhase: "",
                finishingSpexDescription: "",
                profitCenter: "",
                functionalArea: "",
                unitDeliveryDate: "",
                supplementaryText: "",
                measurements: [],
                conditions: [],
                filteredBuildings: []
            });

            // Reset value states for validation
            [
                "unitIdInput", "unitDescInput", "companyCodeIdInput", "companyCodeDescInput",
                "projectIdInput", "projectDescInput", "buildingIdInput", "unitTypeDescInput",
                "usageTypeDescInput", "unitStatusDescInput", "floorDescInput", "zoneInput",
                "salesPhaseInput", "finishingSpexDescInput", "profitCenterInput", "functionalAreaInput",
                "unitDeliveryDateInput", "supplementaryTextInput"
            ].forEach(function (id) {
                var oControl = sap.ui.getCore().byId(id);
                if (oControl) oControl.setValueState("None");
            });
        },

        onDetails: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            if (!oBindingContext) {
                return;
            }

            var oData = oBindingContext.getObject();
            var oDialogModel = new sap.ui.model.json.JSONModel({
                unitId: oData.unitId,
                unitDescription: oData.unitDescription,
                companyCodeId: oData.companyCodeId,
                companyCodeDescription: oData.companyCodeDescription,
                projectId: oData.projectId,
                projectDescription: oData.projectDescription,
                buildingId: oData.buildingId,
                unitTypeDescription: oData.unitTypeDescription,
                usageTypeDescription: oData.usageTypeDescription,
                unitStatusDescription: oData.unitStatusDescription,
                floorDescription: oData.floorDescription,
                zone: oData.zone,
                salesPhase: oData.salesPhase,
                finishingSpexDescription: oData.finishingSpexDescription,
                profitCenter: oData.profitCenter,
                functionalArea: oData.functionalArea,
                unitDeliveryDate: oData.unitDeliveryDate,
                supplementaryText: oData.supplementaryText,
                measurements: oData.measurements,
                conditions: oData.conditions
            });

            if (!this._oDetailsDialog) {
                this._oDetailsDialog = new sap.m.Dialog({
                    title: "Unit Details",
                    contentWidth: "100%",
                    resizable: true,
                    draggable: true,
                    content: [
                        new sap.m.IconTabBar({
                            expandable: true,
                            items: [
                                // 🔹 Tab 1: Unit General Data
                                new sap.m.IconTabFilter({
                                    text: "General Data",
                                    icon: "sap-icon://project-definition",
                                    content: [
                                        new sap.ui.layout.form.SimpleForm({
                                            editable: false,
                                            layout: "ResponsiveGridLayout",
                                            labelSpanL: 3,
                                            columnsL: 2,
                                            content: [
                                                new sap.m.Label({ text: "Unit ID" }),
                                                new sap.m.Text({ text: "{/unitId}" }),

                                                new sap.m.Label({ text: "Unit Description" }),
                                                new sap.m.Text({ text: "{/unitDescription}" }),

                                                new sap.m.Label({ text: "Company Code ID" }),
                                                new sap.m.Text({ text: "{/companyCodeId}" }),

                                                new sap.m.Label({ text: "Company Code Description" }),
                                                new sap.m.Text({ text: "{/companyCodeDescription}" }),

                                                new sap.m.Label({ text: "Project ID" }),
                                                new sap.m.Text({ text: "{/projectId}" }),

                                                new sap.m.Label({ text: "Project Description" }),
                                                new sap.m.Text({ text: "{/projectDescription}" }),

                                                new sap.m.Label({ text: "Building ID" }),
                                                new sap.m.Text({ text: "{/buildingId}" }),

                                                new sap.m.Label({ text: "Unit Type Description" }),
                                                new sap.m.Text({ text: "{/unitTypeDescription}" }),

                                                new sap.m.Label({ text: "Usage Type Description" }),
                                                new sap.m.Text({ text: "{/usageTypeDescription}" }),

                                                new sap.m.Label({ text: "Unit Status Description" }),
                                                new sap.m.Text({ text: "{/unitStatusDescription}" }),

                                                new sap.m.Label({ text: "Floor Description" }),
                                                new sap.m.Text({ text: "{/floorDescription}" }),

                                                new sap.m.Label({ text: "Zone" }),
                                                new sap.m.Text({ text: "{/zone}" }),

                                                new sap.m.Label({ text: "Sales Phase" }),
                                                new sap.m.Text({ text: "{/salesPhase}" }),

                                                new sap.m.Label({ text: "Finishing Spex Description" }),
                                                new sap.m.Text({ text: "{/finishingSpexDescription}" }),

                                                new sap.m.Label({ text: "Delivery Date" }),
                                                new sap.m.Text({ text: "{/unitDeliveryDate}" })
                                            ]
                                        })
                                    ]
                                }),

                                // 🔹 Tab 2: Posting Parameters
                                new sap.m.IconTabFilter({
                                    text: "Posting Parameters",
                                    icon: "sap-icon://post",
                                    content: [
                                        new sap.ui.layout.form.SimpleForm({
                                            editable: false,
                                            layout: "ResponsiveGridLayout",
                                            labelSpanL: 3,
                                            columnsL: 2,
                                            content: [
                                                new sap.m.Label({ text: "Profit Center" }),
                                                new sap.m.Text({ text: "{/profitCenter}" }),

                                                new sap.m.Label({ text: "Functional Area" }),
                                                new sap.m.Text({ text: "{/functionalArea}" })
                                            ]
                                        })
                                    ]
                                }),

                                // 🔹 Tab 3: Supplementary Text
                                new sap.m.IconTabFilter({
                                    text: "Supplementary Text",
                                    icon: "sap-icon://document-text",
                                    content: [
                                        new sap.ui.layout.form.SimpleForm({
                                            editable: false,
                                            layout: "ResponsiveGridLayout",
                                            content: [
                                                new sap.m.Label({ text: "Supplementary Text" }),
                                                new sap.m.TextArea({
                                                    value: "{/supplementaryText}",
                                                    width: "100%",
                                                    rows: 6,
                                                    editable: false,
                                                    growing: true,
                                                    growingMaxLines: 10
                                                })
                                            ]
                                        })
                                    ]
                                }),

                                // 🔹 Tab 4: Measurements (maintained as is)
                                new sap.m.IconTabFilter({
                                    text: "Measurements",
                                    icon: "sap-icon://measure",
                                    content: [
                                        new sap.m.Table({
                                            columns: [
                                                new sap.m.Column({ header: new sap.m.Label({ text: "Code" }) }),
                                                new sap.m.Column({ header: new sap.m.Label({ text: "Description" }) }),
                                                new sap.m.Column({ header: new sap.m.Label({ text: "Quantity" }) }),
                                                new sap.m.Column({ header: new sap.m.Label({ text: "UOM" }) })
                                            ],
                                            items: {
                                                path: "/measurements",
                                                template: new sap.m.ColumnListItem({
                                                    cells: [
                                                        new sap.m.Text({ text: "{code}" }),
                                                        new sap.m.Text({ text: "{description}" }),
                                                        new sap.m.Text({ text: "{quantity}" }),
                                                        new sap.m.Text({ text: "{uom}" })
                                                    ]
                                                })
                                            }
                                        })
                                    ]
                                }),

                                // 🔹 Tab 5: Conditions (maintained as is)
                                new sap.m.IconTabFilter({
                                    text: "Conditions",
                                    icon: "sap-icon://list",
                                    content: [
                                        new sap.m.Table({
                                            columns: [
                                                new sap.m.Column({ header: new sap.m.Label({ text: "Code" }) }),
                                                new sap.m.Column({ header: new sap.m.Label({ text: "Description" }) }),
                                                new sap.m.Column({ header: new sap.m.Label({ text: "Amount" }) }),
                                                new sap.m.Column({ header: new sap.m.Label({ text: "Currency" }) })
                                            ],
                                            items: {
                                                path: "/conditions",
                                                template: new sap.m.ColumnListItem({
                                                    cells: [
                                                        new sap.m.Text({ text: "{code}" }),
                                                        new sap.m.Text({ text: "{description}" }),
                                                        new sap.m.Text({ text: "{amount}" }),
                                                        new sap.m.Text({ text: "{currency}" })
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

        onDelete: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            if (oBindingContext) {
                var sPath = oBindingContext.getPath();
                var oModel = this.getView().byId("unitsTable").getModel();
                var oItem = oModel.getProperty(sPath);

                if (!oItem) {
                    sap.m.MessageBox.error("Could not find model data for deletion.");
                    return;
                }

                MessageBox.confirm("Are you sure you want to delete " + oItem.unitId + "?", {
                    title: "Confirm Deletion",
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            fetch(`/odata/v4/real-estate/Units(unitId='${oItem.unitId}')`, {
                                method: "DELETE"
                            })
                                .then(response => {
                                    if (!response.ok) {
                                        throw new Error("Failed to delete: " + response.statusText);
                                    }

                                    var aRecords = oModel.getProperty("/Units");
                                    var iIndex = aRecords.findIndex(st => st.unitId === oItem.unitId);
                                    if (iIndex > -1) {
                                        aRecords.splice(iIndex, 1);
                                        oModel.setProperty("/Units", aRecords);
                                    }

                                    sap.m.MessageToast.show("Unit deleted successfully!");
                                })
                                .catch(err => {
                                    console.error("Error deleting Unit:", err);
                                    sap.m.MessageBox.error("Error: " + err.message);
                                });
                        }
                    }
                });
            }
        },

        onEditUnit: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            if (!oBindingContext) return;

            var oData = oBindingContext.getObject();
            var oDialogModel = new sap.ui.model.json.JSONModel(Object.assign({}, oData, { filteredBuildings: [] }));

            // Pre-filter buildings for initial project
            this._updateFilteredBuildings(oData.projectId, oDialogModel);

            if (!this._oEditDialog) {
                this._oEditDialog = new sap.m.Dialog({
                    title: "Edit Unit",
                    content: new sap.m.VBox({
                        items: [
                            new sap.m.Label({ text: "Unit ID" }),
                            new sap.m.Input({ value: "{/unitId}", editable: false }),

                            new sap.m.Label({ text: "Unit Description", required: true }),
                            new sap.m.Input("editUnitDescInput", { value: "{/unitDescription}" }),

                            new sap.m.Label({ text: "Company Code ID", required: true }),
                            new ComboBox("editCompanyCodeIdInput", {
                                selectedKey: "{/companyCodeId}",
                                change: this.onCompanyCodeChange.bind(this),
                                items: {
                                    path: "companyCodesList>/",
                                    template: new Item({
                                        key: "{companyCodesList>companyCodeId}",
                                        text: "{companyCodesList>companyCodeId} - {companyCodesList>companyCodeDescription}"
                                    })
                                }
                            }),

                            new sap.m.Label({ text: "Company Code Description", required: true }),
                            new sap.m.Input("editCompanyCodeDescInput", { value: "{/companyCodeDescription}" }),

                            new sap.m.Label({ text: "Project ID", required: true }),
                            new ComboBox("editProjectIdInput", {
                                selectedKey: "{/projectId}",
                                change: this.onProjectChange.bind(this),
                                items: {
                                    path: "projectsList>/",
                                    template: new Item({
                                        key: "{projectsList>projectId}",
                                        text: "{projectsList>projectId} - {projectsList>projectDescription}"
                                    })
                                }
                            }),

                            new sap.m.Label({ text: "Project Description", required: true }),
                            new sap.m.Input("editProjectDescInput", { value: "{/projectDescription}" }),

                            // new sap.m.Label({ text: "Building ID", required: true }),
                            // new ComboBox("editBuildingIdInput", {
                            //     selectedKey: "{/buildingId}",
                            //     items: {
                            //         path: "/filteredBuildings",
                            //         template: new Item({
                            //             key: "{buildingId}",
                            //             text: "{buildingId} - {buildingDescription}"
                            //         })
                            //     }
                            // }),

                            new sap.m.Label({ text: "Unit Type Description", required: true }),
                            new sap.m.Input("editUnitTypeDescInput", { value: "{/unitTypeDescription}" }),

                            new sap.m.Label({ text: "Usage Type Description", required: true }),
                            new sap.m.Input("editUsageTypeDescInput", { value: "{/usageTypeDescription}" }),

                            new sap.m.Label({ text: "Unit Status Description", required: true }),
                            new sap.m.Input("editUnitStatusDescInput", { value: "{/unitStatusDescription}" }),

                            new sap.m.Label({ text: "Floor Description", required: true }),
                            new sap.m.Input("editFloorDescInput", { value: "{/floorDescription}" }),

                            new sap.m.Label({ text: "Zone", required: true }),
                            new sap.m.Input("editZoneInput", { value: "{/zone}" }),

                            new sap.m.Label({ text: "Sales Phase", required: true }),
                            new sap.m.Input("editSalesPhaseInput", { value: "{/salesPhase}" }),

                            new sap.m.Label({ text: "Finishing Spex Description", required: true }),
                            new sap.m.Input("editFinishingSpexDescInput", { value: "{/finishingSpexDescription}" }),

                            new sap.m.Label({ text: "Profit Center", required: true }),
                            new sap.m.Input("editProfitCenterInput", { value: "{/profitCenter}" }),

                            new sap.m.Label({ text: "Functional Area", required: true }),
                            new sap.m.Input("editFunctionalAreaInput", { value: "{/functionalArea}" }),

                            new sap.m.Label({ text: "Delivery Date", required: true }),
                            new sap.m.DatePicker("editUnitDeliveryDateInput", {
                                value: "{/unitDeliveryDate}",
                                displayFormat: "long",
                                valueFormat: "yyyy-MM-dd",
                                placeholder: "Select a date"
                            }),

                            new sap.m.Label({ text: "Supplementary Text", required: true }),
                            new sap.m.Input("editSupplementaryTextInput", { value: "{/supplementaryText}" }),

                            new sap.m.Title({ text: "Measurements", level: "H3" }),
                            new sap.m.Button({ text: "Add Measurement", press: this.onAddMeasurementRow.bind(this) }),
                            new sap.m.Button({ text: "Delete Measurement", press: this.onDeleteMeasurementRow.bind(this) }),
                            new sap.m.Table({
                                id: "editMeasurementsTable",
                                items: "{/measurements}",
                                columns: [
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Code" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Description" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Quantity" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "UOM" }) })
                                ],
                                items: {
                                    path: "/measurements",
                                    template: new sap.m.ColumnListItem({
                                        cells: [
                                            new ComboBox({
                                                selectedKey: "{code}",
                                                change: this.onMeasurementCodeChange.bind(this),
                                                items: {
                                                    path: "measurementsList>/",
                                                    template: new Item({
                                                        key: "{measurementsList>code}",
                                                        text: "{measurementsList>code} - {measurementsList>description}"
                                                    })
                                                }
                                            }),
                                            new Text({ text: "{description}" }),
                                            new Input({ value: "{quantity}", type: "Number" }),
                                            new Input({ value: "{uom}" })
                                        ]
                                    })
                                }
                            }),

                            new sap.m.Title({ text: "Conditions", level: "H3" }),
                            new sap.m.Button({ text: "Add Condition", press: this.onAddConditionRow.bind(this) }),
                            new sap.m.Button({ text: "Delete Condition", press: this.onDeleteConditionRow.bind(this) }),
                            new sap.m.Table({
                                id: "editConditionsTable",
                                items: "{/conditions}",
                                columns: [
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Code" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Description" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Amount" }) }),
                                    new sap.m.Column({ header: new sap.m.Label({ text: "Currency" }) })
                                ],
                                items: {
                                    path: "/conditions",
                                    template: new sap.m.ColumnListItem({
                                        cells: [
                                            new ComboBox({
                                                selectedKey: "{code}",
                                                change: this.onConditionCodeChange.bind(this),
                                                items: {
                                                    path: "conditionsList>/",
                                                    template: new Item({
                                                        key: "{conditionsList>code}",
                                                        text: "{conditionsList>code} - {conditionsList>description}"
                                                    })
                                                }
                                            }),
                                            new Text({ text: "{description}" }),
                                            new Input({ value: "{amount}", type: "Number" }),
                                            new Input({ value: "{currency}" })
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
                            var oUpdatedData = this._oEditDialog.getModel().getData();

                            // 🧩 Validate required fields
                            var aRequiredFields = [
                                { id: "editUnitDescInput", name: "Unit Description" },
                                { id: "editCompanyCodeIdInput", name: "Company Code ID" },
                                { id: "editCompanyCodeDescInput", name: "Company Code Description" },
                                { id: "editProjectIdInput", name: "Project ID" },
                                { id: "editProjectDescInput", name: "Project Description" },
                                // { id: "editBuildingIdInput", name: "Building ID" },
                                { id: "editUnitTypeDescInput", name: "Unit Type Description" },
                                { id: "editUsageTypeDescInput", name: "Usage Type Description" },
                                { id: "editUnitStatusDescInput", name: "Unit Status Description" },
                                { id: "editFloorDescInput", name: "Floor Description" },
                                { id: "editZoneInput", name: "Zone" },
                                { id: "editSalesPhaseInput", name: "Sales Phase" },
                                { id: "editFinishingSpexDescInput", name: "Finishing Spex Description" },
                                { id: "editProfitCenterInput", name: "Profit Center" },
                                { id: "editFunctionalAreaInput", name: "Functional Area" },
                                { id: "editUnitDeliveryDateInput", name: "Delivery Date" },
                                { id: "editSupplementaryTextInput", name: "Supplementary Text" }
                            ];

                            var bValid = true;
                            aRequiredFields.forEach(function (field) {
                                var oControl = sap.ui.getCore().byId(field.id);
                                if (!oControl.getValue()) {
                                    oControl.setValueState("Error");
                                    oControl.setValueStateText(field.name + " is required");
                                    bValid = false;
                                } else {
                                    oControl.setValueState("None");
                                }
                            });

                            if (!bValid) {
                                sap.m.MessageBox.warning("Please fill all required fields before saving.");
                                return;
                            }

                            // Revert to original PATCH logic with defaults
                            const payload = {
                                unitId: oUpdatedData.unitId,
                                unitDescription: oUpdatedData.unitDescription,
                                companyCodeId: oUpdatedData.companyCodeId,
                                companyCodeDescription: oUpdatedData.companyCodeDescription,
                                projectId: oUpdatedData.projectId,
                                projectDescription: oUpdatedData.projectDescription,
                                // buildingId: oUpdatedData.buildingId,
                                unitTypeDescription: oUpdatedData.unitTypeDescription,
                                usageTypeDescription: oUpdatedData.usageTypeDescription,
                                unitStatusDescription: oUpdatedData.unitStatusDescription,
                                floorDescription: oUpdatedData.floorDescription,
                                zone: oUpdatedData.zone,
                                salesPhase: oUpdatedData.salesPhase,
                                finishingSpexDescription: oUpdatedData.finishingSpexDescription,
                                unitDeliveryDate: oUpdatedData.unitDeliveryDate || null,
                                supplementaryText: oUpdatedData.supplementaryText,
                                profitCenter: oUpdatedData.profitCenter || 0,
                                functionalArea: oUpdatedData.functionalArea || 0,
                                measurements: oUpdatedData.measurements,
                                conditions: oUpdatedData.conditions
                            };

                            // Fix for the error: Remove empty compositions from payload
                            if (payload.measurements.length === 0) {
                                delete payload.measurements;
                            }
                            if (payload.conditions.length === 0) {
                                delete payload.conditions;
                            }

                            // 🟢 Proceed with PATCH request
                            fetch(`/odata/v4/real-estate/Units(unitId='${oUpdatedData.unitId}')`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(payload)
                            })
                                .then(response => {
                                    if (!response.ok) throw new Error("Update failed");
                                    return response.json();
                                })
                                .then(() => {
                                    sap.m.MessageToast.show("Unit updated successfully!");
                                    this._loadUnits();
                                    this._oEditDialog.close();
                                })
                                .catch(err => sap.m.MessageBox.error("Error: " + err.message));
                        }.bind(this)
                    }),

                    endButton: new sap.m.Button({
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

        onCompanyCodeChange: function (oEvent) {
            var oComboBox = oEvent.getSource();
            var sSelectedKey = oComboBox.getSelectedKey();
            var oSelectedItem = oComboBox.getSelectedItem();
            var sDescription = oSelectedItem ? oSelectedItem.getText().split(" - ")[1] || "" : "";
            var oContext = oComboBox.getBindingContext();
            if (oContext) {
                oContext.getModel().setProperty(oContext.getPath() + "/companyCodeDescription", sDescription);
            } else {
                oComboBox.getModel().setProperty("/companyCodeDescription", sDescription);
            }
        },
        onProjectChange: function (oEvent) {
            var oComboBox = oEvent.getSource();
            var sSelectedKey = oComboBox.getSelectedKey();
            var oSelectedItem = oComboBox.getSelectedItem();
            var sDescription = oSelectedItem ? oSelectedItem.getText().split(" - ")[1] || "" : "";
            var oModel = oComboBox.getModel();
            oModel.setProperty("/projectDescription", sDescription);

            // Find selected project to get profit and functional
            const projects = this.getView().getModel("projectsList").getData();
            const selectedProject = projects.find(p => p.projectId === sSelectedKey);
            if (selectedProject) {
                oModel.setProperty("/profitCenter", selectedProject.profitCenter);
                oModel.setProperty("/functionalArea", selectedProject.functionalArea);
            }

            // Update filtered buildings
            this._updateFilteredBuildings(sSelectedKey, oModel);
        },
        onAddMeasurementRow: function (oEvent) {
            const oModel = oEvent.getSource().getModel();
            oModel.getProperty("/measurements").push({ code: "", description: "", quantity: 0, uom: "" });
            oModel.refresh();
        },
        onDeleteMeasurementRow: function (oEvent) {
            const oModel = oEvent.getSource().getModel();
            const aMeasurements = oModel.getProperty("/measurements");
            aMeasurements.pop();
            oModel.refresh();
        },
        onAddConditionRow: function (oEvent) {
            const oModel = oEvent.getSource().getModel();
            oModel.getProperty("/conditions").push({ code: "", description: "", amount: 0, currency: "" });
            oModel.refresh();
        },
        onDeleteConditionRow: function (oEvent) {
            const oModel = oEvent.getSource().getModel();
            const aConditions = oModel.getProperty("/conditions");
            aConditions.pop();
            oModel.refresh();
        },
        onMeasurementCodeChange: function (oEvent) {
            var oComboBox = oEvent.getSource();
            var sSelectedKey = oComboBox.getSelectedKey();
            var oSelectedItem = oComboBox.getSelectedItem();
            var sDescription = oSelectedItem ? oSelectedItem.getText().split(" - ")[1] || "" : "";
            var oContext = oComboBox.getBindingContext();
            if (oContext) {
                oContext.getModel().setProperty(oContext.getPath() + "/description", sDescription);
            }
        },
        onConditionCodeChange: function (oEvent) {
            var oComboBox = oEvent.getSource();
            var sSelectedKey = oComboBox.getSelectedKey();
            var oSelectedItem = oComboBox.getSelectedItem();
            var sDescription = oSelectedItem ? oSelectedItem.getText().split(" - ")[1] || "" : "";
            var oContext = oComboBox.getBindingContext();
            if (oContext) {
                oContext.getModel().setProperty(oContext.getPath() + "/description", sDescription);
            }
        },
        onFilterUnits: function () {
            var oTable = this.byId("unitsTable");
            var oBinding = oTable.getBinding("items");

            var sStatusKey = this.byId("unitStatusFilter").getSelectedKey();
            var sUnitId = this.byId("unitIdFilter").getSelectedKey();

            var aFilters = [];

            if (sStatusKey) {
                aFilters.push(
                    new sap.ui.model.Filter("unitStatusDescription", sap.ui.model.FilterOperator.EQ, sStatusKey)
                );
            }

            if (sUnitId) {
                aFilters.push(
                    new sap.ui.model.Filter("unitId", sap.ui.model.FilterOperator.EQ, sUnitId)
                );
            }

            var oCombinedFilter = null;
            if (aFilters.length > 1) {
                oCombinedFilter = new sap.ui.model.Filter(aFilters, true); // true = AND
            } else if (aFilters.length === 1) {
                oCombinedFilter = aFilters[0];
            }

            oBinding.filter(oCombinedFilter ? [oCombinedFilter] : []);
        },
        onCreateReservation: function (oEvent) {
            var oUnit = oEvent.getSource().getBindingContext().getObject();
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("Reservations", { unitId: oUnit.unitId });
        },
        
        onClearFilter: function () {
            var oModel = this.getView().getModel("view");

            this.byId("unitStatusFilter").setSelectedKey("");
            this.byId("unitIdFilter").setSelectedKey("");
            oModel.setProperty("/selectedUnitStatus", "");
            oModel.setProperty("/selectedUnitId", "");
            var oTable = this.byId("unitsTable");
            oTable.getBinding("items").filter([]);
        },


    });
});