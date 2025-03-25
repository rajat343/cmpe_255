const express = require("express");
const { BigQuery } = require("@google-cloud/bigquery");
const cors = require("cors");

const app = express();
app.use(cors());

const bigquery = new BigQuery({
	projectId: "cmpe-sjsu",
	keyFilename:
		"/Users/rajatmishra/Desktop/cmpe_255/react_app/backend/cmpe-sjsu-credentials.json",
});

app.get("/api/fire-incidents", async (req, res) => {
	const query = `
    SELECT Incident_No, Date_Time_Of_Event, Final_Incident_Type, Final_Incident_Category, Street_Name
    FROM \`cmpe-sjsu.cmpe_sjsu_dataset.cmpe_sjsu_table\`
  `;
	try {
		const [rows] = await bigquery.query(query);
		res.json(rows);
	} catch (error) {
		console.error("BigQuery Error:", error);
		res.status(500).send("Error fetching data from BigQuery");
	}
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Backend server is running on port ${PORT}`);
});
