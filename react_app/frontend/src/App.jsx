import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
	Chart as ChartJS,
	BarElement,
	LineElement,
	PointElement,
	ArcElement,
	CategoryScale,
	LinearScale,
	Tooltip,
	Legend,
} from "chart.js";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl:
		"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
	iconUrl:
		"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
	shadowUrl:
		"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

ChartJS.register(
	BarElement,
	LineElement,
	PointElement,
	ArcElement,
	CategoryScale,
	LinearScale,
	Tooltip,
	Legend
);

function App() {
	const [data, setData] = useState([]);
	const [selectedMonths, setSelectedMonths] = useState([]);
	const [selectedCategories, setSelectedCategories] = useState([]);
	const [defaultFiltersSet, setDefaultFiltersSet] = useState(false);

	useEffect(() => {
		axios
			.get("http://localhost:5000/api/fire-incidents")
			.then((response) => {
				const processed = response.data.map((item) => {
					const date = new Date(item.Date_Time_Of_Event.value);
					return {
						...item,
						Date_Time_Of_Event: date,
						Month: date.getMonth() + 1, // Month as a number (1-12)
					};
				});
				setData(processed);
			})
			.catch((error) => console.error("Error fetching data:", error));
	}, []);

	const uniqueMonths = [...new Set(data.map((item) => item.Month))].sort(
		(a, b) => a - b
	);
	const uniqueCategories = [
		...new Set(data.map((item) => item.Final_Incident_Category)),
	].filter(Boolean);

	useEffect(() => {
		if (data.length && !defaultFiltersSet) {
			setSelectedMonths(uniqueMonths);
			setSelectedCategories(uniqueCategories);
			setDefaultFiltersSet(true);
		}
	}, [data, uniqueMonths, uniqueCategories, defaultFiltersSet]);

	const monthOptions = uniqueMonths.map((m) => ({
		value: m,
		label: new Date(0, m - 1).toLocaleString("default", { month: "long" }),
	}));
	const categoryOptions = uniqueCategories.map((cat) => ({
		value: cat,
		label: cat,
	}));

	const effectiveMonths =
		selectedMonths.length === 0 ? uniqueMonths : selectedMonths;
	const effectiveCategories =
		selectedCategories.length === 0 ? uniqueCategories : selectedCategories;

	const filteredData = data.filter((item) => {
		return (
			effectiveMonths.includes(item.Month) &&
			effectiveCategories.includes(item.Final_Incident_Category)
		);
	});

	const categoryCounts = filteredData.reduce((acc, cur) => {
		const cat = cur.Final_Incident_Category || "Unknown";
		acc[cat] = (acc[cat] || 0) + 1;
		return acc;
	}, {});
	const barChartData = {
		labels: Object.keys(categoryCounts),
		datasets: [
			{
				label: "Incident Count",
				data: Object.values(categoryCounts),
				backgroundColor: "rgba(75,192,192,0.6)",
			},
		],
	};

	const monthlyCounts = filteredData.reduce((acc, cur) => {
		const month = cur.Month;
		acc[month] = (acc[month] || 0) + 1;
		return acc;
	}, {});
	const sortedMonths = Object.keys(monthlyCounts).sort((a, b) => a - b);
	const lineChartData = {
		labels: sortedMonths.map((m) =>
			new Date(0, m - 1).toLocaleString("default", { month: "long" })
		),
		datasets: [
			{
				label: "Incident Count",
				data: sortedMonths.map((m) => monthlyCounts[m]),
				fill: false,
				borderColor: "blue",
			},
		],
	};

	const allMonthCounts = filteredData.reduce((acc, cur) => {
		const month = cur.Month;
		acc[month] = (acc[month] || 0) + 1;
		return acc;
	}, {});
	const pieLabels = [];
	const pieCounts = [];
	for (let m = 1; m <= 12; m++) {
		pieLabels.push(
			new Date(0, m - 1).toLocaleString("default", { month: "long" })
		);
		pieCounts.push(allMonthCounts[m] || 0);
	}
	const pieChartData = {
		labels: pieLabels,
		datasets: [
			{
				data: pieCounts,
				backgroundColor: [
					"#FF6384",
					"#36A2EB",
					"#FFCE56",
					"#4BC0C0",
					"#9966FF",
					"#FF9F40",
					"#66FF66",
					"#FF6666",
					"#66CCFF",
					"#FFCC99",
					"#CCCCFF",
					"#FFCCFF",
				],
			},
		],
	};

	const containerStyle = {
		width: "80%",
		margin: "auto",
		textAlign: "center",
		paddingBottom: "50px",
	};
	const chartContainerStyle = {
		display: "flex",
		flexWrap: "wrap",
		justifyContent: "center",
		gap: "20px",
		marginBottom: "40px",
	};
	const chartStyle = { width: "400px", height: "300px" };

	return (
		<div style={containerStyle}>
			<h1>San Jose Fire Incidents Dashboard</h1>

			{/* Filters */}
			<div style={{ marginBottom: "20px" }}>
				<label style={{ marginRight: "10px" }}>Filter by Month:</label>
				<Select
					isMulti
					options={monthOptions}
					value={monthOptions.filter((opt) =>
						selectedMonths.includes(opt.value)
					)}
					onChange={(selectedOptions) =>
						setSelectedMonths(
							selectedOptions
								? selectedOptions.map((opt) => opt.value)
								: []
						)
					}
					placeholder="Select Month(s)"
				/>
			</div>
			<div style={{ marginBottom: "20px" }}>
				<label style={{ marginRight: "10px" }}>
					Filter by Category:
				</label>
				<Select
					isMulti
					options={categoryOptions}
					value={categoryOptions.filter((opt) =>
						selectedCategories.includes(opt.value)
					)}
					onChange={(selectedOptions) =>
						setSelectedCategories(
							selectedOptions
								? selectedOptions.map((opt) => opt.value)
								: []
						)
					}
					placeholder="Select Category(s)"
				/>
			</div>

			{/* Charts */}
			<div style={chartContainerStyle}>
				<div style={chartStyle}>
					<h2>Bar Chart: Incidents by Category</h2>
					<Bar
						data={barChartData}
						options={{ maintainAspectRatio: false }}
					/>
				</div>
				<div style={chartStyle}>
					<h2>Line Chart: Incidents Over Time</h2>
					<Line
						data={lineChartData}
						options={{ maintainAspectRatio: false }}
					/>
				</div>
				<div style={chartStyle}>
					<h2>Pie Chart: Incident Distribution by Month</h2>
					<Pie
						data={pieChartData}
						options={{ maintainAspectRatio: false }}
					/>
				</div>
			</div>
		</div>
	);
}

export default App;
