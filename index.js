//  I used the query tool from the CDC https://wonder.cdc.gov/cancer.html to
//  get the data

//  We call our graphing library from the global window
const d3 = window.d3;

//  After refactoring the data using Vim, I manually write an array containing
//  all the the cancer types to query the data later
const cancerTypeArr = [
  "Brain and Other Nervous System",
  "Breast",
  "Cervix Uteri",
  "Colon and Rectum",
  "Corpus Uteri",
  "Esophagus",
  "Gallbladder",
  "Kidney and Renal Pelvis",
  "Larynx",
  "Leukemias",
  "Liver",
  "Lung and Bronchus",
  "Melanoma of the Skin",
  "Myeloma",
  "Non-Hodgkin Lymphoma",
  "Oral Cavity and Pharynx",
  "Ovary",
  "Pancreas",
  "Prostate",
  "Stomach",
  "Thyroid",
  "Urinary Bladder",
];
let clickedOption = "";

//  Here I set up the base code for D3 to work
//
//  Set up the margin to the graph
const margin = { top: 60, right: 20, bottom: 30, left: 40 },
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

//  Set up the proper scales for the graph appear as a bar graph
const x = d3.scaleBand().range([0, width]).padding(0.1);
const y = d3.scaleLinear().range([height, 0]);

//  Append the SVG to the DOM using D3.
//  D3 works like JQuery in the sense that you can chain actions and methods together.
const svg = d3
  .select("#wrap")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//  Here we set up the title but we update later in the code
const title = svg
  .append("text")
  .attr("x", width / 2)
  .attr("y", -40)
  .attr("text-anchor", "middle")
  .style("font-size", "16px");

//  These axis tell the scales in what directions to go
const xAxis = svg.append("g").attr("transform", "translate(0," + height + ")");
const yAxis = svg.append("g").call(d3.axisLeft(y));

//  This creates our tooltip for later use
const tooltip = d3.select("body").append("div").attr("class", "toolTip");

//  This is where most of the functionality is taking place. This function
//  loads the data onto the graph based on the data loaded in the D3 Queue function
//  in the bottom (1st param), and the name of the of cancer type(2nd param)
function loadByCancerType(
  data,
  cancerTypeStr = "Brain and Other Nervous System"
) {
  //  This returns the specific type of cancer type we're looking for
  //  (on either dataset)
  const arrByType = data.filter((x) => {
    return x["Leading Cancer Sites"] === cancerTypeStr;
  });

  //  Here we set the title. We're automatically starting with mortality rates
  title.text(`Death by Cancer in United States 1999-2018`);

  //  Here we tell D3 what data we want to set for the scales domain
  x.domain(
    arrByType.map(function (d) {
      return d["Year"];
    })
  );
  y.domain([
    0,
    d3.max(arrByType, function (d) {
      return d["Count"];
    }),
  ]);

  //  This appends each bar to the DOM to create the full bar graph.
  //  Each bar is represented by whatever data is used and generated by
  //  the scales and domains we wrote above.
  svg
    .selectAll(".bar")
    .remove()
    .exit()
    .data(arrByType)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", function (d) {
      return x(d["Year"]);
    })
    .attr("width", x.bandwidth())
    .attr("y", function (d) {
      return y(d["Count"]);
    })
    .attr("height", function (d) {
      return height - y(d["Count"]);
    })
    .on("mousemove", function (d) {
      tooltip
        .style("left", d3.event.pageX - 50 + "px")
        .style("top", d3.event.pageY - 70 + "px")
        .style("display", "inline-block")
        .html(d["Count"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    })
    .on("mouseout", function (d) {
      tooltip.style("display", "none");
    });

  //  We finalize the axis calls
  xAxis.call(d3.axisBottom(x));
  yAxis.call(d3.axisLeft(y));
}

//  Here we are just using JS to append multiple elements to the DOM
const listOfCancers = document.createElement("select");

const radioDiv = document.createElement("div");
radioDiv.id = "radioDiv";

const incidenceLabel = document.createElement("label");
const mortalityLabel = document.createElement("label");
radioDiv.appendChild(mortalityLabel);
radioDiv.appendChild(incidenceLabel);

const mortalityRadio = document.createElement("input");
mortalityRadio.type = "radio";
mortalityRadio.name = "im";
mortalityRadio.id = "mortality";
mortalityRadio.value = "mortality";
mortalityRadio.checked = true;

mortalityLabel.appendChild(mortalityRadio);
mortalityLabel.appendChild(document.createTextNode("Mortality"));

const incidenceRadio = document.createElement("input");
incidenceRadio.type = "radio";
incidenceRadio.name = "im";
incidenceRadio.id = "incidence";
incidenceRadio.value = "incidence";

incidenceLabel.appendChild(incidenceRadio);
incidenceLabel.appendChild(document.createTextNode("Incidence"));

//  Here we use the D3 queue method to call the files we need.
//  Inside this function we take care of the event handlers.
d3.queue()
  .defer(d3.csv, "./us-mortality1999-2018.csv")
  .defer(d3.csv, "./us-incidence1999-2018.csv")
  .await(function (error, mortalityData, incidenceData) {
    if (error) throw error;

    document.getElementById("under").appendChild(listOfCancers);
    document.getElementById("under").appendChild(radioDiv);

    let incidenceID = document.getElementById("incidence");
    let mortalityID = document.getElementById("mortality");

    //  This loads the incidence data and changes the title
    incidenceID.addEventListener("click", function (e) {
      resetFile(incidenceData);
      title.text(`Incidence of Cancer in United States 1999-2018`);
    });

    //  This loads the mortality data and changes the title
    mortalityID.addEventListener("click", function (e) {
      resetFile(mortalityData);
      title.text(`Death by Cancer in United States 1999-2018`);
    });

    //  This resets the graph based on the type of cancer chosen. (Event Listener)
    function resetFile(inputData) {
      listOfCancers.addEventListener("change", (e) => {
        let selected = e.target.value;

        loadByCancerType(inputData, selected);
      });

      loadByCancerType(inputData);
    }

    //  This loads mortality data on initial load as said before
    resetFile(mortalityData);

    //  This creates the options for the 'select' element based of the cancer type array
    //  we created in the beginning
    cancerTypeArr.forEach((str) => {
      let option = document.createElement("option");
      let text = document.createTextNode(str);
      option.value = str;
      option.appendChild(text);

      listOfCancers.appendChild(option);
    });
  });