using real.estate as my from '../db/schema';

service RealEstateService {
    entity Buildings as projection on my.Buildings;
    entity Units     as projection on my.Units;
    entity Projects  as projection on my.Projects;
    entity PaymentPlans  as projection on my.PaymentPlans;
    entity PaymentPlanSchedules  as projection on my.PaymentPlanSchedules;
    entity PaymentPlanProjects  as projection on my.PaymentPlanProjects;

}
