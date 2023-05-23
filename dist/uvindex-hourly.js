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


const SCALE_COLORS = ['#6c49C9','#d90011','#f95901', '#f7e401','#299501'];
const SCALE_WORDS = ["EXTREME","V HIGH","HIGH","MOD","LOW"];
const SCALE_THRESHOLDS = [10,7,5,2,0];

function uv_index_color(uv_index) {
  return SCALE_COLORS[SCALE_THRESHOLDS.findIndex(t => t <= uv_index)];
}

class UvindexHourly extends LitElement {
  static properties = {
    _state: {state: true},
    _config: {state: true}
};
  
  chartConfig() {
    return {
          plugins: [ChartDataLabels],
          type: 'bar',
          data: {
            datasets: [{
              data: [],
              backgroundColor: [],
              barPercentage: 1,
              categoryPercentage: 1,
              fill: 'origin',
              datalabels: {
                display: false
              }
            },
            {
              data: [{x:1, y: 12},{x:1, y: 10},{x:1, y: 7},{x:1, y: 5},{x:1, y: 2}],
              backgroundColor: SCALE_COLORS,
              barThickness: 2,
              xAxisID: 'xScale'
            }]
          },
          options: {
            maintainAspectRatio: false,
            layout: {
                padding: {
                  top: 0,
                  bottom: -10,
                  left: 0,
                  right: 0
                }
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
                  keyFigures: {
                    type: 'label',
                    content: [],
                    xValue: 0,
                    yValue: 12,
                    position: {x: 'end', y: 'start'},
                    textAlign: 'right',
                    color: "#C8CACE",
                    padding: 0,
                  },
                  now: {
                    type: 'line',
                    borderColor: "#9999FF",
                    borderWidth: 3,
                    scaleID: 'x',
                    value: () => new Date()
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
                  unit: 'hour',
                  displayFormats: {
                    second: 'ha'
                  }
                },
                grid: {
                  display: false
                },
                ticks: {
                  maxRotation: 0,
                  minRotation: 0,
                  padding: 0,
                }
              },
              y: {
                max: 12,
                title: {
                  text: "UV INDEX",
                  display: true,
                  padding: 0
                },
                ticks: {
                  padding: 0
                },
                beginAtZero: true,
                grid: {
                  display: false
                }
              },
              xScale: {
                offset: false,
              }
            }
          }
        }
  }
  
  hydrateChartConfig(chartConfig) {
    const forecast = this._state.attributes['forecast'];
    const data_points = forecast.map(f => {return {x: f.datetime, y: f.uv_index}});
    const min_time = forecast[0].datetime;
    const max_time = forecast[forecast.length-1].datetime;
    const background_colors = forecast.map(f => uv_index_color(f.uv_index));
    chartConfig.data.datasets[0].data.length = 0;
    chartConfig.data.datasets[0].data.push(...data_points);
    chartConfig.data.datasets[0].backgroundColor.length = 0;
    chartConfig.data.datasets[0].backgroundColor.push(...background_colors);
    if(this.offsetWidth>300) {
      chartConfig.data.datasets[1].datalabels = {
        formatter: (v,c) => SCALE_WORDS[c.dataIndex],
        color: SCALE_COLORS,
        align: '45',
        anchor: 'end'
      };
      chartConfig.options.scales.x.title.display = true;
      chartConfig.options.scales.y.title.display = true;
    } else {
      chartConfig.data.datasets[1].datalabels = {
        display: false
      };
      chartConfig.options.scales.x.title.display = false;
      chartConfig.options.scales.y.title.display = false;
    }
    let forecastNow = forecast.find(f => (new Date(f.datetime)).getTime()>=hourStart().getTime());
    let UVNow = forecastNow === undefined ? 0 : forecastNow.uv_index;
    chartConfig.options.plugins.annotation.annotations.keyFigures.xValue = max_time;
    chartConfig.options.plugins.annotation.annotations.keyFigures.content = ['DAY MAX: '+ this._state.state, 'NOW: '+ UVNow];
    chartConfig.options.plugins.annotation.annotations.now.display = new Date().getTime() > new Date(min_time).getTime() && new Date().getTime() < new Date(max_time).getTime();
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
      <ha-card style="height:100%">
        <div style="height:100%;box-sizing: border-box;" class="card-content">
          <canvas id="uv-index"></canvas>
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
