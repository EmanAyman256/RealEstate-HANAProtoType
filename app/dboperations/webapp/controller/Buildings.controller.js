sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/m/MessageToast",

    "sap/ui/model/json/JSONModel"],
    (Controller, MessageBox, Dialog, Input, Button, Label, VBox,MessageToast, JSONModel) => {
        "use strict";
        return Controller.extend("dboperations.controller.Buildings", {
            onInit() {
                this.getOwnerComponent().getRouter()
                    .getRoute("Buildings")
                    .attachPatternMatched(this._onRouteMatched, this);

                var oModel = new sap.ui.model.json.JSONModel({
                    Buildings: [],
                    Projects:[]
                });
                this.getView().setModel(oModel, "view");

                var oModel = new JSONModel();
                fetch("/odata/v4/real-estate/Buildings")
                    .then(response => response.json())
                    .then(data => {
                        oModel.setData({ Buildings: data.value });
                        this.getView().byId("BuildingsTable").setModel(oModel);
                    })
                    .catch(err => {
                        console.error("Error fetching Buildings", err);
                    });
                    fetch("/odata/v4/real-estate/Projects")
                    .then(response => response.json())
                    .then(data => {
                        oModel.setData({ Projects: data.value });
                        //this.getView().byId("BuildingsTable").setModel(oModel);
                    })
                    .catch(err => {
                        console.error("Error fetching Buildings", err);
                    });
            },
            _onRouteMatched: function () {
                this._loadBuildings();
            },
            _loadBuildings: function () {
                var oModel = new sap.ui.model.json.JSONModel();
                fetch("/odata/v4/real-estate/Buildings")
                    .then(response => response.json())
                    .then(data => {
                        oModel.setData({ Buildings: data.value });
                        this.getView().byId("BuildingsTable").setModel(oModel);
                    })
                    .catch(err => {
                        console.error("Error fetching Buildings ", err);
                    });
            },
            onAddBuilding: function () {
                if (!this._oAddDialog) {
                    var oNewBuildingModel = new sap.ui.model.json.JSONModel({
                        buildingId: "",
                        buildingDescription: "",
                        buildingOldCode: "",
                        projectId: "",
                        projectDescription: "",
                        companyCodeId: "",
                        companyCodeDescription: "",
                        validFrom: "",
                        validTo: "",
                        location: "",
                        businessArea: "",
                        profitCenter: "",
                        functionalArea: "",
                    });

                    this._oAddDialog = new sap.m.Dialog({
                        title: "Add New Project",
                        content: new sap.ui.layout.form.SimpleForm({
                            editable: true,
                            content: [
                                new sap.m.Label({ text: "Building ID" }),
                                new sap.m.Input({ value: "{/buildingId}" }),

                                new sap.m.Label({ text: "Building Description" }),
                                new sap.m.Input({ value: "{/buildingDescription}" }),

                                new sap.m.Label({ text: "Building Old Code" }),
                                new sap.m.Input({ value: "{/buildingOldCode}" }),
                                
                                // Will be selected dropdown ...

                                // new sap.m.Label({ text: "Project ID" }),
                                // new sap.m.Input({ value: "{/projectId}" }),

                                // new sap.m.Label({ text: "Project Description" }),
                                // new sap.m.Input({ value: "{/projectDescription}" }),

                                new sap.m.Label({ text: "Company Code" }),
                                new sap.m.Input({ value: "{/companyCodeId}" }),

                                new sap.m.Label({ text: "Company Code Description" }),
                                new sap.m.Input({ value: "{/companyCodeDescription}" }),

                                new sap.m.Label({ text: "Valid From" }),
                                new sap.m.DatePicker({ value: "{/validFrom}" }),

                                new sap.m.Label({ text: "Valid To" }),
                                new sap.m.DatePicker({ value: "{/validTo}" }),

                                new sap.m.Label({ text: "Location" }),
                                new sap.m.Input({ value: "{/location}" }),

                                new sap.m.Label({ text: "Business Area" }),
                                new sap.m.Input({ value: "{/businessArea}" }),

                                new sap.m.Label({ text: "Profit Center" }),
                                new sap.m.Input({ value: "{/profitCenter}" }),

                                new sap.m.Label({ text: "Functional Area" }),
                                new sap.m.Input({ value: "{/functionalArea}" }),
                            ]
                        }),
                        beginButton: new sap.m.Button({
                            text: "Save",
                            type: "Emphasized",
                            press: function () {
                                var oData = this._oAddDialog.getModel().getData();
                                if (oData.validFrom) {
                                    oData.validFrom = new Date(oData.validFrom).toISOString().split("T")[0];
                                }
                                if (oData.validTo) {
                                    oData.validTo = new Date(oData.validTo).toISOString().split("T")[0];
                                }
                                fetch("/odata/v4/real-estate/Buildings", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(oData)
                                })
                                    .then(response => {
                                        if (!response.ok) {
                                            throw new Error("Failed to create Building");
                                        }
                                        return response.json();
                                    })
                                    .then((newBuilding) => {
                                        sap.m.MessageToast.show("Building created!");

                                        // Get the table model
                                        var oTable = this.getView().byId("BuildingsTable");
                                        var oModel = oTable.getModel();
                                        var aBuildings = oModel.getProperty("/Buildings") || [];

                                        // Add the new building to the list
                                        aBuildings.push(newBuilding);

                                        // Update the model data
                                        oModel.setProperty("/Buildings", aBuildings);

                                        // Close dialog
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
                                this._oAddDialog.close();
                            }.bind(this)
                        })
                    });

                    this._oAddDialog.setModel(oNewBuildingModel);
                    this.getView().addDependent(this._oAddDialog);
                }
                this._oAddDialog.open();
            },
            onEdit: function (oEvent) {
                var oButton = oEvent.getSource();
                var oContext = oButton.getParent().getParent().getBindingContext();

                if (!oContext) {
                    sap.m.MessageBox.warning("Error: Unable to retrieve row data");
                    return;
                }

                var oSelectedData = oContext.getObject();
                var oTable = this.getView().byId("buildingsTable");
                var oModel = oTable.getModel();

                // Create Edit Dialog if not exists
                if (!this._oEditDialog) {
                    // Create a reusable empty model structure
                    this._oEditBuildingModel = new sap.ui.model.json.JSONModel({
                        buildingId: "",
                        buildingDescription: "",
                        buildingOldCode: "",
                        projectId: "",
                        projectDescription: "",
                        companyCodeId: "",
                        companyCodeDescription: "",
                        validFrom: "",
                        validTo: "",
                        location: "",
                        businessArea: "",
                        profitCenter: "",
                        functionalArea: "",
                    });

                    this._oEditDialog = new sap.m.Dialog({
                        title: "Edit Building",
                        titleAlignment: "Center",
                        contentWidth: "600px",
                        content: [
                            new sap.ui.layout.form.SimpleForm({
                                editable: true,
                                layout: "ResponsiveGridLayout",
                                content: [
                                    new sap.m.Label({ text: "Building ID" }),
                                    new sap.m.Input({ value: "{/buildingId}", editable: false }),

                                    new sap.m.Label({ text: "Building Description" }),
                                    new sap.m.Input({ value: "{/buildingDescription}" }),

                                    new sap.m.Label({ text: "Building Old Code" }),
                                    new sap.m.Input({ value: "{/buildingOldCode}" }),

                                    new sap.m.Label({ text: "Project ID" }),
                                    new sap.m.Input({ value: "{/projectId}" }),

                                    new sap.m.Label({ text: "Project Description" }),
                                    new sap.m.Input({ value: "{/projectDescription}" }),

                                    new sap.m.Label({ text: "Company Code" }),
                                    new sap.m.Input({ value: "{/companyCodeId}" }),

                                    new sap.m.Label({ text: "Company Code Description" }),
                                    new sap.m.Input({ value: "{/companyCodeDescription}" }),

                                    new sap.m.Label({ text: "Valid From" }),
                                    new sap.m.DatePicker({ value: "{/validFrom}" }),

                                    new sap.m.Label({ text: "Valid To" }),
                                    new sap.m.DatePicker({ value: "{/validTo}" }),

                                    new sap.m.Label({ text: "Location" }),
                                    new sap.m.Input({ value: "{/location}" }),

                                    new sap.m.Label({ text: "Business Area" }),
                                    new sap.m.Input({ value: "{/businessArea}" }),

                                    new sap.m.Label({ text: "Profit Center" }),
                                    new sap.m.Input({ value: "{/profitCenter}" }),

                                    new sap.m.Label({ text: "Functional Area" }),
                                    new sap.m.Input({ value: "{/functionalArea}" }),
                                ]
                            })
                        ],
                        beginButton: new sap.m.Button({
                            text: "Save",
                            type: "Emphasized",
                            press: () => {
                                var oUpdated = this._oEditBuildingModel.getData();

                                // Format dates
                                if (oUpdated.validFrom)
                                    oUpdated.validFrom = new Date(oUpdated.validFrom).toISOString().split("T")[0];
                                if (oUpdated.validTo)
                                    oUpdated.validTo = new Date(oUpdated.validTo).toISOString().split("T")[0];

                                // Send PATCH request
                                fetch(`/odata/v4/real-estate/Buildings(${oUpdated.buildingId})`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(oUpdated)
                                })
                                    .then(response => {
                                        if (!response.ok) throw new Error("Failed to update Building");
                                        return response.json();
                                    })
                                    .then(updatedBuilding => {
                                        // Update local model instantly
                                        var aBuildings = oModel.getProperty("/Buildings") || [];
                                        var iIndex = aBuildings.findIndex(b => b.buildingId === updatedBuilding.buildingId);
                                        if (iIndex > -1) {
                                            aBuildings[iIndex] = updatedBuilding;
                                            oModel.setProperty("/Buildings", aBuildings);
                                        }

                                        sap.m.MessageToast.show("Building updated successfully!");
                                        this._oEditDialog.close();
                                    })
                                    .catch(err => {
                                        sap.m.MessageBox.error("Error: " + err.message);
                                    });
                            }
                        }),
                        endButton: new sap.m.Button({
                            text: "Cancel",
                            press: () => this._oEditDialog.close()
                        })
                    });

                    this._oEditDialog.setModel(this._oEditBuildingModel);
                    this.getView().addDependent(this._oEditDialog);
                }

                // Load the selected building data into the model
                this._oEditBuildingModel.setData(Object.assign({}, oSelectedData));

                // Open dialog
                this._oEditDialog.open();
            },
            onDelete: function (oEvent) {
                const oContext = oEvent.getSource().getBindingContext();
                const sBuildingId = oContext.getProperty("buildingId");
                MessageBox.confirm(`Delete Unit ${sBuildingId}?`, {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    onClose: (sAction) => {
                        if (sAction === MessageBox.Action.OK) {
                            fetch(`/odata/v4/real-estate/Buildings('${encodeURIComponent(sBuildingId)}')`, { method: "DELETE" })
                                .then(r => {
                                    if (r.ok) {
                                        MessageToast.show("Deleted successfully!");
                                        this. _loadBuildings();
                                    } else throw new Error("Delete failed");
                                })
                                .catch(err => MessageBox.error(err.message));
                        }
                    }
                });
            },
onAddUnit: function (oEvent) {
  const oContext = oEvent.getSource().getBindingContext();
  const oBuilding = oContext.getObject();

  // Pre-fill the new Unit model
  const oNewUnitModel = new sap.ui.model.json.JSONModel({
    unitId: "",
    unitDescription: "",
    buildingId: oBuilding.buildingId,
    buildingOldCode: oBuilding.buildingOldCode,
    projectId: oBuilding.projectId,
    projectDescription: oBuilding.projectDescription,
    companyCodeId: oBuilding.companyCodeId,
    companyCodeDescription: oBuilding.companyCodeDescription,
    usageTypeCode: "",
    usageTypeDescription: "",
    unitTypeCode: "",
    unitTypeDescription: "",
    unitStatusCode: "",
    unitStatusDescription: "",
    floorCode: "",
    floorDescription: "",
    zone: "",
    salesPhase: "",
    finishingSpexCode: "",
    finishingSpexDescription: "",
    unitDeliveryDate: "",
    builtUpAreaM2: "",
    gardenAreaM2: "",
    numberOfRoomsPc: "",
    originalPriceZU01: "",
    parkingPriceZU03: "",
    maintenancePrice: "",
    supplementaryText: ""
  });

  if (!this._oAddUnitDialog) {
    this._oAddUnitDialog = new sap.m.Dialog({
      title: "Add New Unit",
      contentWidth: "700px",
      resizable: true,
      draggable: true,
      content: new sap.ui.layout.form.SimpleForm({
        editable: true,
        layout: "ResponsiveGridLayout",
        content: [
          new sap.m.Label({ text: "Unit ID" }),
          new sap.m.Input({ value: "{/unitId}" }),

          new sap.m.Label({ text: "Unit Description" }),
          new sap.m.Input({ value: "{/unitDescription}" }),

          new sap.m.Label({ text: "Building ID" }),
          new sap.m.Input({ value: "{/buildingId}", editable: false }),

          new sap.m.Label({ text: "Project ID" }),
          new sap.m.Input({ value: "{/projectId}", editable: false }),

          new sap.m.Label({ text: "Unit Type Code" }),
          new sap.m.Input({ value: "{/unitTypeCode}" }),

          new sap.m.Label({ text: "Unit Type Description" }),
          new sap.m.Input({ value: "{/unitTypeDescription}" }),

          new sap.m.Label({ text: "Usage Type Code" }),
          new sap.m.Input({ value: "{/usageTypeCode}" }),

          new sap.m.Label({ text: "Usage Type Description" }),
          new sap.m.Input({ value: "{/usageTypeDescription}" }),

          new sap.m.Label({ text: "Built Up Area (m²)" }),
          new sap.m.Input({ value: "{/builtUpAreaM2}" }),

          new sap.m.Label({ text: "Garden Area (m²)" }),
          new sap.m.Input({ value: "{/gardenAreaM2}" }),

          new sap.m.Label({ text: "Number of Rooms" }),
          new sap.m.Input({ value: "{/numberOfRoomsPc}" }),

          new sap.m.Label({ text: "Unit Delivery Date" }),
          new sap.m.DatePicker({
            value: "{/unitDeliveryDate}",
            displayFormat: "long",
            valueFormat: "yyyy-MM-dd",
            placeholder: "Select date",
            showClearIcon: true
          }),

          new sap.m.Label({ text: "Original Price" }),
          new sap.m.Input({ value: "{/originalPriceZU01}" }),

          new sap.m.Label({ text: "Parking Price" }),
          new sap.m.Input({ value: "{/parkingPriceZU03}" }),

          new sap.m.Label({ text: "Maintenance Price" }),
          new sap.m.Input({ value: "{/maintenancePrice}" }),

          new sap.m.Label({ text: "Supplementary Text" }),
          new sap.m.TextArea({ value: "{/supplementaryText}" })
        ]
      }),

      beginButton: new sap.m.Button({
        text: "Save",
        type: "Emphasized",
        press: function () {
          const oData = this._oAddUnitDialog.getModel().getData();

          // ✅ Convert and validate date
          if (oData.unitDeliveryDate) {
            oData.unitDeliveryDate = new Date(oData.unitDeliveryDate);
          }

          const buildingFrom = new Date(oBuilding.validFrom);
          const buildingTo = new Date(oBuilding.validTo);
          const deliveryDate = oData.unitDeliveryDate;

          // 🧠 Validation checks
          if (!deliveryDate) {
            sap.m.MessageBox.warning("Please select a Unit Delivery Date.");
            return;
          }

          if (deliveryDate < buildingFrom) {
            sap.m.MessageBox.error(
              `Unit delivery date (${deliveryDate.toISOString().split("T")[0]}) cannot be before Building validFrom (${oBuilding.validFrom}).`
            );
            return;
          }

          if (deliveryDate > buildingTo) {
            sap.m.MessageBox.error(
              `Unit delivery date (${deliveryDate.toISOString().split("T")[0]}) cannot be after Building validTo (${oBuilding.validTo}).`
            );
            return;
          }

          // ✅ Prepare body and submit
          oData.unitDeliveryDate = deliveryDate.toISOString().split("T")[0];

          fetch("/odata/v4/real-estate/Units", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(oData)
          })
            .then((response) => {
              if (!response.ok) throw new Error("Failed to create Unit");
              return response.json();
            })
            .then(() => {
              sap.m.MessageToast.show("Unit created successfully!");
              this._oAddUnitDialog.close();
            })
            .catch((err) => sap.m.MessageBox.error("Error: " + err.message));
        }.bind(this)
      }),

      endButton: new sap.m.Button({
        text: "Cancel",
        press: function () {
          this._oAddUnitDialog.close();
        }.bind(this)
      })
    });

    this.getView().addDependent(this._oAddUnitDialog);
  }

  this._oAddUnitDialog.setModel(oNewUnitModel);
  this._oAddUnitDialog.open();
},
onDetails: function (oEvent) {
    var oBindingContext = oEvent.getSource().getBindingContext();
    if (!oBindingContext) {
        return;
    }

    var oData = oBindingContext.getObject();
    var oDialogModel = new sap.ui.model.json.JSONModel({
        BuildingId: oData.buildingId,
        BuildingDescription: oData.buildingDescription,
        BuildingOldCode: oData.buildingOldCode,
        ProjectId: oData.projectId,
        ProjectDescription: oData.projectDescription,
        CompanyCodeId: oData.companyCodeId,
        CompanyCodeDescription: oData.companyCodeDescription,
        validFrom: oData.validFrom,
        validTo: oData.validTo,
        location: oData.location,
        businessArea: oData.businessArea,
        profitCenter: oData.profitCenter,
        functionalArea: oData.functionalArea,
        supplementaryText: oData.supplementaryText
    });

    if (!this._oDetailsDialog) {
        this._oDetailsDialog = new sap.m.Dialog({
            title: "Building Details",
            contentWidth: "100%",
            resizable: true,
            draggable: true,
            content: [
                new sap.m.IconTabBar({
                    expandable: true,
                    items: [
                        // 🔹 Tab 1: Building General Data
                        new sap.m.IconTabFilter({
                            text: "General Data",
                            icon: "sap-icon://building",
                            content: [
                                new sap.ui.layout.form.SimpleForm({
                                    editable: false,
                                    layout: "ResponsiveGridLayout",
                                    labelSpanL: 3,
                                    columnsL: 2,
                                    content: [
                                        new sap.m.Label({ text: "Building ID (8 digits)" }),
                                        new sap.m.Text({ text: "{/BuildingId}" }),

                                        new sap.m.Label({ text: "Building Description" }),
                                        new sap.m.Text({ text: "{/BuildingDescription}" }),

                                        new sap.m.Label({ text: "Building Old Code" }),
                                        new sap.m.Text({ text: "{/BuildingOldCode}" }),

                                        new sap.m.Label({ text: "Project ID" }),
                                        new sap.m.Text({ text: "{/ProjectId}" }),

                                        new sap.m.Label({ text: "Project Description" }),
                                        new sap.m.Text({ text: "{/ProjectDescription}" }),

                                        new sap.m.Label({ text: "Company Code" }),
                                        new sap.m.Text({ text: "{/CompanyCodeId}" }),

                                        new sap.m.Label({ text: "Company Code Description" }),
                                        new sap.m.Text({ text: "{/CompanyCodeDescription}" }),

                                        new sap.m.Label({ text: "Valid From" }),
                                        new sap.m.Text({ text: "{/validFrom}" }),

                                        new sap.m.Label({ text: "Valid To" }),
                                        new sap.m.Text({ text: "{/validTo}" }),

                                        new sap.m.Label({ text: "Location" }),
                                        new sap.m.Text({ text: "{/location}" })
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
                                        new sap.m.Label({ text: "Business Area" }),
                                        new sap.m.Text({ text: "{/businessArea}" }),

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
}



        });
    });