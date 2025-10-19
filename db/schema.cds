namespace real.estate;

using {managed} from '@sap/cds/common';

entity Buildings {
        companyCodeId          : String(4);
        companyCodeDescription : String(60);
        project                : Association to Projects;
        projectId              : String(8);
        projectDescription     : String(60);
    key buildingId             : String(8);
        buildingDescription    : String(60);
        buildingOldCode        : String(8);

        location               : String(60);
        validFrom              : Date;
        validTo                : Date;
        businessArea           : Integer;
        profitCenter           : Integer;
        functionalArea         : Integer;

        units                  : Association to many Units
                                     on units.building = $self;
}

entity Projects : managed {
        companyCodeId          : String(4);
        companyCodeDescription : String(60);

    key projectId              : String(8);
        projectDescription     : String(60);

        validFrom              : Date;
        validTo                : Date;

        location               : String(40);
        businessArea           : Integer;
        profitCenter           : Integer;
        functionalArea         : Integer;

        supplementaryText      : String(255);

        buildings              : Composition of many Buildings
                                     on buildings.project = $self;

        paymentPlanProjects    : Association to many PaymentPlanProjects
                                     on paymentPlanProjects.project = $self;

}

entity Units : managed {
        companyCodeId            : String(4);
        companyCodeDescription   : String(60);

        project                  : Association to Projects;
        projectId                : String(8);
        projectDescription       : String(60);

        building                 : Association to Buildings;
        buildingId               : String(8);
        buildingOldCode          : String(20);

    key unitId                   : String(8);
        unitOldCode              : String(20);
        unitDescription          : String(60);

        unitTypeCode             : String(4);
        unitTypeDescription      : String(60);

        usageTypeCode            : String(4);
        usageTypeDescription     : String(60);

        unitStatusCode           : String(4);
        unitStatusDescription    : String(60);

        floorCode                : String(4);
        floorDescription         : String(60);

        zone                     : String(60);
        salesPhase               : String(60);

        finishingSpexCode        : String(4);
        finishingSpexDescription : String(60);

        unitDeliveryDate         : Date;

        profitCenter             : Integer;
        functionalArea           : Integer;

        supplementaryText        : String(255);

        // Composition tables for Measurements and Prices
        measurements             : Composition of many UnitMeasurements
                                       on measurements.unit = $self;
        prices                   : Composition of many UnitPrices
                                       on prices.unit = $self;

}

entity UnitMeasurements : managed {
    key ID              : UUID;
        unit            : Association to Units;
        builtUpAreaM2   : Decimal(15, 2);
        gardenAreaM2    : Decimal(15, 2);
        numberOfRoomsPc : Decimal(5, 2);
}

entity UnitPrices : managed {
    key ID                : UUID;
        unit              : Association to Units;
        originalPriceZU01 : Decimal(15, 2);
        parkingPriceZU03  : Decimal(15, 2);
        maintenancePrice  : Decimal(15, 2);
}

entity PaymentPlans : managed {
    key paymentPlanId  : String(20);
    description        : String(60);
    companyCodeId          : String(4);
    planYears          : Integer;
    validFrom          : Date;
    validTo            : Date;
    planStatus         : String(1);

    // Composition of schedule items
    schedule : Composition of many PaymentPlanSchedules on schedule.paymentPlan = $self;

    // Assigned projects
    assignedProjects : Composition of many PaymentPlanProjects on assignedProjects.paymentPlan = $self;
}

entity PaymentPlanSchedules : managed {
    key ID : UUID;

    paymentPlan        : Association to PaymentPlans;

    conditionType      : Association to ConditionTypes;
    basePrice          : Association to BasePrices;
    calculationMethod  : Association to CalculationMethods;
    frequency          : Association to Frequencies;

    percentage         : Decimal(5,2);
    dueInMonth         : Integer;
    numberOfInstallments : Integer;
    numberOfYears        : Integer;
}

entity PaymentPlanProjects : managed {
    key ID : UUID;
    paymentPlan : Association to PaymentPlans;
    project     : Association to Projects;
}

entity ConditionTypes {
    key code : String(10);
    description : String(60);
}

entity BasePrices {
    key code : String(10);
    description : String(60);
}

entity CalculationMethods {
    key code : String(10);
    description : String(60);
}

entity Frequencies {
    key code : String(10);
    description : String(60);
}