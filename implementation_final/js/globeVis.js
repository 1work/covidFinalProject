/* * * * * * * * * * * * * *
* Map Visualization        *
* * * * * * * * * * * * * */

// Covid impact on mobility globally.
// starting with data processing and wraggling. And get also topological data for drawing world map (maybe lab 9).
class GlobeVis {
// constructor
    constructor(parentElement, mobility_data, geodata){
        this.mobility_data = mobility_data;
        this.parentElement = parentElement;
        this.geoData = geodata;

        // define colors
        this.colors = ['white', "lavender", 'purple', 'indigo']

        this.initVis()
    }

    initVis(){
        let vis = this
        console.log("this is the globe vis data", vis.mobility_data)
        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", document.getElementById(vis.parentElement).getBoundingClientRect().width)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate(0, 0)`);


        // add title
        vis.globeTitle = vis.svg.append('g')
            .attr('class', 'title globe-title')
            .append('text')
            .attr('transform', `translate(${document.getElementById(vis.parentElement).getBoundingClientRect().width / 2}, 30)`)
            .attr('text-anchor', 'middle')
            .text("Mobility Changes During COVID-19")
            .style("font-weight", "bold")

        vis.projection = d3.geoOrthographic() // d3.geoStereographic()
            .translate([document.getElementById(vis.parentElement).getBoundingClientRect().width / 2, vis.height *4/7])
            .scale(200)

        vis.path = d3.geoPath()
            .projection(vis.projection);

        vis.world = topojson.feature(vis.geoData, vis.geoData.objects.countries).features

        vis.svg.append("path")
            .datum({type: "Sphere"})
            .attr("class", "graticule")
            .attr('fill', '#ADDEFF')
            .attr("stroke","rgba(129,129,129,0.35)")
            .attr("d", vis.path);

        vis.countries = vis.svg.selectAll(".country")
            .data(vis.world)
            .enter().append("path")
            .attr('class', 'country')
            .attr("d", vis.path)

        vis.legend = vis.svg.append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width * 2.5 / 4}, ${vis.height - 20})`)

        vis.legendAxisGroup = vis.legend.append("g")
            .attr('class','axis axis--legend' )

        vis.scaleAnomaly = d3.scaleDiverging(d3.interpolateRainbow)
            .domain([-97, 0, 266.6]);

        vis.legendScale = d3.scaleLinear()
            .range([0,100])
            .domain([-97, 266.6]);
        // define the scales
        vis.colorScale = d3.scaleLinear()
            .range(["#8c8c8c", "#800000"]);

        vis.legendAxis = d3.axisBottom()
            .scale(vis.legendScale)
            .tickValues([-97, 0, 266.6]);

        vis.defs = vis.legend.append("defs");

        vis.linearGradient = vis.defs
            .append("linearGradient")
            .attr("id", "myGradient")

        vis.linearGradient.selectAll("stop")
            .data([-97, 0, 266.6])
            .enter().append("stop")
            .attr("offset", d => (d + "%"))
            .attr("stop-color", d => d.scaleAnomaly);

        vis.legend.append("rect")
            .attr("width", 100)
            .attr("height", 10)
            .attr("y", -10)
            .style("fill", "url(#myGradient)");

        vis.legendAxisGroup.call(vis.legendAxis);

        // append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'mapTooltip')

        let m0,
            o0;

        vis.svg.call(
            d3.drag()
                .on("start", function (event) {

                    let lastRotationParams = vis.projection.rotate();
                    m0 = [event.x, event.y];
                    o0 = [-lastRotationParams[0], -lastRotationParams[1]];
                })
                .on("drag", function (event) {
                    if (m0) {
                        let m1 = [event.x, event.y],
                            o1 = [o0[0] + (m0[0] - m1[0]) / 4, o0[1] + (m1[1] - m0[1]) / 4];
                        vis.projection.rotate([-o1[0], -o1[1]]);
                    }

                    // Update the map
                    vis.path = d3.geoPath().projection(vis.projection);
                    d3.selectAll(".country").attr("d", vis.path)
                    d3.selectAll(".graticule").attr("d", vis.path)
                })
        )

        vis.wrangleData()
    }
    wrangleData () {
        let vis = this;
        console.log(vis.mobility_data);

        vis.newdata = d3.flatRollup(vis.mobility_data,
            v=> d3.mean(v, d=> d.grocery_and_pharmacy_percent_change_from_baseline),
            d => d.date,
            d=> d.Country_code,
            d => d.country_region);


        console.log("this is the new data", vis.newdata);

        vis.values = vis.newdata.map(function(row){
            let result = {};
            result[row[2]] =  row[3]
            return {
                result
           };});

        console.log("this is how the values look", vis.values)
        var maxValue = Math.max.apply(null, vis.values);
        var minValue = Math.min.apply(null, vis.values);
        console.log(maxValue) // 266.6
        console.log(minValue) // -97
        vis.colorScale.domain([minValue, maxValue])
        vis.countryInfo = {};
        vis.geoData.objects.countries.geometries.forEach(d => {
            let randomCountryValue = Math.random() * 4
            vis.countryInfo[d.properties.name] = {
                name: d.properties.name,
                value: (randomCountryValue / 4 * 100).toFixed(2)
            }
        })
        console.log("this one is new data", vis.countryInfo)


        vis.updateVis()

    }
    updateVis() {
        let vis = this;


    }

}