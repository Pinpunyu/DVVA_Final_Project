import { select, csv, scaleOrdinal} from 'd3';


const colorScale = scaleOrdinal()

const svg = select('svg');
const height = parseFloat(2500);
const width = parseFloat(1800);
const margin = { top: 50, right: 40, bottom: 150, left: 100 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
const years = ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017'];




const drawMap = (geoJsonData, countryData) => {
  const svgWidth = 2500;
  const svgHeight = 800;

  let currentScale = 2500 / 14;
  let currentTranslate = [0, 0];
  const mapWidth = 2500;
  const mapHeight = 800;
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

  const projection = d3.geoMercator()
    .scale(currentScale)
    .translate([svgWidth / 2, svgHeight / 2 +150]);

  const path = d3.geoPath().projection(projection);

  const svg = d3.select('svg');
  const g = svg.append('g');

  const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([0, d3.max(countryData, d => d['2010_Death']) || 100]);

  const countryDataMap = new Map(countryData.map(d => [d.name, d['2010_Death']]));

  const countries = g.selectAll('path')
    .data(geoJsonData.features)
    .enter().append('path')
    .attr('d', path)
    .attr('fill', d => {
      const countryName = d.properties.name;
      const value = countryDataMap.get(countryName);
      return value !== undefined ? colorScale(value) : 'white';
    })
    .attr('stroke', '#333')
    .attr('stroke-width', 0.5);

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "rgba(255, 255, 255, 0.9)")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "3px")
    .style("padding", "4px")
    .style("font-size", "11px")
    .style("pointer-events", "none");

countries.on('mouseover', function(event, d) {
    const countryName = d.properties.name;
    const value = countryDataMap.get(countryName);

    tooltip.transition()
        .duration(200)
        .style("opacity", .9);
    tooltip.html(countryName)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");


    if (value !== undefined) {
        d3.select(this)
            .attr('stroke', 'black')
            .attr('stroke-width', 3);
    }
})
.on('mousemove', function(event) {
    tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
})
.on('mouseout', function(event, d) {
    tooltip.transition()
        .duration(500)
        .style("opacity", 0);

    d3.select(this)
        .attr('stroke', '#333')
        .attr('stroke-width', 0.5);
})
.on('click', function (event, d) {
    const countryName = d.properties.name;
    const countryInfo = countryData.find(c => c.name === countryName);
    if (countryInfo) {
        showPopup(event, countryInfo);
    }
});

  // Function to display the popup
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
  
    d3.select('#yearSelector').on('change', function() {
      const selectedYear = `${this.value}_Death`;
  
     
      colorScale.domain([0, d3.max(countryData, d => d[selectedYear]) || 100]);
  
   
      const updatedMap = new Map(countryData.map(d => [d.name, d[selectedYear]]));
  

      countries.attr('fill', d => {
        const countryName = d.properties.name;
        const value = updatedMap.get(countryName);
        return value !== undefined ? colorScale(value) : 'white';
      });
      updateLegend(colorScale);
    });
    const updateLegend = (colorScale) => {
      const legendWidth = 20;  
      const legendHeight = 300;  
      const legendXOffset = svgWidth - legendWidth - 50; 
      const legendYOffset = 50;
    

      const legend = svg.selectAll(".legend")
        .data([colorScale])
        .join("g")
        .attr("class", "legend")
        .attr("transform", `translate(${legendXOffset-120}, ${legendYOffset+105})`);
    

      const gradientId = "gradient";
      svg.selectAll(`#${gradientId}`).remove(); 
      const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", gradientId)
        .attr("x1", "0%")
        .attr("x2", "0%")
        .attr("y1", "100%")
        .attr("y2", "0%");
    
 
      gradient.selectAll("stop")
        .data(colorScale.range())
        .join("stop")
        .attr("offset", (d, i) => `${(i / (colorScale.range().length - 1)) * 100}%`)
        .style("stop-color", d => d);
    
  
      legend.selectAll("rect")
        .data([0]) 
        .join("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", `url(#${gradientId})`);
    

      const legendScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([legendHeight, 0]);
    


        const ticks = legendScale.ticks(5);
        if (!ticks.includes(colorScale.domain()[1])) {
          ticks.push(colorScale.domain()[1]); 
        }
        legend.selectAll(".tick").remove();
        const tickGroups = legend.selectAll(".tick")
          .data(ticks)
          .join("g")
          .attr("class", "tick")
          .attr("transform", d => `translate(0, ${legendScale(d)})`);
      
  
        tickGroups.append("line")
          .attr("x1", 20)
          .attr("x2", 25) 
          .attr("stroke", "black");
      
  
        tickGroups.append("text")
          .attr("x", 30)
          .attr("dy", "0.32em")
          .attr("text-anchor", "start")
          .text(d => d3.format(".1f")(d)); 
    };
    updateLegend(colorScale);
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
          .style('font-size', '30px')
          .style('overflow', 'auto')
          .style('z-index', 9998)
          .html(`
              <strong>${data.name}</strong><br>
              Latitude: ${data.latitude}<br>
              Longitude: ${data.longitude}<br>
          `);
          const barData = years.map(year => ({
            year,
            CO2: Math.max(data[year + "_CO2"] || 0, 0), 
            PM25: Math.max(data[year + "_PM25"] || 0, 0),
            deaths:  Math.max(data[year + "_Death"] || 0, 0),
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
          const maxDeath = d3.max(barData, d => +d.deaths); 
          const roundedMaxDeath = Math.ceil(maxDeath / 10) * 10;
          const xDeath = d3.scaleBand()
              .domain(barData.map(d => d.year))
              .range([0, barWidth])
              .padding(0.1);
          
          const yDeath = d3.scaleLinear()
              .domain([0, roundedMaxDeath]) 
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
            .style('z-index', 9999)
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
              console.log(`Year: ${d.year}<br/>CO2: ${d.CO2}`);
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                    tooltip.html(`Year: ${d.year}<br/>CO2: ${d.CO2}`)
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
            const barSvgDeath = barChartContainer.append('svg')
                .attr('width', barWidth + barMargin.left + barMargin.right)
                .attr('height', barHeight + barMargin.top + barMargin.bottom)
                .append('g')
                .attr('transform', `translate(${barMargin.left+400},${barMargin.top+30})`);
            
         
            barSvgDeath.selectAll('.bar.death')
                .data(barData)
                .enter().append('rect')
                .attr('class', 'bar death')
                .attr('x', d => xDeath(d.year))  
                .attr('y', d => yDeath(0))  
                .attr('width', xDeath.bandwidth()) 
                .attr('height', 0) 
                .attr('fill', '#d62728')  
                .on('mouseover', function(event, d) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(`Year: ${d.year}<br/>Deaths: ${d.deaths}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                    d3.select(this)
                        .style("opacity", 0.5);  
                })
                .on('mouseout', function() {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0)
                    d3.select(this)
                        .style("opacity", 1);  
                })
                .transition()
                .duration(1000)
                .attr('y', d => yDeath(d.deaths)) 
                .attr('height', d => barHeight - yDeath(d.deaths));            
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
            .attr('x', -barMargin.left / 2)
            .attr('y', barHeight / 2)
            .attr('transform', 'rotate(-90)')
            .attr('font-size', '14px')
            .attr('text-anchor', 'middle')
            .text('tonnes')
            .attr('transform', `translate(${-50},${0})`);   
          

          barSvgPM25.append('text')
            .attr('x', -barMargin.left / 2)
            .attr('y', barHeight / 2)
            .attr('transform', 'rotate(0)')
            .attr('font-size', '14px')
            .attr('text-anchor', 'middle')
            .text('(µg/m³)')
            .attr('transform', `translate(${-50},${0})`);
          barSvgDeath.append('g')
            .attr('class', 'x axis')
            .attr('transform', `translate(0,${barHeight})`) 
            .call(d3.axisBottom(xDeath)); 
          
  
          barSvgDeath.append('g')
            .attr('class', 'y axis')
            .call(d3.axisLeft(yDeath));   
          barSvgDeath.append('text')
            .attr('x', -50)
            .attr('y', barHeight / 2)
            .attr('font-size', '20px')
            .attr('font-weight', 'bold')
            .attr('text-anchor', 'middle')
            .text('Deaths because of air pollution')
            .attr('transform', `translate(${550},${-130})`); 
          

            barSvgDeath.append('text')
            .attr('x', -barMargin.left / 2)
            .attr('y', barHeight / 2)
            .attr('font-size', '14px')
            .attr('text-anchor', 'middle')
            .text('Deaths per 1000 people')
            .attr('transform', `rotate(-90) translate(${-80},${-150})`);
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

  Promise.all([
    csv('./CO2.csv'),
    csv('./PM25.csv'),
    csv('./death.csv')
  ]).then(([loadedData1, loadedData2, loadData3]) => {

    const countries1 = new Set(loadedData1.map((row) => row.Country)); // CO2 dataset countries
    const countries2 = new Set(loadedData2.map((row) => row.Country)); // PM25 dataset countries
    const countries3 = new Set(loadData3.map((row) => row.Country)); // Death dataset countries

    
    const commonCountries = [...countries1]
      .filter((country) => countries2.has(country) && countries3.has(country) && country !== 'World');

 
    const countryData = loadedData1.filter((row) => commonCountries.includes(row.Country))
      .map((row) => {
 
        const pm25Row = loadedData2.find((pmRow) => pmRow.Country === row.Country);
        const deathRows = loadData3.filter((deathRow) => deathRow.Country === row.Country);


        const latitude = pm25Row ? pm25Row.latitudes : null;
        const longitude = pm25Row ? pm25Row.longitudes : null;

  
        const yearlyData = years.reduce((acc, year) => {
          acc[`${year}_CO2`] = row[`${year}`] || null;
          acc[`${year}_PM25`] = pm25Row ? pm25Row[`${year}`] : null; 
          
          
          const deathRow = deathRows.find((dRow) => dRow.Year === year);
          if (deathRow) 
            acc[`${year}_Death`] = deathRow.Death || null;
          else 
            acc[`${year}_Death`] = null;
          return acc;
        }, {});


        return {
          name: row.Country,
          latitude: latitude, 
          longitude: longitude, 
          ...yearlyData, 
        };
      });

    console.log('Country Data with CO2, PM25, and Death values:', countryData);

    
    drawMap(worldData, countryData);
  });
});