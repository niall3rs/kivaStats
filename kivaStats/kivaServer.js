// Set up the server
var kivaServer = (function() {
	var db,
		connectStr = 'mongodb://localhost:27017/kivaStats',
		MongoClient = require('mongodb').MongoClient,
		assert = require('assert'),
		http = require('http'),
		currentTime = new Date(),
		
		// Set up express
		configureApp = function(){
			var express = require('express'),
				app = express();
				
			app.use(app.router);
			app.use(express.static('content'));
			
			return app;
		};
	
	function startUp() {
		MongoClient.connect(connectStr, {server:{poolSize:1}}, function(error, dbhandle) {
			var app = configureApp();
			
			db = dbhandle;
			app.listen(8080);  
			setRESTAPI(app);
			app.close = function() {
				console.log("Shutting down...");
				db.close();
			};
			
			console.log('server running at http://127.0.0.1:8080)');			
		});
	}
	
	// Configuring the RESTful APIs (request handlers)  
	var setRESTAPI = function(app){
		app.get('/retrieveNewestLoans', retrieveNewestLoans);
		app.get('/retrieveNewestLenders', retrieveNewestLenders);
		app.get('/retrieveLenderRatioGender',retrieveLenderRatioGender);
		app.get('/retrieveLoanStats', retrieveLoanStats);
		app.get('/retrieveLenderStats', retrieveLenderStats);
		app.get('/retrieveGlobalGDPValue', retrieveGlobalGDPValue);
		app.get('/retrieveGlobalGDP',retrieveGlobalGDP);
		app.get('/retrieveGlobalPop', retrieveGlobalPop);
	};
	
	// Function to get the newest <dataSize> number of loans, which is defined on the client side
	var retrieveNewestLoans = function(request, response){
		var kivaStatsJSON = {},
			dataSize = request.param('dataSize'),
			newestLoansURL = 'http://api.kivaws.org/v1/loans/newest.json?per_page=' + dataSize,
			currentDateObject = new Date(),
			currentDate = parseDate(currentDateObject);
			
		accessAPI(kivaStatsJSON, 'newestLoans', newestLoansURL, currentDate, function(){
			response.json(kivaStatsJSON);
		});
	};
	
	// Function to get the newest lenders. Returns 50 entries by default.
	var retrieveNewestLenders = function(request, response){
		var kivaStatsJSON = {},
			newestLendersURL = 'http://api.kivaws.org/v1/lenders/newest.json',
			currentDateObject = new Date(),
			currentDate = parseDate(currentDateObject);
			
		accessAPI(kivaStatsJSON, 'newestLenders', newestLendersURL, currentDate, function(){
			response.json(kivaStatsJSON);
		});
	};
	
	// Function to compare male and female lenders. Ratio is calculated on server side before being sent to client
	var retrieveLenderRatioGender = function(request, response){
		var kivaStatsJSON = {},
			maleBorrowerURL = 'http://api.kivaws.org/v1/loans/search.json?gender=male', // Returns 1st 20 results as default
			femaleBorrowerURL = 'http://api.kivaws.org/v1/loans/search.json?gender=female', // Returns 1st 20 results as default
			currentDateObject = new Date(),
			currentDate = parseDate(currentDateObject);
			
		accessAPI(kivaStatsJSON, 'maleBorrower', maleBorrowerURL, currentDate, function(){
			accessAPI(kivaStatsJSON, 'femaleBorrower', femaleBorrowerURL, currentDate, function(){
				var femaleCount = kivaStatsJSON.femaleBorrower[0].data.paging.total,
					maleCount = kivaStatsJSON.maleBorrower[0].data.paging.total,
					totalCount = femaleCount + maleCount;
				
				kivaStatsJSON.maleRatio = maleCount/totalCount;
				kivaStatsJSON.femaleRatio = femaleCount/totalCount;
				
				delete kivaStatsJSON.maleBorrower;
				delete kivaStatsJSON.femaleBorrower;
				
				response.json(kivaStatsJSON);
			});
		});
	};
    
	// Function to get information regarding total and average loans per year
	var retrieveLoanStats = function(request, response){
		
		var kivaStatsJSON = {},
			totalLoansPerYearURL = 'http://api.kivaws.org/v1/statistics/loans/total.json?period=year',
			averageLoanPerYearURL = 'http://api.kivaws.org/v1/statistics/loans/average_per_entrep.json?period=year',
			currentDateObject = new Date(),
			currentDate = parseDate(currentDateObject);		
		
		accessAPI(kivaStatsJSON, 'totalLoansPerYear', totalLoansPerYearURL, currentDate, function(){
			accessAPI(kivaStatsJSON, 'averageLoanPerYear', averageLoanPerYearURL, currentDate, function(){
				response.json(kivaStatsJSON);
			});
		});
	};
	
	// Function to get information regarding total number of lenders, and average loan per lender per year
	var retrieveLenderStats = function(request, response){
		var kivaStatsJSON = {},
			countLendersPerYearURL = 'http://api.kivaws.org/v1/statistics/lenders/count_lenders.json?period=year',
			averageLoanPerLenderURL = 'http://api.kivaws.org/v1/statistics/lenders/average_loans_per_lender.json?period=year',
			currentDateObject = new Date(),
			currentDate = parseDate(currentDateObject);
		
		accessAPI(kivaStatsJSON, 'countLendersPerYear', countLendersPerYearURL, currentDate, function(){
			accessAPI(kivaStatsJSON, 'averageLoanPerLender', averageLoanPerLenderURL, currentDate, function(){
				response.json(kivaStatsJSON);
			});
		});
	};
	
	// Function to get the GDP for every country per year for the charts
	var retrieveGlobalGDPValue = function(request, response) {
		var year = request.param('year'),
			url = 'http://api.worldbank.org/countries/indicators/NY.GDP.MKTP.CD?per_page=300&date=' + year + '&format=json',
			currentDateObject = new Date(),
			currentDate = parseDate(currentDateObject);
			kivaStatsJSON = {},
			attribute = 'globalGDPValue' + year;
			
		accessAPI(kivaStatsJSON, attribute, url, currentDate, function(){
			response.json(globalGDPStandardise(kivaStatsJSON, year));
		});
	};
	
	// Function to calculate the global GDP from World bank API
	var globalGDPStandardise = function(responseBody, year) {
		var gdpCounter = 0,
			att = "globalGDPValue" + year;
		
		for(var i=0; i<responseBody[att][0].data[1].length; i++) {
			GDPValue = parseFloat(responseBody[att][0].data[1][i].value);
			if(!isNaN(GDPValue)){
				gdpCounter += GDPValue;
			}
		}
		return gdpCounter;
	};
	
	// Function to get the GDP data for each country per year for the maps
	var retrieveGlobalGDP = function(request, response) {
		var kivaStatsJSON = {},
			url = "",
			attribute = '',
			currentDateObject = new Date(),
			currentDate = parseDate(currentDateObject);
		
		if(request.param('endYear').length === 0) {
			var year = request.param('startYear');
			url = 'http://api.worldbank.org/countries/indicators/NY.GDP.MKTP.CD?per_page=300&date=' + year + '&format=json';
			attribute = 'globalGDPsingleYear';
		} else {
			var startYear = request.param('startYear');
			var endYear = request.param('endYear');
			url = 'http://api.worldbank.org/countries/indicators/NY.GDP.MKTP.CD?per_page=300&date=' + startYear +'%3A' + endYear + '&format=json';
			attribute = 'globalGDPmultipleYears';
		}
		
		accessAPI(kivaStatsJSON, attribute, url, currentDate, function(){
			parseMapData(kivaStatsJSON, attribute, url, currentDate, function(data){
				response.json(data);
			});
		});
	
	};
	
	//Function to get the population data for each country per year for the maps
	var retrieveGlobalPop = function(request, response) {
		var kivaStatsJSON = {},
			url = "",
			attribute = '',
			currentDateObject = new Date(),
			currentDate = parseDate(currentDateObject);
		
		if(request.param('endYear').length === 0) {
			var year = request.param('startYear');
			url = 'http://api.worldbank.org/countries/indicators/SP.POP.TOTL?per_page=300&date=' + year +'&format=json';
			attribute = 'globalPopulationSingleYear';
		} else {
			var startYear = request.param('startYear');
			var endYear = request.param('endYear');
			url = 'http://api.worldbank.org/countries/indicators/SP.POP.TOTL?per_page=300&date='+ startYear + '%3A'+ endYear +'&format=json';
			attribute = 'globalPopulationMultipleYears';
		}
		
		accessAPI(kivaStatsJSON, attribute, url, currentDate, function () {
			parseMapData(kivaStatsJSON, attribute, url, currentDate, function (data) {
				response.json(data);
			});
		});
	};
	
	// Function to convert the data into the correct format to be illustrated on the maps before sending to the client
	var parseMapData = function (kivaStatsJSON, attribute, url, currentDate, callback) {
		var responseData = [];
		
		for (var i=0 ; i<kivaStatsJSON[attribute][0].data[1].length ; i++) {
			var data = {
				countryCode : kivaStatsJSON[attribute][0].data[1][i].country.id,
				value : kivaStatsJSON[attribute][0].data[1][i].value,
				countryName : kivaStatsJSON[attribute][0].data[1][i].country.value
			};
			responseData.push(data);
		}
		
		callback(responseData);
	};
	
	/* Function that checks MongoDB for cached data
	*  If there is none, or it is > 2 days old, a new API call is made, stored in MongoDB and then served to the client
	*  If the data in MongoDB is present and < 2 days old, it is served directly to the client
	*/
	var accessAPI = function (kivaStatsJSON, attributeName, url, currentDate, callback) {
		db.collection(attributeName).find().toArray(function(error, cachedData){
			if(cachedData.length === 0 || (currentDate - cachedData[0].timeStamp) > 1) {
				http.get(url, function(APIResponse) {
					var responseBody = '';
					
					APIResponse.on('data', function (chunk) { 
						responseBody += chunk;
					});
					
					APIResponse.on('end', function() {
						var APIData = JSON.parse(responseBody);
						
						db.collection(attributeName).remove(function (err, result) {
							db.collection(attributeName).insert({
								attributeName: attributeName,
								data: APIData,
								timeStamp: currentDate
							}, function (error, result) { 
								console.log("sending new " + attributeName + " data from API");
								
								db.collection(attributeName).find().toArray(function(error, newData){
									console.log("sending new " + attributeName + " data from database");
									
									kivaStatsJSON[attributeName] = newData;
									callback(kivaStatsJSON, attributeName, url, currentDate, callback);
								});
							});
						});
					});
				}).on('error', function(e) {
                    console.log("Error encountered ", e);
				});
            } else {
				console.log("sending cached "+ attributeName +" data from database");
				
				kivaStatsJSON[attributeName] = cachedData;
				callback (kivaStatsJSON, attributeName, url, currentDate, callback);
			} 
		});
	};
	
	// Function that takes the date object and returns an int of the form 'YYYYMMDD'
	// Used for comparison between current date and cached timestamp
	var parseDate = function (dateObject) {
		var yearValue = dateObject.getFullYear(),
			monthValue = dateObject.getMonth(),
			dayValue = dateObject.getDate(),
			yearString = yearValue.toString(),
			monthString = monthValue.toString(),
			dayString = dayValue.toString(),
			dateString,
			dateValue;
		
		if (dayString.length == 1) {
			dayString = "0" + dayString;
		}
		
		if (monthString.length == 1) {
			monthString = "0" + monthString;
		}
		
		dateString = yearString + monthString + dayString;
		
		dateValue = parseInt(dateString, 10);
		
		return dateValue;
	};
	
	return{startUp: startUp };
})();

kivaServer.startUp();