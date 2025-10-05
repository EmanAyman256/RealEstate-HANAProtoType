namespace real.estate;

using {
    cuid,
    managed
} from '@sap/cds/common';

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
        businessArea           : String(4);
        profitCenter           : String(10);
        functionalArea         : String(16);

        units                  : Association to many Units
                                     on units.building = $self;
}


entity Projects : cuid, managed {
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
}

entity Units : cuid, managed {

    key unitId                   : String(8);
        unitOldCode              : String(20);
        unitDescription          : String(60);

        companyCodeId            : String(4);
        companyCodeDescription   : String(60);

        project                  : Association to Projects;
        projectId                : String(8);
        projectDescription       : String(60);

        building                 : Association to Buildings;
        buildingId               : String(8);
        buildingOldCode          : String(20);

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

        originalPriceZU01        : Decimal(15, 2);
        parkingPriceZU03         : Decimal(15, 2);
        maintenancePrice         : Decimal(15, 2);

        builtUpAreaM2            : Decimal(15, 2);
        gardenAreaM2             : Decimal(15, 2);
        numberOfRoomsPc          : Decimal(5, 2);

        profitCenter             : Integer;
        functionalArea           : Integer;

        supplementaryText        : String(255);
}
