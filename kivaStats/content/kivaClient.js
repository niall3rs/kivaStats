//Client module containing all of the functions
var kivaClient = (function() {
	/*
	* -------------------------------------------------------- AJAX calls --------------------------------------------------------
	*/
	
	//Retrieve 50 newest loans on Kiva
	$(function(){
		$("#newestLoansButton").on("click", function() {
			$.ajax({
				url:"/retrieveNewestLoans",
				type:"GET",
				//Get newest 500 loans for later use in the map
				data: {dataSize: 500},
				success: function(response){
					//Define column names which also function as the keys the tabulate function is looking for in the data set
					var columns = ["name", "sector", "activity", "use", "posted_date", "location"];
					//Call the tabulate function with only the first 50 newest loans to limit the resulting table's length
					tabulate(response.newestLoans[0].data.loans.slice(0, 50), columns);
				}
			});
		});
	});
	
	
	//Retrieve newest lenders on Kiva
	$(function(){
		$("#newestLendersButton").on("click", function() {
			$.ajax({
				url:"/retrieveNewestLenders",
				type:"GET",
				success: function(response){
					//Define column names which also function as the keys the tabulate function is looking for in the data set
					var columns = ["name", "lender_id"];
					tabulate(response.newestLenders[0].data.lenders, columns);
				}
			});
		});
	});

	
	//Retrieve the ratio of female and male lenders on Kiva
	$(function(){
		$("#LenderGenderButton").on("click", function() {
			$.ajax({
				url:"/retrieveLenderRatioGender",
				type:"GET",
				success: function(response){
					var ratioArray = [response.femaleRatio, response.maleRatio];
					createBarChart(ratioArray, "Female", "Male");
				}
			});
		});
	});

	
	//Retrieve the total value of loans per year on Kiva
	$(function() {
		$("#LoansTotalYearButton").on("click", function() {
			$.ajax({
				url:"/retrieveLoanStats",
				type:"GET",
				success: function(response){
					createLineChart(response.totalLoansPerYear[0].data.slice(1), "total", "Total (k$)", true);
				}
			});
		});
	});
	
	
	//Retrieve the average loan value per entreprise per year on Kiva
	$(function() {
		$("#AvgLoanEntrepYearButton").on("click", function() {
			$.ajax({
				url:"/retrieveLoanStats",
				type:"GET",
				success: function(response){
					createLineChart(response.averageLoanPerYear[0].data.slice(1), "average_per_entrep", "Amount($)", false);
				}
			});
		});
	});
	
	
	//Retrieve the total number of lenders per year on Kiva
	$(function() {
		$("#NumberLendersYearButton").on("click", function() {
			$.ajax({
				url:"/retrieveLenderStats",
				type:"GET",
				success: function(response){
					createLineChart(response.countLendersPerYear[0].data, "count_lenders", "Number (k)", true);
				}
			});
		});
	});
	
	
	//Retrieve the average loan value per lender per year on Kiva
	$(function() {
		$("#AvgLoanLenderYearButton").on("click", function() {
			$.ajax({
				url:"/retrieveLenderStats",
				type:"GET",
				success: function(response){
					createLineChart(response.averageLoanPerLender[0].data, "average_loans_per_lender", "Amount ($)", false);
				}
			});
		});
	});
	
	
	//Retrieve the global GDP per year
	$(function() {
		$("#GDPPerYear").on("click", function() {
			//Container array for the annual global GDP values
			var arrayGDPYear = [];
			
			//The for loop was necessary as it proved difficult to make a single call to the World Bank API to retrieve the values for the years from 2006 to 2012
			for(var i = 2006; i<=2012;i++){
				$.ajax({
					url:"/retrieveGlobalGDPValue",
					async:false,	//necessary so that the call and its success function are executed before the next call is made. Otherwise the array would not contain all values, but only one
					type:"GET",
					data:{
						year: i
					},
					success: function(response){
						arrayGDPYear.push({"year":i.toString(), "GDP":response.toString()});
					}
				});
			}
			createLineChart(arrayGDPYear, "GDP", "GDP (bn$)", false, true);
		});
	});
	
	
	/*
	* ------ Retrieve the global GDP per year AND the total value of loans per year on Kiva ------
	*/
	//Retrieve the global GDP per year
	$(function() {
		$("#GlobalGDPVSKivaLoans").on("click", function() {
			//Container array for the annual global GDP values
			var arrayGDPYear = [];
			
			//The for loop was necessary as it proved difficult to make a single call to the World Bank API to retrieve the values for the years from 2006 to 2012
			for(var i = 2006; i<=2012;i++){
				$.ajax({
					url:"/retrieveGlobalGDPValue",
					async:false,	//necessary so that the call and its success function are executed before the next call is made. Otherwise the array would not contain all values, but only one
					type:"GET",
					data:{
						year: i
					},
					success: function(response){
						arrayGDPYear.push({"year":i.toString(), "GDP":response.toString()});
					}
				});
			}
			//Pass the array with the global GDP values per year on to the callKivaTotalLoans function
			callKivaTotalLoans(arrayGDPYear);
		});
	});
	
	//Retrieve the total value of loans per year on Kiva
	var callKivaTotalLoans = function(arrayGDPYearPara){
		//Container array for the annual total values of Kiva loans
		var arrayKivaTotal = [];
		
		$.ajax({
			url:"/retrieveLoanStats",
			type:"GET",
			success: function(response){
				//Use only the values for 2006 to 2012 to match the timeframe of the global GDP values
				arrayKivaTotal = response.totalLoansPerYear[0].data.slice(1,8);
				
				//Pass both the array with the global GDP values and the array with the total value of loans on Kiva on to the combineGDPKiva function
				combineGDPKiva(arrayGDPYearPara, arrayKivaTotal);
			}
		});
	};
	
	//Combine both the array with the global GDP values and the array with the total value of loans on Kiva into one array
	var combineGDPKiva = function(arrayGDPYearPara, arrayKivaTotalPara){
		//Pre-defining the number of objects the array will contain was necessary as dynamically adding objects did only add one object
		var arrayCombined = [{},{},{},{},{},{},{}];
		
		//Go through the global GDP values array, copy its year and GDP values into the empty combined array
		//Also copy the total value of Kiva loans for the same year into the combined array as well
		for(var i=0; i<arrayGDPYearPara.length; i++){
			arrayCombined[i]["year"] = arrayGDPYearPara[i]["year"];
			arrayCombined[i]["GDP"] = arrayGDPYearPara[i]["GDP"];
			arrayCombined[i]["total"] = arrayKivaTotalPara[i]["total"];
		}
		
		createMultipleLinesChart(arrayCombined);
	};
	
	
	
	
	/*
	* -------------------------------------------------------- D3 Functionality --------------------------------------------------------
	*/
	
	
	/*
	* ---------------------------- Table ----------------------------
	*/
	
	//Empty the container div and define pointers to the relevant table elements
	//Also call functions to create table elements and to style the table
	var tabulate = function(data, columns){	
		emptyContainer("#table");
		
		var table = d3.select("#table"),
			thead = table.append("thead"),
			tbody = table.append("tbody"),
			rows
		;
		
		createHeadings(thead, columns);
		rows = createRows(tbody, data);
		createCells(rows, columns);
		tableStyling();
		
		return table;
	};
	
	//Create and append table headings to the table head
	//Set the table headings to the pre-defined column titles
	var createHeadings = function (tableHead, tableColumns){
		tableHead.append("tr")
		.selectAll("th")
		.data(tableColumns)
		.enter()
		.append("th")
			.text(function(column) {return adjustHeaders(column);});
	};
	
	//Create and append rows to the table body
	var createRows = function (tableBody, tableData){
		var rows = tableBody.selectAll("tr")
		.data(tableData)
		.enter()
		.append("tr");	
		
		return rows;
	};
	
	//Create and append table cells (td elements) to the table rows
	//Set each cell's value by using the column title and the row number as indices to 'look up' the value
	var createCells = function(tableRows, tableColumns){
		var cells = tableRows.selectAll("td")
		.data(function(row){
			return tableColumns.map(function(column){
				if(column == "location"){
					return {column: column, value: row[column].country};
				} else {
					return {column: column, value: row[column]};
				}
			});
		})
		.enter()
		.append("td")
			.text(function(d) {return d.value; });
	};
	
	//Set different background colours for alternating rows 
	var tableStyling = function(){
		d3.select("tbody").selectAll("tr").style("background-color", function(d,i) {
			return i % 2 ? "#ffffff" : "#f0f0f0"; 
		});
	};
	
	
	/*
	* ---------------------------- Bar Chart ----------------------------
	*/
	
	//Empty the container div and set the chart's dimensions
	//Also define the chart's x scale and axis, and call functions to create the chart
	var createBarChart = function(data, value1, value2){
		emptyContainer("#chartsDivContentArea");
		
		var w = 200,
			h = 150,
			barPadding = 10,
			svg
		;
		
		var xScale = d3.scale.ordinal()
			.domain([value1, value2])
			.rangeBands([0,w]);
		
		var xAxis = d3.svg.axis()
			.scale(xScale)
			.orient("bottom");
		
		svg = appendSVGBarChartContainer(svg, w, h);		
		appendRectBarChart(svg, data, w, h, barPadding);
		appendTextBarChart(svg, data, w, h, barPadding);
		appendXAxisBarChart(svg, xAxis);		
	};
	
	//Append a svg element with the pre-defined dimensions to the container div
	var appendSVGBarChartContainer = function(svgVar, width, height){
		svgVar = d3.select("#chartsDivContentArea")
			.append("svg")
			.attr("width", width)
			.attr("height", height);
			
		return svgVar;
	};
	
	//Append the bars (i.e. rectangles) to the svg, using the data's size to determine the position and size of the bars
	var appendRectBarChart = function (svgVar, chartData, width, height, barPaddingValue){
		svgVar.selectAll("rect")
			.data(chartData)
			.enter()
			.append("rect")
			.attr("x", function(d,i){
				return i * (width / chartData.length);
			})
			.attr("y", function(d){
				return height - (d * 100);
			})
			.attr("width", width / chartData.length - barPaddingValue)
			.attr("height", function(d){
				return d * 100;
			})
			.attr("fill", "#00cc00");
	};
	
	//Append labels displaying the respective values of each bar to the chart, using the data's size to determine the labels' positions
	var appendTextBarChart = function(svgVar, chartData, width, height, barPaddingValue){
		svgVar.selectAll("text")
			.data(chartData)
			.enter()
			.append("text")
			.text(function(d){
				var formatAsPercentage = d3.format(".1%");
				return formatAsPercentage(d);
			})
			.attr("text-anchor", "middle")
			.attr("x", function(d, i) {
				return i * (width / chartData.length) + (width / chartData.length - barPaddingValue) / 2;
			})
			.attr("y", function(d) {
				return height - (d * 100) + 14;
			})
			.attr("font-size", "0.8em")
			.attr("font-weight", "bold")
			.attr("text-align", "center")
			.attr("fill", "white");
	};
	
	//Append the pre-defined x axis to the chart. The axis is appened at the top of the chart.
	var appendXAxisBarChart = function(svgVar, xAxisPara){
		svgVar.append("g")
			.attr("class", "barAxis")
			.call(xAxisPara);
	};
	
	
	
	/*
	* ---------------------------- Line Chart ----------------------------
	*/
	
	//Empty the container div and set the chart's dimensions
	//Also define the chart's x and y scales, x and y axes, x and y values (i.e. lines), x and y domains (i.e. the possible output values), and call functions to create the chart
	var createLineChart = function(data, value, valueLabel, makeThousand, makeBillion){
		emptyContainer("#chartsDivContentArea");

		var margin = {top: 20, right: 20, bottom: 40, left: 70},
			width = 576 - margin.left - margin.right,
			height = 300 - margin.top - margin.bottom,
			parseDate = d3.time.format("%Y").parse,
			svg
		;
		
		var x = d3.time.scale().range([0, width]);
		var y = d3.scale.linear().range([height, 0]);

		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom");

		var yAxis = d3.svg.axis()
			.scale(y)
			.orient("left");
		
		var line = d3.svg.line()
			.x(function(d) { return x(d.year); })
			.y(function(d) { return y(d[value]); });
		
		svg = appendSVGLineChartContainer(svg, width, height, margin);
		convertValues(data, parseDate, value, makeThousand, makeBillion);
				
		x.domain(d3.extent(data, function(d) { return d.year; }));
		//The extent function, which dynamically adjusts the domain to fit the data, did not work for the average_loans_per_lender data, so we specified a fixed domain
		if(value == "average_loans_per_lender"){
			y.domain([0, 50]);
		} else {
			y.domain(d3.extent(data, function(d) { return d[value]; }));
		}
		
		appendXAxisLineChart(svg, xAxis, height);
		appendYAxisLineChart(svg, yAxis, valueLabel);
		appendPathLineChart(svg, data, line);
		appendDotsLineChart(svg, data, value, valueLabel, x, y);
	};
	
	//Convert and transform values into a displayable form and size
	var convertValues = function(dataVar, parseDateFunction, valueVar, makeThousandBoolean, makeBillionBoolean){
		dataVar.forEach(function(d) {
			d.year = parseDateFunction(d.year);
			if(makeThousandBoolean){
				d[valueVar] = d[valueVar]/1000;
			} else if (makeBillionBoolean){
				d[valueVar] = d[valueVar]/1000000000;
			} else {
				d[valueVar] = d[valueVar];
			}
		});
	};
	
	//Append a svg element with the pre-defined dimensions to the container div
	var appendSVGLineChartContainer = function(svgVar, widthValue, heightValue, marginObject){
		svgVar = d3.select("#chartsDivContentArea").append("svg")
			.attr("width", widthValue + marginObject.left + marginObject.right)
			.attr("height", heightValue + marginObject.top + marginObject.bottom)
		  .append("g")
			.attr("transform", "translate(" + marginObject.left + "," + marginObject.top + ")");
		
		return svgVar;
	};
	
	//Append the x axis to the line chart
	var appendXAxisLineChart = function(svgVar, xAxisVar, heightValue){
		svgVar.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + heightValue + ")")
			.call(xAxisVar);
	};
	
	//Append the y axis to the line chart, including a label showing the value that the axis displays
	var appendYAxisLineChart = function(svgVar, yAxisVar, valueLabelVar){
		svgVar.append("g")
			.attr("class", "y axis")
			.call(yAxisVar)
		  .append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text(valueLabelVar);
	};
	
	//Append the path, i.e. the actual line, to the line chart
	var appendPathLineChart = function(svgVar, dataVar, lineVar){
		svgVar.append("path")
			.datum(dataVar)
			.attr("class", "line")
			.attr("d", lineVar);
	};
	
	//Append dots to the line indicating and, when hovered, displaying the exact value at this point
	var appendDotsLineChart = function(svgVar, dataVar, valueVar, valueLabelVar, xVar, yVar){	
		var formatTime = d3.time.format("%Y"),
			div = d3.select("#chartsDivContentArea").append("div")
				.attr("class", "tooltip")
				.style("opacity", 0)		
		;
		
		svgVar.selectAll("dot")
			.data(dataVar)
		  .enter().append("circle")
			.attr("r", 3.5)
			.attr("cx", function(d) { return xVar(d.year); })
			.attr("cy", function(d) { return yVar(d[valueVar]); })
			.on("mouseover", function(d) {
				div.transition()
				.duration(200)
				.style("opacity", .9);
				//parseInt() and toLocaleString() were used to show the value in a more readable format.
				//toFixed(0) was used as well initially, but proved erroneous and redundant
				div .html(formatTime(d.year) + "<br/>" + valueLabelVar + ": " + parseInt(d[valueVar], 10).toLocaleString())
					.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY - 28) + "px");
				})
			.on("mouseout", function(d) {
				div.transition()
					.duration(500)
					.style("opacity", 0);
			});
	};
	
	
	/*
	* ---------------------------- Multiple Lines Chart ----------------------------
	*/
	
	//Empty the container div and set the chart's dimensions
	/*Also define the chart's x and y(two) scales, x and y(left and right) axes, x and y values (i.e. lines, two lines here),
	  x and y domains (i.e. the possible output values, 3 domains in total), parse and transform the data and call functions to create the chart*/
	var createMultipleLinesChart = function(data){
		emptyContainer("#chartsDivContentArea");  
		var margin = {top: 20, right: 70, bottom: 40, left: 70},
			width = 576 - margin.left - margin.right,
			height = 300 - margin.top - margin.bottom,
			svg
		;
			
		var parseDate = d3.time.format("%Y").parse;		
		
		var div = d3.select("#chartsDivContentArea").append("div")
			.attr("class", "tooltip")
			.style("opacity", 0);

		var x = d3.time.scale().range([0, width]);
		var y0 = d3.scale.linear().range([height, 0]);
		var y1 = d3.scale.linear().range([height, 0]);

		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom");
			
		var yAxisLeft = d3.svg.axis()
			.scale(y0)
			.orient("left");
			
		var yAxisRight = d3.svg.axis()
			.scale(y1)
			.orient("right");
			
		var valueline = d3.svg.line()
			.x(function(d) { return x(d.year); })
			.y(function(d) { return y0(d.GDP); });
			
		var valueline2 = d3.svg.line()
			.x(function(d) {return x(d.year);})
			.y(function(d) {return y1(d.total);});
			
		svg = appendSVGMultiLineChart(svg, width, margin, height);
		
		data.forEach(function(d) {
			d.year = parseDate(d.year);
			d.GDP = d.GDP/1000000000;
			d.total = d.total/1000;
		});

		x.domain(d3.extent(data, function(d) { return d.year; }));
		y0.domain([0, d3.max(data, function(d) { return d.GDP; })]);
		y1.domain([0, d3.max(data, function(d) { return d.total; })]);
		
		appendXAxisMultiLineChart(svg, height, xAxis);
		appendLeftYAxisMultiLineChart(svg, yAxisLeft);
		appendRightYAxisMultiLineChart(svg, width, yAxisRight);
		appendPathMultiLineChart(svg, valueline, data, "line");
		appendPathMultiLineChart(svg, valueline2, data, "line2");
		appendDotsMultiLineChart(svg, data, x, y0, div, "GDP", "GDP: bn$");
		appendDotsMultiLineChart(svg, data, x, y1, div, "total", "Amount: k$");
		appendLegendTable();		
	};
	
	//Append a svg element with the pre-defined dimensions to the container div
	var appendSVGMultiLineChart = function(svgVar, widthValue, marginObject, heightValue){
		svgVar = d3.select("#chartsDivContentArea")
			.append("svg")
			.attr("width", widthValue + marginObject.left + marginObject.right)
			.attr("height", heightValue + marginObject.top + marginObject.bottom)
		  .append("g")
			.attr("transform", "translate(" + marginObject.left + "," + marginObject.top + ")");
		
		return svgVar;
	};
	
	//Append the x axis to the 2-lines chart
	var appendXAxisMultiLineChart = function(svgVar, heightVar, xAxisVar){
		svgVar.append("g") // Add the X Axis
			.attr("class", "x axis0")
			.attr("transform", "translate(0," + heightVar + ")")
			.call(xAxisVar);
	};
	
	//Append the left y axis to the 2-lines chart
	var appendLeftYAxisMultiLineChart = function(svgVar, yAxisLeftVar){
			svgVar.append("g")
				.attr("class", "y axis")
				.attr("fill", "#00cc00")
				.call(yAxisLeftVar);
		};
	
	//Append the right y axis to the 2-lines chart
	var appendRightYAxisMultiLineChart = function(svgVar, widthVar, yAxisRightVar){			
		svgVar.append("g")
			.attr("class", "y axisRight")
			.attr("transform", "translate(" + widthVar + ", 0)")
			.attr("fill", "orange")
			.call(yAxisRightVar);
	};
	
	//Append a path, i.e. the actual line, to the 2-lines chart
	var appendPathMultiLineChart = function(svgVar, lineVar, dataVar, lineClass){
		svgVar.append("path")
			.attr("class", lineClass)
			.attr("d", lineVar(dataVar));
	};
	
	//Append dots to a line indicating and, when hovered, displaying the exact value at this point
	var appendDotsMultiLineChart = function(svgVar, dataVar, xVar, yVar, divVar, valueVar, valueLabel){
		var formatTime = d3.time.format("%Y");
		svgVar.selectAll("dot")
			.data(dataVar)
			.enter().append("circle")
			.attr("r", 3.5)
			.attr("cx", function(d) { return xVar(d.year); })
			.attr("cy", function(d) { return yVar(d[valueVar]); })
			.on("mouseover", function(d) {
				divVar.transition()
				.duration(200)
				.style("opacity", .9);
				//parseInt() and toLocaleString() were used to show the value in a more readable format.
				//toFixed(0) was used as well initially, but proved redundant.
				divVar .html(formatTime(d.year) + "<br/>" + valueLabel + parseInt(d[valueVar], 10).toLocaleString())
					.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY - 28) + "px");
				})
				.on("mouseout", function(d) {
					divVar.transition()
						.duration(500)
						.style("opacity", 0);
				});
	};
	
	//Append a table to the container div, representing the legend for the chart
	var appendLegendTable = function(){
		$("#chartsDivContentArea").append(
			$("<table>").css("float", "left").append(
				$("<tr>").append(
					$("<td>").css({"background-color": "#00cc00", "width" : "4em"})
				).append(
					$("<td>").text("GDP")
				))
			.append(
				$("<tr>").append(
					$("<td>").css({"background-color": "#ff9900", "width" : "4em"})
				).append(
					$("<td>").text("Kiva")
				)
			)
		);
	};
	
	
	
	
	/*
	* -------------------------------------------------------- Auxiliary functions --------------------------------------------------------
	*/
	
	//Function that is being passed a selector ID and empties the corresponding element
	var emptyContainer = function(containerID){
		if($(containerID).children().length > 0){
			$(containerID).empty();
		}
	};
	
	//Function to capitalise headers and replace special characters, i.e. non-letter/-number characters with spaces
	var adjustHeaders = function(string){
		var i;
		for(i=0; i<string.length; i++){
			if(/^[a-zA-Z0-9- ]*$/.test(string.charAt(i)) === false) {
				string = string.replaceAt(i, " ");
			}
		}
		return string.charAt(0).toUpperCase() + string.slice(1);
	};
	
	//Function for the string protoype that replaces a character at a specified index with a pre-defined character
	String.prototype.replaceAt=function(index, character) {
		return this.substr(0, index) + character + this.substr(index+character.length);
	};
	
	//Show the mainSection div corresponding to the href of an anchor element, and hide all other mainSection divs
	$(function(){
		$("a").on("click", function(){
			var divID = $(this).attr("href");
			$(divID).show();
			$(".mainSection").not(divID).hide();
			$("#welcome").hide();
		});
	});
	
	//Highlight the clicked on button corresponding to the currently displayed table, chart or map
	//Also sets the graphic's title to the button text
	$(function() {
		$(".button").on("click", function(){
			$(this).css("background-color", "#00cc00");
			$(this).siblings().not($(this)).css("background-color", "#ffffff");
			$(this).parent().siblings(".contentDiv").children(".titleText").text($(this).text());
		});
	});
})();

//Call the module on the document.ready event
$(function(){
	kivaClient;
});