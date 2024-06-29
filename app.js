const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path")
const dbPath = path.join(__dirname, "covid19India.db");

app.use(express.json());

let db = null;

const initializeDBAndServer = async (request, response) => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });

        app.listen(3000, () => {
            console.log("Server Running at http://localhost:3000/");
        });

    } catch(e) {
        console.log(`DB Error: ${e.message}`);
        process.exit(1);
    }
};

initializeDBAndServer();

module.exports = app;

//API 1 - GET Retrieving All States 
app.get("/states/", async (request, response) => {
    
    const getStatesQuery = `
        SELECT
            *
        FROM
            state
        ORDER BY
            state_id;`;

    const convertDBObjectToResponseObject = (dbObject) => {
        return {
            stateId: dbObject.state_id,
            stateName: dbObject.state_name,
            population: dbObject.population
        };
    };

    const getStatesArray = await db.all(getStatesQuery);
    response.send(getStatesArray.map((eachState) =>
        convertDBObjectToResponseObject(eachState)
    )
    );
});

//API 2 - GET Retrieve State Details using state_id
app.get("/states/:stateId/", async (request, response) => {
    const { stateId } = request.params;

    const getAStateQuery = `
            SELECT 
                *
            FROM 
                state
            WHERE 
                state_id = ${stateId};`;

    const convertDBObjectToResponseObject = (dbObject) => {
        return {
            stateId: dbObject.state_id,
            stateName: dbObject.state_name,
            population: dbObject.population,
            };
        };

    const dbResponse = await db.get(getAStateQuery);

    response.send(convertDBObjectToResponseObject(dbResponse));
});

//API 3 - POST Creating A District in district table
app.post("/districts/", async (request, response) => {
    const districtDetails = request.body;

    const { districtName, stateId, cases, cured, active, deaths } = districtDetails;

    const createADistrictQuery = `
            INSERT INTO 
                district (district_name, state_id, cases, cured, active, deaths)
            VALUES 
                (
                '${districtName}',
                    ${stateId},
                    ${cases},
                    ${cured},
                    ${active},
                    ${deaths}
                );`;

    const addDistrict = await db.run(createADistrictQuery);
    response.send("District Successfully Added");

});

//API 4 - GET Retrieve A District using district_id
app.get("/districts/:districtId/", async (request, response) => {
    const { districtId } = request.params;

    const getADistrictQuery = `
            SELECT 
                *
            FROM 
                district
            WHERE 
                district_id = ${districtId};`;

    const convertDBObjectToResponseObject = (dbObject) => {
        return {
            districtId: dbObject.district_id,
            districtName: dbObject.district_name,
            stateId: dbObject.state_id,
            cases: dbObject.cases,
            cured: dbObject.cured,
            active: dbObject.active,
            deaths: dbObject.deaths,
        };
    };

    const dbResponse = await db.get(getADistrictQuery);
    response.send(convertDBObjectToResponseObject(dbResponse));
});

//API 5 - DELETE Deleting District using district_id
app.delete("/districts/:districtId/", async (request, response) => {
    const { districtId } = request.params;

    const deleteADistrictQuery = `
        DELETE FROM
            district
        WHERE 
            district_id = ${districtId};`;
    
    await db.run(deleteADistrictQuery);
    response.send("District Removed");
});

//API 6 - PUT Updating District using district_id
app.put("/districts/:districtId/", async (request, response) => {
    const { districtId } = request.params;
    const districtDetails = request.body;

    const { districtName, stateId, cases, cured, active, deaths } = districtDetails;

    const updateDistrictDetailsQuery = `
        UPDATE
            district
        SET
            district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
        WHERE
            district_id = ${districtId};`;
    
    await db.run(updateDistrictDetailsQuery);
    response.send("District Details Updated");
});

//API 7 - GET Retrieve the Statistics of Situation using state_id
app.get("/states/:stateId/stats/", async (request, response) => {
    const { stateId } = request.params;

    const getStatisticsQuery = `
        SELECT
            SUM(cases) AS total_cases,
            SUM(cured) AS total_cured,
            SUM(active) AS total_active,
            SUM(deaths) AS total_deaths
        FROM
            district
        WHERE
            state_id = ${stateId};`;

    const convertDBObjectToResponseObject = (dbObject) => {
        return {
            totalCases: dbObject.total_cases,
            totalCured: dbObject.total_cured,
            totalActive: dbObject.total_active,
            totalDeaths: dbObject.total_deaths
        };
    };

    const dbResponse = await db.get(getStatisticsQuery);
    response.send( convertDBObjectToResponseObject(dbResponse) );
});

//API 8 - GET Retrieving an State Name using district_id
app.get("/districts/:districtId/details/", async (request, response) => {

    const { districtId } = request.params;

    let getStateIdQuery = `
        SELECT 
            state_id
        FROM 
            district
        WHERE 
            district_id = ${districtId};`;

    const stateId = await db.get(getStateIdQuery);

    let getStateNameQuery = `
        SELECT 
            state_name AS stateName
        FROM 
            state
        WHERE 
            state_id = ${stateId.state_id};`;
    
    const dbResponse = await db.get(getStateNameQuery);
    response.send(dbResponse);
    
});