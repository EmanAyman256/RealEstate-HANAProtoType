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
    buildingId             : String(8);
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

entity Units {
    key ID       : String;
        building : Association to Buildings;
        name     : String;
        status   : String;
}

entity Projects : cuid, managed {
    companyCodeId          : String(4);
    companyCodeDescription : String(60);

    projectId              : String(8);
    projectDescription     : String(60);

    validFrom              : Date;
    validTo                : Date;

    location               : String(40);
    businessArea           : String(4);
    profitCenter           : String(10);
    functionalArea         : String(16);

    supplementaryText      : String(255);

    buildings              : Composition of many Buildings
                                 on buildings.project = $self;
}
