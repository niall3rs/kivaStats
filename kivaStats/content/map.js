var clientMap = (function() {
    google.load('visualization', '1', {'packages': ['geochart']});

	 
// common global variables
var popMax = 1500000000,
    gdpMax = 16500000000000,
    perCapMax = 100000,
    billions = 1000000000,
    millions = 1000000;

// buttons click events 
$(function(){
	$("#GDPMapBttn").on("click", function() {
		fetchGDP();
	});
});

$(function(){
	$("#PopulationMapBttn").on("click", function() {
		fetchPopulation();
	});
});

$(function(){
	$("#CapitaMapBttn").on("click", function() {
		fetchCapital();
	});
});

$(function(){
	$("#newestLoadBttn").on("click", function() {
		fetchNewestNumber();
	});
});

$(function(){
	$("#totalNewLoadBttn").on("click", function() {
		fetchNewestTotal();
	});
});
	
google.load('visualization', '1', { packages: ['Geochart', 'table'] });

// fetch function: functions that will call the server to fetch information 

// gathers information to showcase World Bank's GDP for all countries
function fetchGDP()
 {
	var data = 
	{
		startYear: "2012",
		endYear: ""
	};
	
	$.ajax({
		url:"/retrieveGlobalGDP",
		type:"GET",
		data : data,
		success: function(responseGDP){
			$.ajax({
				url:"/retrieveGlobalPoP",
				type:"GET",
				data : data,
				success: function (responsePop) {
					var processedMap = google.visualization.arrayToDataTable(caculcateGDP(responseGDP, responsePop)),
                        processedTable = google.visualization.arrayToDataTable(tableGDP(responseGDP, responsePop));
					drawMap(processedMap, processedTable);
				}
			});
		}
	});
}

// gathers information to showcase World Bank's GDP/population for all countries
function fetchCapital() 
{
	var data = 
	{
		startYear: "2012",
		endYear: ""
	};
	
	$.ajax({
		url:"/retrieveGlobalGDP",
		type:"GET",
		data : data,
		success: function (responseGDP) {
			$.ajax({
				url:"/retrieveGlobalPoP",
				type:"GET",
				data : data,
				success: function (responsePop) {
					// chart visualization
					var processedMap = google.visualization.arrayToDataTable(calculateGDPperCapita(responseGDP, responsePop)),
                        processedTable = google.visualization.arrayToDataTable(tableGDPperCapita(responseGDP, responsePop));
					drawMap(processedMap, processedTable);
				}
			});
		}
	});
}

// gathers information to showcase World Bank's Population for all countries
function fetchPopulation() 
{
		var data = {
			startYear: "2012",
			endYear: ""
		};
		
		$.ajax({
			url:"/retrieveGlobalGDP",
			type:"GET",
			data : data,
			success: function(responseGDP){
				$.ajax({
					url:"/retrieveGlobalPoP",
					type:"GET",
					data : data,
					success: function (responsePop) {
						var processedMap = google.visualization.arrayToDataTable(caculcatePopulation(responseGDP, responsePop));
						var processedTable = google.visualization.arrayToDataTable(tablePopulation(responseGDP, responsePop));
						drawMap(processedMap, processedTable);
					}
				});
			}
		});
}

// gathers information to showcase Kiva's newest loans 
// shows how many new loans are in each country
function fetchNewestNumber()
{
	$.ajax({
		url:"/retrieveNewestLoans",
		type:"GET",
		data: {dataSize : "500"},
		success: function (response) {
			var processedData = google.visualization.arrayToDataTable(calculateNewestLoans(response.newestLoans[0].data.loans));
			// uses same information
			drawMap(processedData, processedData);
		}
	});
}

// gathers information to showcase Kiva's newest loans 
// shows the amount of loans in us dollars that are in each country
function fetchNewestTotal()
{
	$.ajax({
		url:"/retrieveNewestLoans",
		type:"GET",
		data: {dataSize : "500"},
		success: function (response) {
			var processedData = google.visualization.arrayToDataTable(calculateNewestTotals(response.newestLoans[0].data.loans));
			drawMap(processedData, processedData);
		}
	});
}

// function to get calculation for a table for the map information
// information displays the population of each country
// @Param gdp: object with countryCode, countryName, and value
//             value is country's GDP
// @Param population: object with countryCode, countryName, and value
//                    value is country's Population
// @Return: table for map showing the world's countries' populations 
function caculcatePopulation(gdp, population) 
{
	var gdpData = filterDataValue(gdp, gdpMax),
        popData = filterDataValue(population, popMax),
        source = [],
        counter = 1;
        
	// start of the table
	source[0] = ['Country Code', 'Population (in mil)', 'GDP (in bil)'];
	
	for (var i = 0; i < gdp.length; i++) {
        if (popData[i] > 0  && gdpData[i] > 0) {
			//fills in each table
            source[counter] = [gdp[i].countryCode, popData[i] / millions, gdpData[i] / billions];
            counter++;
        }
	}
	return source;
}

// function to get calculation for a table for the map information
// information displays the GDP of each country
// @Param gdp: object with countryCode, countryName, and value
//             value is country's GDP
// @Param population: object with countryCode, countryName, and value
//                    value is country's Populatioon
// @Return: table for map showing the world's countries' GDP 
function caculcateGDP(gdp, population) 
{
	var gdpData = filterDataValue(gdp, gdpMax),
        popData = filterDataValue(population, popMax),
        source = [],
        counter = 1;
	
	source[0] = ['Country Code', 'GDP (in bil)','Popularity (in mil)'];
	
	for (var i = 0; i < gdp.length; i++){
        if (gdpData[i] > 0  && popData[i] > 0) {
            source[counter] = [gdp[i].countryCode, gdpData[i] / billions, popData[i] / millions];
            counter++;
        }
	}
	return source;
}

// function to get calculation for a table for the map information
// information displays the GDP/population of each country
// @Param gdp: object with countryCode, countryName, and value
//             value is country's GDP
// @Param population: object with countryCode, countryName, and value
//                    value is country's GDP
// @Return: table for map showing the world's countries' GDP/populations 
function calculateGDPperCapita(gdp, population) 
{
	var gdpData = filterDataValue(gdp, gdpMax);
	var popData = filterDataValue(population, popMax);
	var source = [];
	
	source[0] = ['Country Code', 'GDP Per Capita'];
	
	var gdpPerCapita = [];
	
	for (var i = 0; i < gdp.length; i++){
		if (gdpData[i] != -1 && popData[i] != -1) {
			gdpPerCapita[i] = parseInt(gdpData[i] / popData[i], 10);
		} else {
			gdpPerCapita[i] = -1;
		}
	}
	var counter = 1;
	
	for (var j = 0; j < gdp.length; j++){
		if (gdpPerCapita[j] > 0) {
			source[counter] = [gdp[j].countryCode, gdpPerCapita[j]];
			counter++;
		}
	}
	return source;
}

// @Param loans: array of objects containing location.country
//              country is a string of the county's name
// @Return: table for map and table showing the number of newest loans for each country 
function calculateNewestLoans(loans) {
	var source = [],
        countryList = [];
	
	source[0] = ['Country', 'Number of Newest Loans'];
	
	if (loans.length > 0) {
		countryList = createCounterList(loans);
	} 
	
	for (var i = 0; i < countryList.length; i++) {
		source[i + 1] = [countryList[i].countryCode, countryList[i].count];
	}
	
	return source;
}

// @Param loans: array of objects containing location.country
//              country is a string of the county's name
// @Return: table for map and table showing the total money of the newest loans for each country 
function calculateNewestTotals(loans) 
{
	var source = [];
	source[0] = ['Country', 'Total of Money for Newest Loans'];
	
	var countryList = [];
	
	if (loans.length > 0) {
		countryList = createTotalList(loans);
	}
	
	for (var i = 0; i < countryList.length; i++) {
		source[i + 1] = [countryList[i].countryCode, countryList[i].count];
	}
	
	return source;
}

// table functions create the same kind of tables in calculate functions 
// these are used by the table besides the map, rather than the map
// same process only shows county names along with the country code

// @Param gdp: object with countryCode, countryName, and value
//             value is country's GDP
// @Param population: object with countryCode, countryName, and value
//                    value is country's Population
// @Return: table for the table showing the world's countries' populations 
function tablePopulation(gdp, population) {
	var gdpData = filterDataValue(gdp, gdpMax),
        popData = filterDataValue(population, popMax),
        source = [],
        counter = 1;
	
	source[0] = ['Country Code','Country Name', 'Population (in mil)'];
	
	for (var i = 0; i < gdp.length; i++) {
        if (popData[i] > 0  && gdpData[i] > 0) {
            source[counter] = [gdp[i].countryCode, gdp[i].countryName, popData[i] / millions];
            counter++;
        }
	}
	
	return source;
}

// @Param gdp: object with countryCode, countryName, and value
//             value is country's GDP
// @Param population: object with countryCode, countryName, and value
//                    value is country's Populatioon
// @Return: table for the table showing the world's countries' GDP 
function tableGDP(gdp, population) 
{
	var gdpData = filterDataValue(gdp, gdpMax),
        popData = filterDataValue(population, popMax),
        source = [],
        counter = 1;
	
	source[0] = ['Country Code', 'Country Name', 'GDP (in bil)'];
	
	for (var i = 0; i < gdp.length; i++){
        if (gdpData[i] > 0  && popData[i] > 0) {
            source[counter] = [gdp[i].countryCode, gdp[i].countryName, gdpData[i] / billions];
            counter++;
        }
	}
	
	return source;
}

// @Param gdp: object with countryCode, countryName, and value
//             value is country's GDP
// @Param population: object with countryCode, countryName, and value
//                    value is country's GDP
// @Return: table for map showing the world's countries' GDP/populations 
function tableGDPperCapita(gdp, population) {
	var gdpData = filterDataValue(gdp, gdpMax),
        popData = filterDataValue(population, popMax),
        source = [],
        gdpPerCapita = [],
        counter = 1;
	
	source[0] = ['Country Code', 'Country Name', 'GDP Per Capita'];
	
	for (var i = 0; i < gdp.length; i++){
		if (gdpData[i] != -1 && popData[i] != -1) {
			gdpPerCapita[i] = parseInt(gdpData[i] / popData[i], 10);
		} else {
			gdpPerCapita[i] = -1;
		}
	}
	
	for (var j = 0; j < gdp.length; j++){
		if (gdpPerCapita[j] > 0) {
			source[counter] = [gdp[j].countryCode, gdp[j].countryName, gdpPerCapita[j]];
			counter++;
		}
	}
	
	return source;
}

//function to return integers that will scale the map
//@Param response: a object with a variable 'value'
//@Param max: the max an integer can realistically be.
//@Return: an array of integers  
var filterDataValue = function(response, max) {
	var data = [];
	
	for (var i = 0; i < response.length; i++){
		if (isNaN(parseInt(response[i].value, 10)) || (parseInt(response[i].value, 10) > max)){
				data[i] = -1;
		} else {
			data[i] = parseInt(response[i].value, 10);
		}
	}
	return data;
};

// run through and counts counties that have the newest loans
// @Param loans: array that contains objects with location.country
// Return: array of objects containing countryCode and count
function createCounterList(loans){
	var countryList = [];
	
	countryList[0] = 
	{
		countryCode : loans[0].location.country,
		count : 1
	};
	
	for (var i = 0; i < loans.length; i++) {
		var newCode = true;
		
		for (var  j = 0; j < countryList.length; j++) {
			if(loans[i].location.country === countryList[j].countryCode) {
				countryList[j].count += 1;
				newCode = false;
			}
		}
		
		if (newCode)	{
			countryList[countryList.length] = 
			{
				countryCode : loans[i].location.country,
				count : 1
			};
		}
	}
	
	return countryList;
}

// run through and adds up counties' loans that are the newest loans
// @Param loans: array that contains objects with location.country
// Return: array of objects containing countryCode and count
function createTotalList(loans)
{
	var countryList = [];
	
	countryList[0] = 
	{
		countryCode : loans[0].location.country,
		count : loans[0].loan_amount
	};
	
	for (var i = 0; i < loans.length; i++) {
		var previousLoanRecords = true;
		
		for (var  j = 0; j < countryList.length; j++) {
			if (loans[i].location.country === countryList[j].countryCode) {
				countryList[j].count += loans[i].loan_amount;
				previousLoanRecords = false;
			}
		}
		
		if(previousLoanRecords) {
			countryList[countryList.length] = {
				countryCode : loans[i].location.country,
				count : loans[i].loan_amount
			};
		}
	}
	return countryList;
}

// visualize the maps and corresponding tables
// @Param processedMap: table for creating a map in geomap
// @Param processedTable: table for creating a table in geograph
function drawMap(processedMap, processedTable) {
	var options = {colorAxis: {colors: ['#c0c0c0', '#000000']}, width: 500},
        chart = new google.visualization.GeoChart(document.getElementById('mapChartDiv')),
        table = new google.visualization.Table(document.getElementById('dataTable'));
	
	chart.draw(processedMap, options);
	table.draw(processedTable, null);
}

})();

$(function(){
	clientMap;
});