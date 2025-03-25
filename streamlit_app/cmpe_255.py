import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import calendar
from google.cloud import bigquery

@st.cache_data
def load_data():
    projectId = "cmpe-sjsu"
    client = bigquery.Client(project=projectId)
    datasetId = "cmpe_sjsu_dataset"
    tableId = "cmpe_sjsu_table"
    query = f"""
    SELECT Incident_No, Date_Time_Of_Event, Final_Incident_Type, Final_Incident_Category, Street_Name
    FROM `{projectId}.{datasetId}.{tableId}`
    """
    df = client.query(query).to_dataframe()
    df["Date_Time_Of_Event"] = pd.to_datetime(df["Date_Time_Of_Event"], errors='coerce')
    df["Year"] = df["Date_Time_Of_Event"].dt.year
    df["Month"] = df["Date_Time_Of_Event"].dt.month
    return df

df = load_data()

st.title("San Jose Fire Incidents Dashboard")

monthsNames = sorted(df["Month"].dropna().unique())
monthMapping = {m: calendar.month_name[m] for m in monthsNames}

defaultMonths = [monthMapping[m] for m in monthsNames]
selectedMonthNames = st.multiselect(
    "Select Month(s) for Chart Analysis",
    options=[monthMapping[m] for m in monthsNames],
    default=defaultMonths
)
selectedMonths = [m for m, name in monthMapping.items() if name in selectedMonthNames]

uniqueCat = sorted(df["Final_Incident_Category"].dropna().unique())
selectedCategories = st.multiselect(
    "Select Incident Category(ies) for Chart Analysis",
    options=uniqueCat,
    default=uniqueCat
)

filteredData = df.copy()
if selectedMonths:
    filteredData = filteredData[filteredData["Month"].isin(selectedMonths)]
if selectedCategories:
    filteredData = filteredData[filteredData["Final_Incident_Category"].isin(selectedCategories)]

st.markdown("---")

col1, col2, col3 = st.columns(3)

with col1:
    st.subheader("Bar Chart: Incidents by Category")
    catCounts = filteredData["Final_Incident_Category"].value_counts()
    st.bar_chart(catCounts)

with col2:
    st.subheader("Line Chart: Incidents Over Time")
    dataFrameMonthly = filteredData.groupby("Month").size().reset_index(name="Incident Count")
    dataFrameMonthly["Month_Name"] = pd.Categorical(
        dataFrameMonthly["Month"].apply(lambda m: calendar.month_name[m]),
        categories=[calendar.month_name[m] for m in range(1, 13)],
        ordered=True
    )
    dataFrameMonthly = dataFrameMonthly.sort_values("Month_Name").set_index("Month_Name")
    st.line_chart(dataFrameMonthly["Incident Count"])

with col3:
    st.subheader("Pie Chart: Incident Distribution by Month")
    dataFrameMonthlyCounts = filteredData["Month"].value_counts().sort_index()
    monthNames = [calendar.month_name[m] for m in dataFrameMonthlyCounts.index]
    fig, ax = plt.subplots(figsize=(4, 4))
    ax.pie(
        dataFrameMonthlyCounts, 
        labels=monthNames, 
        autopct='%1.1f%%', 
        colors=sns.color_palette("Set3", 12),
        startangle=90
    )
    ax.set_title("Incident Distribution")
    st.pyplot(fig)
