import { select, csv, geoMercator, scaleOrdinal, geoPath, axisBottom, extent, line } from 'd3';
import { colorLegend } from './313551139_colorLegend.js';
import { lineChart } from './313551139_Linechart.js';

const colorScale = scaleOrdinal()

const svg = select('svg');
const height = parseFloat(svg.attr('height'));
const width = parseFloat(svg.attr('width'));
const margin = { top: 50, right: 40, bottom: 150, left: 100 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
const years = ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017'];
let xColumn;
let yColumn;

const onXColumnClicked = (column) => {
  xColumn = column;
  render();
};

const onYColumnClicked = (column) => {
  yColumn = column;
  render();
};

const render = (data) => {
  svg.call(lineChart, {
    xValue: (d) => +d.year,  
    yValue: (d) => +d.value,  
    xAxisLabel: 'Year',
    yAxisLabel: 'Growth Rate (%)',
    margin: margin,
    width: width,
    height: height,
    data: data, 
    colorScale: colorScale,  
  });
};


svg
  .append('g')
  .attr('transform', `translate(${(innerWidth * 6) / 8},${(innerHeight * 1) / 20})`)
  .call(colorLegend, {
    colorScale: colorScale,
    circleRadius: 10,
    spacing: 35,
    textOffset: 20,
    backgroundRectWidth: 235,
  });
  const drawMap = (geoJsonData, countryData) => {
    const svgWidth = 2500;
    const svgHeight = 1800;
  
    let currentScale = 2500 / 14; 
    let currentTranslate = [0, 0]; 
  
    const projection = d3.geoMercator()
      .scale(currentScale)
      .translate([svgWidth / 2, svgHeight / 2 -200]);
  
    const path = d3.geoPath().projection(projection);
  
    const svg = d3.select('svg');
    const g = svg.append('g'); 
  
    const mapWidth = 2500; 
    const mapHeight = 1800; 
  
    const clampTranslate = (translate) => {
      const scaleFactor = currentScale / (2500 / 14);

      const maxX = (mapWidth * scaleFactor - svgWidth) * (scaleFactor / 2);
      const maxY = (mapHeight * scaleFactor - svgHeight) * (scaleFactor / 2);
      
      return [
          Math.max(-maxX, Math.min(maxX, translate[0])),
          Math.max(-maxY, Math.min(maxY, translate[1]))
      ];
  };
  
    const updateMap = () => {
      projection.scale(currentScale);
  
      g.selectAll('path')
        .attr('d', path);
  
      g.selectAll('circle')
        .attr('cx', d => projection([d.longitude, d.latitude])[0])
        .attr('cy', d => projection([d.longitude, d.latitude])[1]);
  
      g.selectAll('text')
        .attr('x', d => projection([d.longitude, d.latitude])[0] + 10)
        .attr('y', d => projection([d.longitude, d.latitude])[1]);
    };
  

    g.selectAll('path')
      .data(geoJsonData.features)
      .enter().append('path')
      .attr('d', path)
      .attr('fill', '#ccc')
      .attr('stroke', '#333')
      .attr('stroke-width', 0.5);
  

    g.selectAll('circle')
      .data(countryData)
      .enter().append('circle')
      .attr('cx', d => projection([d.longitude, d.latitude])[0])
      .attr('cy', d => projection([d.longitude, d.latitude])[1])
      .attr('r', 7)
      .attr('fill', 'red')
      .attr('opacity', 0.5)
      .on('mouseover', function () {
        d3.select(this).attr('opacity', 1);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.5);
      }).on('click', function (event, d) {
        showPopup(event, d);
      });
  

    g.selectAll('text')
      .data(countryData)
      .enter().append('text')
      .attr('x', d => projection([d.longitude, d.latitude])[0] + 10)
      .attr('y', d => projection([d.longitude, d.latitude])[1])
      .text(d => d.name)
      .attr('font-size', '0.7em');
  

    const dragHandler = d3.drag()
      .on('start', function () {
        d3.select(this).style('cursor', 'grabbing');
      })
      .on('drag', function (event) {
        currentTranslate[0] += event.dx;
        currentTranslate[1] += event.dy;
  

        currentTranslate = clampTranslate(currentTranslate);
  
        g.attr('transform', `translate(${currentTranslate}) scale(${currentScale / (2500 / 14)})`);
      })
      .on('end', function () {
        d3.select(this).style('cursor', 'grab');
      });
  
    svg.call(dragHandler);
  

    d3.select('#mapSlider').on('input', function () {
      const sliderValue = 14 - this.value + 4;
      currentScale = 2500 / sliderValue;
      projection.scale(currentScale);
      updateMap();
      currentTranslate = clampTranslate(currentTranslate);
  
      g.attr('transform', `translate(${currentTranslate}) scale(${currentScale / (2500 / 14)})`);
    });
    const showPopup = (event, data) => {

      d3.selectAll('.popup').remove();
  
      const popup = d3.select('body').append('div')
          .attr('class', 'popup')
          .style('position', 'fixed')
          .style('left', '50%')
          .style('top', '50%')
          .style('transform', 'translate(-50%, -50%)')
          .style('width', '80%')
          .style('height', '80%')
          .style('background-color', 'white')
          .style('padding', '20px')
          .style('border', '1px solid #ccc')
          .style('border-radius', '15px')
          .style('box-shadow', '0 2px 10px rgba(0, 0, 0, 0.1)')
          .style('font-size', '16px')
          .style('overflow', 'auto')
          .style('z-index', 9999)
          .html(`
              <strong>${data.name}</strong><br>
              Latitude: ${data.latitude}<br>
              Longitude: ${data.longitude}<br>
          `);
          const barData = years.map(year => ({
            year,
            CO2: Math.max(data[year + "_CO2"] || 0, 0), 
            PM25: Math.max(data[year + "_PM25"] || 0, 0) 
          }));
          
          const barMargin = { top: 20, right: 3000, bottom: 200, left: 40 };
          const barWidth = 1000;
          const barHeight = 200;  
          
          const maxCO2 = d3.max(barData, d => +d.CO2);
          const roundedMaxCO2 = Math.ceil(maxCO2 / 10) * 10;
          const xCO2 = d3.scaleBand()
              .domain(barData.map(d => d.year))
              .range([0, barWidth])
              .padding(0.1);

          const yCO2 = d3.scaleLinear()
              .domain([0, roundedMaxCO2])
              .range([barHeight, 0]);

        
          const maxPM25 = d3.max(barData, d => +d.PM25);
          const roundedMaxPM25 = Math.ceil(maxPM25 / 10) * 10;
          const xPM25 = d3.scaleBand()
              .domain(barData.map(d => d.year))
              .range([0, barWidth])
              .padding(0.1);

          const yPM25 = d3.scaleLinear()
              .domain([0, roundedMaxPM25])
              .range([barHeight, 0]);
          
   
          const barChartContainer = popup.append('div')
            .style('width', '100%')
            .style('margin-top', '20px');
          
   
          const barSvgCO2 = barChartContainer.append('svg')
            .attr('width', barWidth + barMargin.left + barMargin.right)
            .attr('height', barHeight + barMargin.top + barMargin.bottom)
            .append('g')
            .attr('transform', `translate(${barMargin.left+400},${barMargin.top+150})`);
          
            const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background-color", "rgba(255, 255, 255, 0.9)")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "3px")
            .style("padding", "4px")
            .style("font-size", "11px");
        
        // Add tooltip interactions to CO2 bars
        barSvgCO2.selectAll('.bar.CO2')
            .data(barData)
            .enter().append('rect')
            .attr('class', 'bar CO2')
            .attr('x', d => xCO2(d.year))
            .attr('y', d => yCO2(0))
            .attr('width', xCO2.bandwidth())
            .attr('height', 0)
            .attr('fill', '#69b3a2')
            .on('mouseover', function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`${d.year}: ${d.CO2}`)
                    .style("left", (event.pageX + 5) + "px")     // 更靠近鼠標
                    .style("top", (event.pageY - 15) + "px");    // 更靠近鼠標
                d3.select(this)
                    .style("opacity", 0.5);
            })
            .on('mouseout', function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
                d3.select(this)
                    .style("opacity", 1);
            })
            .transition()
            .duration(1000)
            .attr('y', d => yCO2(d.CO2))
            .attr('height', d => barHeight - yCO2(d.CO2));
          
  
          const barSvgPM25 = barChartContainer.append('svg')
            .attr('width', barWidth + barMargin.left + barMargin.right)
            .attr('height', barHeight + barMargin.top + barMargin.bottom)
            .append('g')
            .attr('transform', `translate(${barMargin.left+400},${barMargin.top + barHeight-100})`); 
          
            barSvgPM25.selectAll('.bar.PM25')
                .data(barData)
                .enter().append('rect')
                .attr('class', 'bar PM25')
                .attr('x', d => xPM25(d.year))
                .attr('y', d => yPM25(0))
                .attr('width', xPM25.bandwidth())
                .attr('height', 0)
                .attr('fill', '#ff6347')
                .on('mouseover', function(event, d) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(`Year: ${d.year}<br/>PM2.5: ${d.PM25}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                    d3.select(this)
                        .style("opacity", 0.5);
                })
                .on('mouseout', function() {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                    d3.select(this)
                        .style("opacity", 1);
                })
                .transition()
                .duration(1000)
                .attr('y', d => yPM25(d.PM25))
                .attr('height', d => barHeight - yPM25(d.PM25));
                      
          const style = document.createElement('style');
                style.textContent = `
                    .tooltip {
                        position: absolute;
                        text-align: center;
                        padding: 8px;
                        font: 12px sans-serif;
                        background: white;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        pointer-events: none;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                `;
                document.head.appendChild(style);
          barSvgCO2.append('g')
            .attr('class', 'x axis')
            .attr('transform', `translate(0,${barHeight})`) 
            .call(d3.axisBottom(xCO2)); 
          
  
          barSvgCO2.append('g')
            .attr('class', 'y axis')
            .call(d3.axisLeft(yCO2)); 
          

          barSvgPM25.append('g')
            .attr('class', 'x axis')
            .attr('transform', `translate(0,${barHeight})`) 
            .call(d3.axisBottom(xPM25)); 
          
  
          barSvgPM25.append('g')
            .attr('class', 'y axis')
            .call(d3.axisLeft(yPM25)); 
          barSvgCO2.append('text')
            .attr('x', -50)
            .attr('y', barHeight / 2)
            .attr('font-size', '20px')
            .attr('font-weight', 'bold')
            .attr('text-anchor', 'middle')
            .text('CO2 Emissions (tonnes)')
            .attr('transform', `translate(${550},${-130})`);  
          
          barSvgPM25.append('text')
            .attr('x', -50)
            .attr('y', barHeight / 2)
            .attr('font-size', '20px')
            .attr('font-weight', 'bold')
            .attr('text-anchor', 'middle')
            .text('PM2.5 Concentration (µg/m³)')
            .attr('transform', `translate(${550},${-130})`);  
          
  
          barSvgCO2.append('text')
            .attr('x', barWidth / 2)
            .attr('y', barHeight + barMargin.bottom - 10)
            .attr('font-size', '14px')
            .attr('text-anchor', 'middle')
            .text('Year'); 
          

          barSvgCO2.append('text')
            .attr('x', -barMargin.left / 2)
            .attr('y', barHeight / 2)
            .attr('transform', 'rotate(-90)')
            .attr('font-size', '14px')
            .attr('text-anchor', 'middle')
            .text('tonnes')
            .attr('transform', `translate(${-30},${0})`);   
          

          barSvgPM25.append('text')
            .attr('x', barWidth / 2)
            .attr('y', barHeight + barMargin.bottom - 10)
            .attr('font-size', '14px')
            .attr('text-anchor', 'middle')
            .text('Year')
            .attr('transform', `translate(${-30},${0})`); 
          

          barSvgPM25.append('text')
            .attr('x', -barMargin.left / 2)
            .attr('y', barHeight / 2)
            .attr('transform', 'rotate(0)')
            .attr('font-size', '14px')
            .attr('text-anchor', 'middle')
            .text('(µg/m³)')
            .attr('transform', `translate(${-30},${0})`);  
      popup.on('click', function (event) {
          event.stopPropagation();
      });
  

      setTimeout(() => {
          d3.select('body').on('click', function (event) {

              if (!popup.node().contains(event.target)) {
                  popup.remove();
                  d3.select('body').on('click', null);
              }
          });
      }, 0);
  };
    
  };

  d3.json('./custom.geo.json').then((worldData) => {
    // Load the CSV data
    Promise.all([
      csv('./CO2.csv'),
      csv('./PM25.csv')
    ]).then(([loadedData1, loadedData2]) => {
      // Extract the countries from both datasets
      const countries1 = new Set(loadedData1.map((row) => row.Country)); // CO2 dataset countries
      const countries2 = new Set(loadedData2.map((row) => row.Country)); // PM25 dataset countries
    // Find common countries by checking which countries appear in both datasets
      const commonCountries = [...countries1].filter((country) => countries2.has(country) && country !== 'World');
      console.log('共同的國家：', commonCountries);
  

      console.log(loadedData2)
      // Filter the data to include only countries present in both datasets
      const countryData = loadedData1.filter((row) => commonCountries.includes(row.Country))
                                     .map((row) => {
                                       const latitude = loadedData2.find((pmRow) => pmRow.Country === row.Country&& row.Country !== 'World')['latitudes']; // Extract the degree part of the latitude
                                       const longitude = loadedData2.find((pmRow) => pmRow.Country === row.Country&& row.Country !== 'World')['longitudes']; // Extract the degree part of the longitude

                                       
                                       // Find the corresponding row in the PM25 data for the same country
                                       const pm25Row = loadedData2.find((pmRow) => pmRow.Country === row.Country);
  
                                       // Create an object to hold the CO2 and PM25 data for each year
                                       const yearlyData = years.reduce((acc, year) => {
                                         acc[`${year}`] = row[`${year}`] || null; // CO2 data for the year
                                         acc[`${year}`] = pm25Row ? pm25Row[`${year}`] : null; // PM2.5 data for the year
                                         return acc;
                                         
                                       }, {});
                                       const yeaRData = years.reduce((acc, year) => {
                                        acc[`${year}_CO2`] = row[`${year}`] || null; // CO2 data for the year (from loadedData1)
                                        acc[`${year}_PM25`] = pm25Row ? pm25Row[`${year}`] : null; // PM2.5 data for the year (from loadedData2)
                                        return acc;
                                      }, {});
                                  
                                       // Return the combined data (latitude, longitude, and other relevant fields)
                                       return {
                                         name: row.Country,
                                         latitude: latitude, // Only the degree value
                                         longitude: longitude, // Only the degree value
                                         ...yearlyData, // Add the yearly data for CO2 and PM2.5
                                         ...yeaRData,
                                       };
                                     });
  
      console.log('Country Data with CO2 and PM25 values:', countryData);
  
      // Call the function to draw the map and place markers for common countries
      drawMap(worldData, countryData);
    });
  });