const cds = require('@sap/cds');
const { ref } = cds.ql;  // <-- add this line

module.exports = cds.service.impl(async function () {

  const { Projects, Units, Buildings, PaymentPlans, PaymentPlanSchedules, PaymentPlanProjects , UnitMeasurements, UnitPrices } = this.entities;


  /*-----------------------Buildings---------------------------*/
  // READ
  this.on('READ', Buildings, async (req) => {
    console.log('READ Buildings called');
    const db = cds.transaction(req);
    return await db.run(req.query);
  });
  // CREATE
  this.on('CREATE', Buildings, async (req) => {
    console.log('CREATE Buildings called with data:', req.data);
    const db = cds.transaction(req);
    return await db.run(
      INSERT.into(Buildings).entries(req.data)
    );
  });

  // UPDATE
  this.on('UPDATE', Buildings, async (req) => {
    try {
      const { buildingId } = req.data;

      // Log the request
      console.log(`Updating Building ID: ${buildingId}`);
      console.log('Payload:', req.data);

      // Optional: validate data
      if (!req.data.buildingDescription) {
        return req.reject(400, 'Building description is required.');
      }

      // Perform the actual update
      const result = await UPDATE(Buildings)
        .set(req.data)
        .where({ buildingId });

      if (result === 0) {
        return req.reject(404, `Building with ID ${buildingId} not found.`);
      }

      // Return updated record
      const updatedRecord = await SELECT.one.from(Buildings).where({ buildingId });
      return updatedRecord;
    } catch (error) {
      console.error('Error in UPDATE handler:', error);
      req.reject(500, error.message);
    }
  });
  //DELETE
  this.on('DELETE', Buildings, async (req) => {
    console.log('DELETE Building called for buildingId:', req.data.buildingId);
    const db = cds.transaction(req);
    try {
      return await db.run(
        DELETE.from(Buildings).where({ buildingId: req.data.buildingId })
      );
    } catch (error) {
      console.error('Error deleting Building :', error);
      req.error(500, 'Error deleting Building: ' + error.message);
    }
  });



  /*-----------------------Projects---------------------------*/

  // READ
  this.on('READ', Projects, async (req) => {
    console.log('READ Projects called');
    const db = cds.transaction(req);
    return await db.run(req.query);   // execute the query as requested
  });

  // CREATE
  this.on('CREATE', Projects, async (req) => {
    console.log('CREATE Project called with data:', req.data);
    const db = cds.transaction(req);
    try {
      return await db.run(
        INSERT.into(Projects).entries(req.data)
      );
    }
    catch (error) {
      console.error('Error creating Buildings:', error);
      req.error(500, 'Error creating Buildings');
    }
  });

  // UPDATE
  this.on('UPDATE', Projects, async (req) => {
    console.log("UPDATE Project called with:", req.data, "params:", req.params);

    const { projectId } = req.params[0];   // <-- get key from URL
    const db = cds.transaction(req);

    try {
      await db.run(
        UPDATE(Projects)
          .set(req.data)
          .where({ projectId })
      );

      // Return the updated record
      const updated = await db.run(SELECT.one.from(Projects).where({ projectId }));
      return updated;
    } catch (error) {
      console.error("Error updating Project:", error);
      req.error(500, "Error updating Project: " + error.message);
    }
  });


  // DELETE
  this.on('DELETE', Projects, async (req) => {
    console.log('DELETE Project called for projectId:', req.data.projectId);
    const db = cds.transaction(req);
    return await db.run(
      DELETE.from(Projects).where({ projectId: req.data.projectId })
    );
  });


  /*-----------------------Units---------------------------*/

  // READ
  this.on('READ', Units, async (req) => {
    console.log('READ Units called');
    const db = cds.transaction(req);
    return await db.run(req.query);
  });

  // CREATE
  this.on('CREATE', Units, async (req) => {
    console.log('CREATE Unit called with data:', req.data);
    const db = cds.transaction(req);
    try {
      return await db.run(
        INSERT.into(Units).entries(req.data)
      );
    } catch (error) {
      console.error('Error creating Unit:', error);
      req.error(500, 'Error creating Unit');
    }
  });

  // UPDATE 
  this.on('UPDATE', Units, async (req) => {
    console.log('UPDATE Unit called with:', req.data, 'params:', req.params);

    const { unitId } = req.params[0];
    const db = cds.transaction(req);

    try {
      await db.run(
        UPDATE(Units)
          .set(req.data)
          .where({ unitId })
      );

      const updated = await db.run(SELECT.one.from(Units).where({ unitId }));
      return updated;
    } catch (error) {
      console.error('Error updating Unit:', error);
      req.error(500, 'Error updating Unit: ' + error.message);
    }
  });

  // DELETE  
  this.on('DELETE', Units, async (req) => {
    console.log('DELETE Unit called for unitId:', req.data.unitId);
    const db = cds.transaction(req);
    try {
      return await db.run(
        DELETE.from(Units).where({ unitId: req.data.unitId })
      );
    } catch (error) {
      console.error('Error deleting Unit:', error);
      req.error(500, 'Error deleting Unit: ' + error.message);
    }
  });

  /*-----------------------Payment Plans---------------------------*/

  // READ (with compositions expanded)
  this.on('READ', PaymentPlans, async (req) => {
    console.log('READ PaymentPlans called');
    const db = cds.transaction(req);

    try {
      // Expand to include schedule and assignedProjects
      const query = SELECT.from(PaymentPlans)
        .columns(
          '*',
          {
            schedule: SELECT.from(PaymentPlanSchedules).columns(
              'ID',
              { conditionType: { code: 'conditionType_code', description: 'conditionType_description' } },
              { basePrice: { code: 'basePrice_code', description: 'basePrice_description' } },
              { calculationMethod: { code: 'calculationMethod_code', description: 'calculationMethod_description' } },
              { frequency: { code: 'frequency_code', description: 'frequency_description' } },
              'percentage',
              'dueInMonth',
              'numberOfInstallments',
              'numberOfYears'
            ).where({ paymentPlan_paymentPlanId: { '=': ref('paymentPlanId') } }),
            assignedProjects: SELECT.from(PaymentPlanProjects).columns(
              'ID',
              { project: ['projectId', 'projectDescription'] }
            ).where({ paymentPlan_paymentPlanId: { '=': ref('paymentPlanId') } })
          }
        );

      return await db.run(query);
    } catch (error) {
      console.error('Error reading PaymentPlans:', error);
      req.error(500, 'Error reading PaymentPlans: ' + error.message);
    }
  });

  // CREATE
  this.on('CREATE', PaymentPlans, async (req) => {
    console.log('CREATE PaymentPlan called with data:', req.data);
    const db = cds.transaction(req);
    try {
      const { schedule, assignedProjects, ...planData } = req.data;

      // Insert main payment plan
      const result = await db.run(INSERT.into(PaymentPlans).entries(planData));

      const paymentPlanId = planData.paymentPlanId;

      // Insert schedule items if present
      if (Array.isArray(schedule) && schedule.length > 0) {
        for (const item of schedule) {
          await db.run(
            INSERT.into(PaymentPlanSchedules).entries({
              ...item,
              paymentPlan_paymentPlanId: paymentPlanId
            })
          );
        }
      }

      // Insert assigned projects if present
      if (Array.isArray(assignedProjects) && assignedProjects.length > 0) {
        for (const proj of assignedProjects) {
          await db.run(
            INSERT.into(PaymentPlanProjects).entries({
              ...proj,
              paymentPlan_paymentPlanId: paymentPlanId
            })
          );
        }
      }

      return result;
    } catch (error) {
      console.error('Error creating PaymentPlan:', error);
      req.error(500, 'Error creating PaymentPlan: ' + error.message);
    }
  });

  // UPDATE
  this.on('UPDATE', PaymentPlans, async (req) => {
    console.log("UPDATE PaymentPlan called with:", req.data, "params:", req.params);

    const { paymentPlanId } = req.params[0];
    const db = cds.transaction(req);

    try {
      const { schedule, assignedProjects, ...planData } = req.data;

      // Update main record
      await db.run(
        UPDATE(PaymentPlans)
          .set(planData)
          .where({ paymentPlanId })
      );

      // Delete old schedule items and reinsert new
      await db.run(DELETE.from(PaymentPlanSchedules).where({ paymentPlan_paymentPlanId: paymentPlanId }));
      if (Array.isArray(schedule)) {
        for (const item of schedule) {
          await db.run(
            INSERT.into(PaymentPlanSchedules).entries({
              ...item,
              paymentPlan_paymentPlanId: paymentPlanId
            })
          );
        }
      }

      // Delete old assigned projects and reinsert new
      await db.run(DELETE.from(PaymentPlanProjects).where({ paymentPlan_paymentPlanId: paymentPlanId }));
      if (Array.isArray(assignedProjects)) {
        for (const proj of assignedProjects) {
          await db.run(
            INSERT.into(PaymentPlanProjects).entries({
              ...proj,
              paymentPlan_paymentPlanId: paymentPlanId
            })
          );
        }
      }

      // Return updated record
      const updated = await db.run(SELECT.one.from(PaymentPlans).where({ paymentPlanId }));
      return updated;
    } catch (error) {
      console.error("Error updating PaymentPlan:", error);
      req.error(500, "Error updating PaymentPlan: " + error.message);
    }
  });

  // DELETE
  this.on('DELETE', PaymentPlans, async (req) => {
    const { paymentPlanId } = req.data;
    console.log('DELETE PaymentPlan called for:', paymentPlanId);

    const db = cds.transaction(req);
    try {
      // Delete child entities first due to composition
      await db.run(DELETE.from(PaymentPlanSchedules).where({ paymentPlan_paymentPlanId: paymentPlanId }));
      await db.run(DELETE.from(PaymentPlanProjects).where({ paymentPlan_paymentPlanId: paymentPlanId }));

      // Delete main entity
      return await db.run(
        DELETE.from(PaymentPlans).where({ paymentPlanId })
      );
    } catch (error) {
      console.error("Error deleting PaymentPlan:", error);
      req.error(500, "Error deleting PaymentPlan: " + error.message);
    }
  });

  /*-----------------------PaymentPlanSchedules---------------------------*/
  this.on('READ', PaymentPlanSchedules, async (req) => {
    console.log('READ PaymentPlanSchedules called');
    const db = cds.transaction(req);
    return await db.run(req.query);
  });

  /*-----------------------PaymentPlanProjects---------------------------*/
  this.on('READ', PaymentPlanProjects, async (req) => {
    console.log('READ PaymentPlanProjects called');
    const db = cds.transaction(req);
    return await db.run(req.query);
  });


  /*----------------------- UnitMeasurements ---------------------------*/

  this.on('READ', UnitMeasurements, async (req) => {
    console.log('READ UnitMeasurements called');
    const db = cds.transaction(req);
    return await db.run(req.query);
  });

  this.on('CREATE', UnitMeasurements, async (req) => {
    console.log('CREATE UnitMeasurement called with data:', req.data);
    const db = cds.transaction(req);
    try {
      const data = req.data;
      data.ID = cds.utils.uuid();

      // Ensure measurement is linked to parent unit (fix: use unit_unitId)
      if (req.data.unit_unitId) {
        data.unit_unitId = req.data.unit_unitId;
      } else if (req.data.unit) {
        data.unit_unitId = req.data.unit.unitId || req.data.unit.ID;  // Handle deep insert if unit object provided
      }

      return await db.run(INSERT.into(UnitMeasurements).entries(data));
    } catch (error) {
      console.error('Error creating UnitMeasurement:', error);
      req.error(500, 'Error creating UnitMeasurement');
    }
  });

  this.on('UPDATE', UnitMeasurements, async (req) => {
    console.log('UPDATE UnitMeasurement called with:', req.data, 'params:', req.params);

    const { ID } = req.params[0];
    const db = cds.transaction(req);

    try {
      await db.run(
        UPDATE(UnitMeasurements)
          .set(req.data)
          .where({ ID })
      );

      const updated = await db.run(SELECT.one.from(UnitMeasurements).where({ ID }));
      return updated;
    } catch (error) {
      console.error('Error updating UnitMeasurement:', error);
      req.error(500, 'Error updating UnitMeasurement: ' + error.message);
    }
  });

  this.on('DELETE', UnitMeasurements, async (req) => {
    const { ID } = req.params[0];  // Fix: Use req.params, not req.data
    console.log('DELETE UnitMeasurement called for ID:', ID);
    const db = cds.transaction(req);
    try {
      return await db.run(
        DELETE.from(UnitMeasurements).where({ ID })
      );
    } catch (error) {
      console.error('Error deleting UnitMeasurement:', error);
      req.error(500, 'Error deleting UnitMeasurement: ' + error.message);
    }
  });

  /*----------------------- UnitPrices ---------------------------*/

  this.on('READ', UnitPrices, async (req) => {
    console.log('READ UnitPrices called');
    const db = cds.transaction(req);
    return await db.run(req.query);
  });

  this.on('CREATE', UnitPrices, async (req) => {
    console.log('CREATE UnitPrice called with data:', req.data);
    const db = cds.transaction(req);
    try {
      const data = req.data;
      data.ID = cds.utils.uuid();

      // Ensure price is linked to parent unit (fix: use unit_unitId)
      if (req.data.unit_unitId) {
        data.unit_unitId = req.data.unit_unitId;
      } else if (req.data.unit) {
        data.unit_unitId = req.data.unit.unitId || req.data.unit.ID;  // Handle deep insert if unit object provided
      }

      return await db.run(INSERT.into(UnitPrices).entries(data));
    } catch (error) {
      console.error('Error creating UnitPrice:', error);
      req.error(500, 'Error creating UnitPrice');
    }
  });

  this.on('UPDATE', UnitPrices, async (req) => {
    console.log('UPDATE UnitPrice called with:', req.data, 'params:', req.params);

    const { ID } = req.params[0];
    const db = cds.transaction(req);

    try {
      await db.run(
        UPDATE(UnitPrices)
          .set(req.data)
          .where({ ID })
      );

      const updated = await db.run(SELECT.one.from(UnitPrices).where({ ID }));
      return updated;
    } catch (error) {
      console.error('Error updating UnitPrice:', error);
      req.error(500, 'Error updating UnitPrice: ' + error.message);
    }
  });

  this.on('DELETE', UnitPrices, async (req) => {
    const { ID } = req.params[0];  // Fix: Use req.params, not req.data
    console.log('DELETE UnitPrice called for ID:', ID);
    const db = cds.transaction(req);
    try {
      return await db.run(
        DELETE.from(UnitPrices).where({ ID })
      );
    } catch (error) {
      console.error('Error deleting UnitPrice:', error);
      req.error(500, 'Error deleting UnitPrice: ' + error.message);
    }
  });

});
