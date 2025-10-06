const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

  const { Projects, Units, Buildings } = this.entities;
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
    console.log('UPDATE Buildings called with data:', req.data);
    const db = cds.transaction(req);
    return await db.run(
      UPDATE(Buildings)
        .set(req.data)
        .where({ ID: req.data.ID })
    );
  });

  // DELETE
  this.on('DELETE', Buildings, async (req) => {
    console.log('DELETE Buildings called for ID:', req.data.ID);
    const db = cds.transaction(req);
    try {

      return await db.run(
        DELETE.from(Buildings).where({ ID: req.data.ID })
      );
    }
    catch (error) {
      console.error('Error deleting Buildings:', error);
      req.error(500, 'Error deleting Buildings');
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


  ///////////////////////////// UNIT //////////////////////////////////////

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
    console.log('UPDATE Unit called with data:', req.data);
    const db = cds.transaction(req);
    try {
      return await db.run(
        UPDATE(Units)
          .set(req.data)
          .where({ ID: req.data.ID }) // cuid field
      );
    } catch (error) {
      console.error('Error updating Unit:', error);
      req.error(500, 'Error updating Unit');
    }
  });

  // DELETE
  this.on('DELETE', Units, async (req) => {
    console.log('DELETE Unit called for ID:', req.data.ID);
    const db = cds.transaction(req);
    try {
      return await db.run(
        DELETE.from(Units).where({ ID: req.data.ID })
      );
    } catch (error) {
      console.error('Error deleting Unit:', error);
      req.error(500, 'Error deleting Unit');
    }
  });

});
