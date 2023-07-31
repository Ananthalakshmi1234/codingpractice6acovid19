const express = require("express");
const path = require("path");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const objectSnakeToCamel = (newObject) => {
  return {
    stateId: newObject.state_id,
    stateName: newObject.state_name,
    population: newObject.population,
  };
};
const districtSnakeToCamel = (newObject) => {
  return {
    districtId: newObject.district_id,
    districtName: newObject.district_Name,
    stateId: newObject.state_id,
    cases: newObject.cases,
    cured: newObject.cured,
    active: newObject.active,
    deaths: newObject.deaths,
  };
};

const initailizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("server is running");
    });
  } catch (e) {
    console.log("Error ${e.message}");
    process.exit(1);
  }
};
initailizeDBAndServer();

//1.Get request

app.get("/states/", async (request, response) => {
  const getStates = `select * from state order by state_id;`;
  const states = await db.all(getStates);
  response.send(states.map((each) => objectSnakeToCamel(each)));
});

//2.Getting the state based on the stateId

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getParticularState = `
    select * from state where state_id=${stateId};`;
  const state = await db.get(getParticularState);
  response.send(objectSnakeToCamel(state));
});

module.exports = app;

//3.inserting a district into district table

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const newDistrictQuery = `
    insert into district(district_name,state_id,cases,cured,active,deaths)
    values("${districtName}",${stateId},${cases},${cured},${active},${deaths});`;
  await db.run(newDistrictQuery);
  response.send("District Successfully Added");
});

//4.Getting the district based on the district Id
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    select * from district where district_id=${districtId};`;
  const getDistrict = await db.get(getDistrictQuery);
  response.send(districtSnakeToCamel(getDistrict));
});

//5.Delete a specific district with the help of district Id
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    delete from district where district_id=${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//6.Updates the details of a specific district based on the district ID
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateQuery = `
    update district set district_name="${districtName}",state_id=${stateId},cases=${cases},cured=${cured},active=${active},deaths=${deaths};`;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

//7.getting the sum

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getDistrictStateQuery = `
  select 
  sum(cases) as totalCases,
  sum(cured) as totalCured,
  sum(active) as totalActive,
  sum(deaths) as totalDeaths
  from
  district where state_id=${stateId};`;
  response.send(await db.get(getDistrictStateQuery));
});
//8.
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
    select state_id from district
    where district_id = ${districtId};
    `; //With this we will get the state_id using district table
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};
    `; //With this we will get state_name as stateName using the state_id
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
}); //sending the required response
