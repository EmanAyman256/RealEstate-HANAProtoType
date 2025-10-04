const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

  const { Projects } = this.entities;

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
    return await db.run(
      INSERT.into(Projects).entries(req.data)
    );
  });

  // UPDATE
  this.on('UPDATE', Projects, async (req) => {
    console.log('UPDATE Project called with data:', req.data);
    const db = cds.transaction(req);
    return await db.run(
      UPDATE(Projects)
        .set(req.data)
        .where({ ID: req.data.ID })   // cuid field
    );
  });

  // DELETE
  this.on('DELETE', Projects, async (req) => {
    console.log('DELETE Project called for ID:', req.data.ID);
    const db = cds.transaction(req);
    return await db.run(
      DELETE.from(Projects).where({ ID: req.data.ID })
    );
  });

});
