const cds = require('@sap/cds');
const { ref } = cds.ql;  // <-- add this line

module.exports = cds.service.impl(async function () {

  const
    {
      Projects,
      Units,
      Buildings,
      PaymentPlans,
      PaymentPlanSchedules,
      PaymentPlanProjects,
      Measurements,
      Conditions,
      EOI,
      PaymentDetails,
      Reservations
    } = this.entities;


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
      // Insert main unit
      const result = await db.run(INSERT.into(Units).entries(req.data));

      // Fetch the full record with associations (so UI sees it instantly)
      const createdUnit = await db.run(
        SELECT.one.from(Units)
          .where({ unitId: req.data.unitId })
          .columns(
            '*', { from: 'measurements', expand: ['*'] }, { from: 'prices', expand: ['*'] }
          )
      );

      console.log('Created Unit returned to UI:', createdUnit);
      return createdUnit;
    } catch (error) {
      console.error('Error creating Unit:', error);
      req.error(500, 'Error creating Unit: ' + error.message);
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

  /*----------------------- Measurements ---------------------------*/

  // READ
  this.on('READ', Measurements, async (req) => {
    console.log('READ Measurements called');
    const db = cds.transaction(req);
    return await db.run(req.query);
  });

  // CREATE
  this.on('CREATE', Measurements, async (req) => {
    console.log('CREATE Measurement called with data:', req.data);
    const db = cds.transaction(req);
    try {
      const data = req.data;
      data.ID = cds.utils.uuid(); // ensure unique ID

      // handle association to Unit (if frontend passes nested or flat)
      if (req.data.unit_unitId) {
        data.unit_unitId = req.data.unit_unitId;
      } else if (req.data.unit) {
        data.unit_unitId = req.data.unit.unitId || req.data.unit.ID;
      }

      return await db.run(INSERT.into(Measurements).entries(data));
    } catch (error) {
      console.error('Error creating Measurement:', error);
      req.error(500, 'Error creating Measurement');
    }
  });

  // UPDATE
  this.on('UPDATE', Measurements, async (req) => {
    console.log('UPDATE Measurement called with:', req.data, 'params:', req.params);

    const { ID } = req.params[0];
    const db = cds.transaction(req);

    try {
      await db.run(UPDATE(Measurements).set(req.data).where({ ID }));
      const updated = await db.run(SELECT.one.from(Measurements).where({ ID }));
      return updated;
    } catch (error) {
      console.error('Error updating Measurement:', error);
      req.error(500, 'Error updating Measurement: ' + error.message);
    }
  });

  // DELETE
  this.on('DELETE', Measurements, async (req) => {
    console.log('DELETE Measurement called for ID:', req.data.ID);
    const db = cds.transaction(req);
    try {
      return await db.run(DELETE.from(Measurements).where({ ID: req.data.ID }));
    } catch (error) {
      console.error('Error deleting Measurement:', error);
      req.error(500, 'Error deleting Measurement: ' + error.message);
    }
  });


  /*----------------------- Conditions ---------------------------*/

  // READ
  this.on('READ', Conditions, async (req) => {
    console.log('READ Conditions called');
    const db = cds.transaction(req);
    return await db.run(req.query);
  });

  // CREATE
  this.on('CREATE', Conditions, async (req) => {
    console.log('CREATE Condition called with data:', req.data);
    const db = cds.transaction(req);
    try {
      const data = req.data;
      data.ID = cds.utils.uuid(); // ensure unique ID

      // handle association to Unit (if frontend passes nested or flat)
      if (req.data.unit_unitId) {
        data.unit_unitId = req.data.unit_unitId;
      } else if (req.data.unit) {
        data.unit_unitId = req.data.unit.unitId || req.data.unit.ID;
      }

      return await db.run(INSERT.into(Conditions).entries(data));
    } catch (error) {
      console.error('Error creating Condition:', error);
      req.error(500, 'Error creating Condition');
    }
  });

  // UPDATE
  this.on('UPDATE', Conditions, async (req) => {
    console.log('UPDATE Condition called with:', req.data, 'params:', req.params);

    const { ID } = req.params[0];
    const db = cds.transaction(req);

    try {
      await db.run(UPDATE(Conditions).set(req.data).where({ ID }));
      const updated = await db.run(SELECT.one.from(Conditions).where({ ID }));
      return updated;
    } catch (error) {
      console.error('Error updating Condition:', error);
      req.error(500, 'Error updating Condition: ' + error.message);
    }
  });

  // DELETE
  this.on('DELETE', Conditions, async (req) => {
    console.log('DELETE Condition called for ID:', req.data.ID);
    const db = cds.transaction(req);
    try {
      return await db.run(DELETE.from(Conditions).where({ ID: req.data.ID }));
    } catch (error) {
      console.error('Error deleting Condition:', error);
      req.error(500, 'Error deleting Condition: ' + error.message);
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

  /*----------------------- EOI ---------------------------*/

  // READ
  this.on('READ', EOI, async (req) => {
    console.log('READ EOI called');
    const db = cds.transaction(req);
    return await db.run(req.query);
  });

  // CREATE
  this.on('CREATE', EOI, async (req) => {
    console.log('CREATE EOI called with data:', req.data);
    const db = cds.transaction(req);

    try {
      // Insert main EOI
      const result = await db.run(INSERT.into(EOI).entries(req.data));

      // Fetch full record with associations for UI
      const createdEOI = await db.run(
        SELECT.one.from(EOI)
          .where({ eoiId: req.data.eoiId })
          .columns('*', { from: 'paymentDetails', expand: ['*'] })
      );

      console.log('Created EOI returned to UI:', createdEOI);
      return createdEOI;
    } catch (error) {
      console.error('Error creating EOI:', error);
      req.error(500, 'Error creating EOI: ' + error.message);
    }
  });

  // UPDATE
  this.on('UPDATE', EOI, async (req) => {
    console.log('UPDATE EOI called with:', req.data, 'params:', req.params);

    const { eoiId } = req.params[0];
    const db = cds.transaction(req);

    try {
      await db.run(UPDATE(EOI).set(req.data).where({ eoiId }));
      const updated = await db.run(SELECT.one.from(EOI).where({ eoiId }));
      return updated;
    } catch (error) {
      console.error('Error updating EOI:', error);
      req.error(500, 'Error updating EOI: ' + error.message);
    }
  });

  // DELETE
  this.on('DELETE', EOI, async (req) => {
    console.log('DELETE EOI called for eoiId:', req.data.eoiId);
    const db = cds.transaction(req);
    try {
      return await db.run(DELETE.from(EOI).where({ eoiId: req.data.eoiId }));
    } catch (error) {
      console.error('Error deleting EOI:', error);
      req.error(500, 'Error deleting EOI: ' + error.message);
    }
  });


  /*----------------------- PaymentDetails ---------------------------*/

  // READ
  this.on('READ', PaymentDetails, async (req) => {
    console.log('READ PaymentDetails called');
    const db = cds.transaction(req);
    return await db.run(req.query);
  });

  // CREATE
  this.on('CREATE', PaymentDetails, async (req) => {
    console.log('CREATE PaymentDetails called with data:', req.data);
    const db = cds.transaction(req);

    try {
      const data = req.data;
      data.ID = cds.utils.uuid(); // ensure unique ID

      // handle association to EOI (nested or flat)
      if (req.data.eoi_eoiId) {
        data.eoi_eoiId = req.data.eoi_eoiId;
      } else if (req.data.eoi) {
        data.eoi_eoiId = req.data.eoi.eoiId || req.data.eoi.ID;
      }

      return await db.run(INSERT.into(PaymentDetails).entries(data));
    } catch (error) {
      console.error('Error creating PaymentDetails:', error);
      req.error(500, 'Error creating PaymentDetails');
    }
  });

  // UPDATE
  this.on('UPDATE', PaymentDetails, async (req) => {
    console.log('UPDATE PaymentDetails called with:', req.data, 'params:', req.params);

    const { ID } = req.params[0];
    const db = cds.transaction(req);

    try {
      await db.run(UPDATE(PaymentDetails).set(req.data).where({ ID }));
      const updated = await db.run(SELECT.one.from(PaymentDetails).where({ ID }));
      return updated;
    } catch (error) {
      console.error('Error updating PaymentDetails:', error);
      req.error(500, 'Error updating PaymentDetails: ' + error.message);
    }
  });

  // DELETE
  this.on('DELETE', PaymentDetails, async (req) => {
    console.log('DELETE PaymentDetails called for ID:', req.data.ID);
    const db = cds.transaction(req);
    try {
      return await db.run(DELETE.from(PaymentDetails).where({ ID: req.data.ID }));
    } catch (error) {
      console.error('Error deleting PaymentDetails:', error);
      req.error(500, 'Error deleting PaymentDetails: ' + error.message);
    }
  });
  /*----------------------- Reservations ---------------------------*/

  // READ
  this.on('READ', Reservations, async (req) => {
    console.log('READ Reservations called');
    const db = cds.transaction(req);
    return await db.run(req.query);
  });

  // CREATE (header + compositions)
  this.on('CREATE', Reservations, async (req) => {
    console.log('CREATE Reservation called:', req.data);
    const db = cds.transaction(req);

    try {
      // Insert main reservation
      const reservationData = { ...req.data };
      const { partners, conditions, payments } = reservationData;
      delete reservationData.partners;
      delete reservationData.conditions;
      delete reservationData.payments;

      await db.run(INSERT.into(Reservations).entries(reservationData));

      // Insert compositions (if any)
      if (partners?.length) {
        for (const p of partners) {
          p.reservation_reservationId = reservationData.reservationId;
          await db.run(INSERT.into(ReservationPartners).entries(p));
        }
      }

      if (conditions?.length) {
        for (const c of conditions) {
          c.reservation_reservationId = reservationData.reservationId;
          await db.run(INSERT.into(ReservationConditions).entries(c));
        }
      }

      if (payments?.length) {
        for (const pay of payments) {
          pay.reservation_reservationId = reservationData.reservationId;
          await db.run(INSERT.into(ReservationPaymentDetails).entries(pay));
        }
      }

      return reservationData;

    } catch (error) {
      console.error('Error creating Reservation:', error);
      req.error(500, 'Error creating Reservation: ' + error.message);
    }
  });

  // UPDATE
  this.on('UPDATE', Reservations, async (req) => {
    console.log("UPDATE Reservation called:", req.data);
    const { reservationId } = req.params[0];
    const db = cds.transaction(req);

    try {
      await db.run(UPDATE(Reservations).set(req.data).where({ reservationId }));
      return await db.run(SELECT.one.from(Reservations).where({ reservationId }));
    } catch (error) {
      console.error("Error updating Reservation:", error);
      req.error(500, "Error updating Reservation: " + error.message);
    }
  });

  // DELETE
  this.on('DELETE', Reservations, async (req) => {
    console.log('DELETE Reservation called for:', req.data.reservationId);
    const db = cds.transaction(req);

    try {
      const { reservationId } = req.data;

      await db.run(DELETE.from(ReservationPartners).where({ reservation_reservationId: reservationId }));
      await db.run(DELETE.from(ReservationConditions).where({ reservation_reservationId: reservationId }));
      await db.run(DELETE.from(ReservationPaymentDetails).where({ reservation_reservationId: reservationId }));

      return await db.run(DELETE.from(Reservations).where({ reservationId }));

    } catch (error) {
      console.error('Error deleting Reservation:', error);
      req.error(500, 'Error deleting Reservation: ' + error.message);
    }
  });

});
