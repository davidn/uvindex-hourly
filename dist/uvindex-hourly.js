import "https://cdn.jsdelivr.net/npm/chart.js@^4";
import "https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js";
import "https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"
import "https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3"
import {LitElement, html} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';

function hourStart() {
  let d = new Date();
  d.setMilliseconds(0);
  d.setSeconds(0);
  d.setMinutes(0);
  return d;
}

class UvindexHourly extends LitElement {
  static properties = {
    _state: {state: true},
    _config: {state: true}
};
  
  chartConfig() {
    let scaleColors = ['#6c49C9','#d90011','#f95901', '#f7e401','#299501'];
    let scaleWords = ["EXTREME","V HIGH","HIGH","MOD","LOW"];
    return {
          plugins: [ChartDataLabels],
          type: 'bar',
          data: {
            datasets: [{
              data: [],
              backgroundColor: [],
              barPercentage: 3,
              categoryPercentage: 1,
              fill: 'origin',
              datalabels: {
                display: false
              }
            },
            {
              data: [],
              backgroundColor: scaleColors,
              barPercentage: 2,
              datalabels: {
                formatter: (v,c) => scaleWords[c.dataIndex],
                color: scaleColors,
                align: '45',
                anchor: 'end'
              }
            },
            {
              data: [],
              backgroundColor: ["#6666FF"],
              datalabels: {
                display: false
              }
            }]
          },
          options: {
            layout: {
                padding: 0
            },
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                enabled: false
              },
              hover: {
                mode: null
              },
              annotation: {
                annotations: {
                  dailyMax: {
                    type: 'label',
                    content: [],
                    xValue: 0,
                    yValue: 10,
                    position: 'end',
                    color: "#C8CACE"
                  },
                  current: {
                    type: 'label',
                    content: [],
                    xValue: 0,
                    yValue: 7,
                    position: 'end',
                    color: "#C8CACE"
                  }
                }
              }
            },
            animation: {
              duration: 0
            },
            scales: {
              x: {
                title: {
                  text: "LOCAL TIME",
                  display: true,
                  padding: 0
                },
                type: 'time',
                time: {
                  unit: 'second',
                  displayFormats: {
                    second: 'ha'
                  }
                },
                grid: {
                  display: false
                }
              },
              y: {
                title: {
                  text: "UV INDEX",
                  display: true,
                  padding: 0
                },
                beginAtZero: true,
                grid: {
                  display: false
                }
              }
            }
          }
        }
  }
  
  hydrateChartConfig(chartConfig) {
    const forecast = this._state.attributes['forecast'];
    const data_points = forecast.map(f => {return {x: f.datetime, y: f.uv_index}});
    const background_colors = forecast.map(f => f.uv_index >= 11 ? '#6c49C9' : f.uv_index >= 8 ? '#d90011': f.uv_index >= 6 ? '#f95901': f.uv_index >= 3 ? '#f7e401': '#299501');
    chartConfig.data.datasets[0].data.length = 0;
    chartConfig.data.datasets[0].data.push(...data_points);
    chartConfig.data.datasets[0].backgroundColor.length = 0;
    chartConfig.data.datasets[0].backgroundColor.push(...background_colors);
    let zero_x = data_points[0].x;
    chartConfig.data.datasets[1].data.length = 0;
    chartConfig.data.datasets[1].data.push({x:zero_x, y: 12},{x:zero_x, y: 10},{x:zero_x, y: 7},{x:zero_x, y: 5},{x:zero_x, y: 2});
    chartConfig.data.datasets[2].data.length = 0;
    chartConfig.data.datasets[2].data.push({x:hourStart(), y: 12});
    chartConfig.options.plugins.annotation.annotations.dailyMax.xValue = data_points[data_points.length-1].x;
    chartConfig.options.plugins.annotation.annotations.dailyMax.content = ['DAY MAX: '+ this._state.state];
    let forecastNow = forecast.find(f => (new Date(f.datetime)).getTime()>=hourStart().getTime());
    let UVNow = forecastNow === undefined ? 0 : forecastNow.uv_index;
    chartConfig.options.plugins.annotation.annotations.current.xValue = data_points[data_points.length-1].x;
    chartConfig.options.plugins.annotation.annotations.current.content = ['NOW: '+ UVNow];
  }

  set hass(hass) {
    const entityId = this._config.entity;
    this._state = hass.states[entityId];
  }
    
  updated(changedProperties) {
    if (changedProperties.has('_state')) {
      if (this.chart) {
        this.hydrateChartConfig(this.chart);
  	    this.chart.update();
    	} else {
          let chartConfig = this.chartConfig()
          this.hydrateChartConfig(chartConfig);
          this.chart = new Chart(this.shadowRoot.querySelector("canvas"), chartConfig);
      }
    }
  }


  setConfig(config) {
    if (!config.entity) {
      throw new Error("You need to define an entity");
    }
    this._config = config;
  }

  static getStubConfig() {
    return {entity: "sensor.uv_index"}
  }

  getCardSize() {
    return 4;
  }

  render() {
    return html`
      <ha-card header="Hourly UV Index">
        <div style="height:200px;width:300px" class="card-content">
          <canvas style="height:200px;width:300px" id="uv-index"></canvas>
        </div>
      </ha-card>
      `;
  }
  
}

customElements.define("uvindex-hourly", UvindexHourly);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "uvindex-hourly",
  name: "Hourly UV Index Card",
  preview: false,
  description: "Display Hourly UV Index",
});
