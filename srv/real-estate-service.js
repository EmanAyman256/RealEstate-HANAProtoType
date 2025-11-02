const cds = require('@sap/cds');
const { ref } = cds.ql;
const { v4: uuidv4 } = require('uuid');

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
      Reservations,
      ReservationPartners,
      ReservationConditions,
      ReservationPayments,
      ReservationPaymentDetails
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
  this.on('READ', PaymentPlans, async (req, next) => {
    console.log('READ PaymentPlans called with expand:', req.query.$expand);

    try {
      // Just let CAP handle expansions automatically
      const result = await next();

      // Optional: if you want to log
      if (Array.isArray(result)) {
        console.log(`Returned ${result.length} payment plans`);
      }

      return result;
    } catch (error) {
      console.error('Error reading PaymentPlans:', error);
      req.error(500, 'Error reading PaymentPlans: ' + error.message);
    }
  });


  this.on('CREATE', PaymentPlans, async (req) => {
    console.log('CREATE PaymentPlan called with data:', req.data);
    const db = cds.transaction(req);

    try {
      const { schedule, assignedProjects, ...planData } = req.data;

      // Insert main payment plan
      const result = await db.run(INSERT.into(PaymentPlans).entries(planData));
      const paymentPlanId = planData.paymentPlanId;

      // Insert schedule items
      if (Array.isArray(schedule)) {
        for (const s of schedule) {
          await db.run(
            INSERT.into(PaymentPlanSchedules).entries({
              ...s,
              paymentPlan_paymentPlanId: paymentPlanId // or paymentPlan_ID
            })
          );
        }
      }

      // Insert assigned projects
      if (Array.isArray(assignedProjects)) {
        for (const p of assignedProjects) {
          await db.run(
            INSERT.into(PaymentPlanProjects).entries({
              ...p,
              paymentPlan_paymentPlanId: paymentPlanId // or paymentPlan_ID
            })
          );
        }
      }

      await db.commit();
      return result;

    } catch (error) {
      console.error('Error creating PaymentPlan:', error);
      await db.rollback();
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
      await db.run(INSERT.into(EOI).entries(req.data));

      const createdEOI = await db.run(
        SELECT.one.from(EOI)
          .where({ eoiId: req.data.eoiId })
          .columns('*', { ref: ['paymentDetails'], expand: ['*'] })
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

      const updated = await db.run(
        SELECT.one.from(EOI)
          .where({ eoiId })
          .columns('*', { ref: ['paymentDetails'], expand: ['*'] })
      );

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

  // 🔹 Helper: validate references
  async function validateReferences(req, db) {
    const data = req.data;
    const errors = [];

    // Check Project reference
    if (data.project_projectId) {
      const exists = await db.run(
        SELECT.one.from(Projects).where({ projectId: data.project_projectId })
      );
      if (!exists) errors.push(`Project ID '${data.project_projectId}' does not exist.`);
    }

    // Check Building reference
    if (data.building_buildingId) {
      const exists = await db.run(
        SELECT.one.from(Buildings).where({ buildingId: data.building_buildingId })
      );
      if (!exists) errors.push(`Building ID '${data.building_buildingId}' does not exist.`);
    }

    // Check Unit reference
    if (data.unit_unitId) {
      const exists = await db.run(
        SELECT.one.from(Units).where({ unitId: data.unit_unitId })
      );
      if (!exists) errors.push(`Unit ID '${data.unit_unitId}' does not exist.`);
    }

    // Check Payment Plan reference
    if (data.paymentPlan_paymentPlanId) {
      const exists = await db.run(
        SELECT.one.from(PaymentPlans).where({ paymentPlanId: data.paymentPlan_paymentPlanId })
      );
      if (!exists)
        errors.push(`Payment Plan ID '${data.paymentPlan_paymentPlanId}' does not exist.`);
    }

    // Throw combined error if any references are invalid
    if (errors.length > 0) {
      req.error({
        code: "REFERENCE_NOT_FOUND",
        message: errors.join("\n"),
        target: "Reservations"
      });
    }
  }

/** ----------------------------------------------------------------
   *  READ Reservations
   * ---------------------------------------------------------------- */
  this.on("READ", Reservations, async (req) => {
    console.log("READ Reservations called");
    const db = cds.transaction(req);
    return await db.run(req.query);
  });

 // 🔹 Reference Validation Function
  async function validateReferencesForReservations(req, db) {
    const {
      project_projectId,
      building_buildingId,
      unit_unitId,
      paymentPlan_paymentPlanId
    } = req.data;

    const exists = async (entity, key, value) => {
      if (!value) return true;
      const result = await db.run(SELECT.one.from(entity).where({ [key]: value }));
      return !!result;
    };

    if (project_projectId && !(await exists("Projects", "projectId", project_projectId))) {
      req.error(400, `Project ID '${project_projectId}' not found`);
    }
    if (building_buildingId && !(await exists("Buildings", "buildingId", building_buildingId))) {
      req.error(400, `Building ID '${building_buildingId}' not found`);
    }
    if (unit_unitId && !(await exists("Units", "unitId", unit_unitId))) {
      req.error(400, `Unit ID '${unit_unitId}' not found`);
    }
    if (paymentPlan_paymentPlanId && !(await exists("PaymentPlans", "paymentPlanId", paymentPlan_paymentPlanId))) {
      req.error(400, `Payment Plan ID '${paymentPlan_paymentPlanId}' not found`);
    }

    return true;
  }

  // 🔹 CREATE Reservation
  this.on("CREATE", Reservations, async (req) => {
    const db = cds.transaction(req);
    const reservationData = { ...req.data };

    // Auto-generate UUID if not provided
    reservationData.reservationId = reservationData.reservationId || uuidv4();

    // Extract child collections
    const { partners, conditions, payments } = reservationData;
    delete reservationData.partners;
    delete reservationData.conditions;
    delete reservationData.payments;

    try {
      // ✅ Validate foreign key references before inserting
      await validateReferencesForReservations(req, db);

      console.log("🔹 Creating reservation:", reservationData);

      // Insert main reservation
      await db.run(INSERT.into(Reservations).entries(reservationData));

      // Insert partners
      if (partners?.length) {
        await Promise.all(
          partners.map((p) =>
            db.run(
              INSERT.into(ReservationPartners).entries({
                ...p,
                reservation_ID: reservationData.reservationId,
              })
            )
          )
        );
      }

      // Insert conditions
      if (conditions?.length) {
        await Promise.all(
          conditions.map((c) =>
            db.run(
              INSERT.into(ReservationConditions).entries({
                ...c,
                reservation_ID: reservationData.reservationId,
              })
            )
          )
        );
      }

      // Insert payments
      if (payments?.length) {
        await Promise.all(
          payments.map((pay) =>
            db.run(
              INSERT.into(ReservationPayments).entries({
                ...pay,
                reservation_ID: reservationData.reservationId,
              })
            )
          )
        );
      }

      console.log("✅ Reservation created successfully:", reservationData.reservationId);
      return reservationData;

    } catch (error) {
      console.error("❌ Error creating Reservation:", error);
      req.error(500, "Error creating Reservation: " + error.message);
    }
  });



  /** ----------------------------------------------------------------
   *  UPDATE Reservation
   * ---------------------------------------------------------------- */
  this.on("UPDATE", Reservations, async (req) => {
    console.log("UPDATE Reservation called:", req.data);
    const { reservationId } = req.params[0];
    const db = cds.transaction(req);

    try {
      await validateReferencesForReservations(req, db);

      await db.run(UPDATE(Reservations).set(req.data).where({ reservationId }));
      const updated = await db.run(SELECT.one.from(Reservations).where({ reservationId }));
      await db.commit();
      console.log("✅ Reservation updated:", reservationId);
      return updated;

    } catch (error) {
      await db.rollback();
      console.error("❌ Error updating Reservation:", error);
      req.error(500, "Error updating Reservation: " + error.message);
    }
  });

  /** ----------------------------------------------------------------
   *  DELETE Reservation
   * ---------------------------------------------------------------- */
  this.on("DELETE", Reservations, async (req) => {
    console.log("DELETE Reservation called for:", req.data.reservationId);
    const db = cds.transaction(req);

    try {
      const { reservationId } = req.data;
      await db.run(DELETE.from(Reservations).where({ reservationId }));
      await db.commit();
      console.log("🗑️ Reservation deleted:", reservationId);
      return { message: `Reservation ${reservationId} deleted.` };
    } catch (error) {
      await db.rollback();
      console.error("❌ Error deleting Reservation:", error);
      req.error(500, "Error deleting Reservation: " + error.message);
    }
  });

  /** ----------------------------------------------------------------
   *  HELPER: Reference Validation
   * ---------------------------------------------------------------- */
  // async function validateReferencesForReservations(req, db) {
  //   const {
  //     project_projectId,
  //     building_buildingId,
  //     unit_unitId,
  //     paymentPlan_paymentPlanId
  //   } = req.data;

  //   // Helper to check if reference exists
  //   const exists = async (entity, key, value) => {
  //     if (!value) return true; // Skip empty reference
  //     const result = await db.run(SELECT.one.from(entity).where({ [key]: value }));
  //     return !!result;
  //   };

  //   // 🔸 Validate Project
  //   if (project_projectId && !(await exists("Projects", "projectId", project_projectId))) {
  //     req.error(400, `Project ID '${project_projectId}' not found`);
  //   }

  //   // 🔸 Validate Building
  //   if (building_buildingId && !(await exists("Buildings", "buildingId", building_buildingId))) {
  //     req.error(400, `Building ID '${building_buildingId}' not found`);
  //   }

  //   // 🔸 Validate Unit
  //   if (unit_unitId && !(await exists("Units", "unitId", unit_unitId))) {
  //     req.error(400, `Unit ID '${unit_unitId}' not found`);
  //   }

  //   // 🔸 Validate Payment Plan
  //   if (paymentPlan_paymentPlanId && !(await exists("PaymentPlans", "paymentPlanId", paymentPlan_paymentPlanId))) {
  //     req.error(400, `Payment Plan ID '${paymentPlan_paymentPlanId}' not found`);
  //   }

  //   return true;
  // }
});
