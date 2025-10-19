using real.estate as my from '../db/schema';

service RealEstateService {
    entity Buildings            as projection on my.Buildings;
    entity Units                as projection on my.Units;
    entity Projects             as projection on my.Projects;
    entity UnitMeasurements     as projection on my.UnitMeasurements;
    entity UnitPrices           as projection on my.UnitPrices;
    entity PaymentPlans         as projection on my.PaymentPlans;
    entity PaymentPlanSchedules as projection on my.PaymentPlanSchedules;
    entity PaymentPlanProjects  as projection on my.PaymentPlanProjects;
    entity ConditionTypes       as projection on my.ConditionTypes;
    entity Frequencies          as projection on my.Frequencies;
    entity CalculationMethods   as projection on my.CalculationMethods;

}
