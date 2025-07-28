// import React from 'react';
// import { Chart, ThemeProvider } from '@whysorush/dynamic-chart-component';
import Chart from "./Chart";
import { ThemeProvider } from "../context/ThemeContext";
import React from 'react';

const data = [
  {
    "label": "Category A",
    "value": 61
  },
  {
    "label": "Category B",
    "value": 85
  },
  {
    "label": "Category C",
    "value": 66
  },
  {
    "label": "Category D",
    "value": 51
  },
  {
    "label": "Category E",
    "value": 93
  }
];
const config = {
  "width": 700,
  "height": 400,
  "margin": {
    "top": 20,
    "right": 20,
    "bottom": 40,
    "left": 40
  },
  "colors": [
    "rgba(0, 201, 255, 0.8)",
    "rgba(146, 254, 157, 0.8)",
    "rgba(255, 107, 107, 0.8)",
    "rgba(255, 206, 84, 0.8)",
    "rgba(159, 122, 234, 0.8)",
    "rgba(255, 159, 243, 0.8)"
  ],
  "showGrid": true,
  "showLegend": true,
  "showTooltip": true,
  "animate": true,
  "gradient": true,
  "gradientColors": {
    "start": "rgba(0, 201, 255, 0.85)",
    "end": "rgba(146, 254, 157, 0.85)"
  },
  "fontFamily": "Figtree",
  "fontSize": 14,
  "borderRadius": 4,
  "strokeWidth": 3
};

export default function GeneratedChart() {
  return (
    <Chart
      type={"donut"}
      data={data}
      config={config} kpiTitle="wwwww"
      summary={"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
      showSummaryTable={false}
      displayOptions={undefined}
    />
  );
}
