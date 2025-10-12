sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("dboperations.controller.DBOperations", {
        onInit() { },
        onNavigateToProjects() {
            this.getOwnerComponent().getRouter().navTo("Projects");
        },
        onNavigateToBuildings() {
            this.getOwnerComponent().getRouter().navTo("Buildings");
        },
        onNavigateToUnits() {
            this.getOwnerComponent().getRouter().navTo("Units");
        },
          onNavigateToPaymentPlans() {
            this.getOwnerComponent().getRouter().navTo("PaymentPlans");
        },
           onNavigateToPaymentPlanSchedules() {
            this.getOwnerComponent().getRouter().navTo("PaymentPlanSchedules");
        },
           onNavigateToPaymentPlanProjects() {
            this.getOwnerComponent().getRouter().navTo("PaymentPlanProjects");
        },
    });
});