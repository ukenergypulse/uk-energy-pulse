import { config } from './config.js';

// Register the datalabels plugin for all charts (already loaded via CDN)
Chart.register(ChartDataLabels);

// Configure datalabels plugin to be disabled by default (we only want it for the doughnut chart)
Chart.defaults.set('plugins.datalabels', {
    display: false
});

// Fuel type display order
const stackOrder = ['NUCLEAR', 'BIOMASS', 'PS', 'IMPORTS', 'NPSHYD', 'OTHER', 'WIND', 'SOLAR', 'GAS'];
const displayLabels = {
    'NUCLEAR': 'Nuclear',
    'BIOMASS': 'Biomass',
    'PS': 'Pumped Storage',
    'IMPORTS': 'Imports',
    'NPSHYD': 'Hydro',
    'OTHER': 'Other',
    'WIND': 'Wind',
    'SOLAR': 'Solar',
    'GAS': 'Gas',
    // Interconnector labels
    'INTFR': 'France',
    'INTIRL': 'Ireland',
    'INTNED': 'Netherlands',
    'INTEW': 'East-West',
    'INTELEC': 'IFA2',
    'INTNEM': 'North Sea Link',
    'INTVKL': 'Viking Link'
};

// Global chart instances
let historicalChart, currentMixChart, interconnectorChart;

// Helper function to format date for API
function formatDate(date) {
    // Ensure we're working with a Date object and convert to UTC
    const d = new Date(date);
    // Format as YYYY-MM-DDTHH:mm:ssZ (ISO8601 with Z suffix for UTC)
    return d.toISOString().slice(0, 19) + 'Z';
}

// Helper function to format number with units
function formatValue(value) {
    return `${value.toFixed(1)} GW`;
}

// Process generation data
function processGenerationData(data) {
    const processedData = {
        times: [],
        datasets: {
            'NUCLEAR': [],
            'BIOMASS': [],
            'PS': [],
            'IMPORTS': [],
            'NPSHYD': [],
            'OTHER': [],
            'WIND': [],
            'SOLAR': [],
            'GAS': []
        },
        interconnectors: {
            'INTFR': [],  // France
            'INTIRL': [], // Ireland
            'INTNED': [], // Netherlands
            'INTEW': [],  // East-West
            'INTELEC': [], // IFA2
            'INTNEM': [], // North Sea Link
            'INTVKL': []  // Viking Link
        }
    };

    data.forEach(period => {
        const time = new Date(period.startTime);
        processedData.times.push(time);
        
        // Initialize arrays for this time period
        const periodIndex = processedData.times.length - 1;
        
        // Initialize all dataset values to 0
        Object.keys(processedData.datasets).forEach(type => {
            processedData.datasets[type][periodIndex] = 0;
        });

        // Initialize all interconnector values to 0
        Object.keys(processedData.interconnectors).forEach(type => {
            processedData.interconnectors[type][periodIndex] = 0;
        });

        period.data.forEach(item => {
            const gen = item.generation / 1000; // Convert to GW

            if (item.fuelType === 'CCGT' || item.fuelType === 'OCGT') {
                processedData.datasets['GAS'][periodIndex] += gen;
            } else if (item.fuelType.startsWith('INT')) {
                // Store raw interconnector values (both positive and negative)
                if (processedData.interconnectors[item.fuelType]) {
                    processedData.interconnectors[item.fuelType][periodIndex] = gen;
                }
                // Only add positive interconnector values (imports) to the stack
                if (gen > 0) {
                    processedData.datasets['IMPORTS'][periodIndex] += gen;
                }
            } else if (item.fuelType === 'PS') {
                // Only add positive pumped storage values
                if (gen > 0) {
                    processedData.datasets['PS'][periodIndex] = gen;
                }
            } else if (processedData.datasets[item.fuelType]) {
                processedData.datasets[item.fuelType][periodIndex] = gen;
            }
        });
    });

    return processedData;
}

// Initialize charts
function initializeCharts() {
    // Initialize historical chart
    const historicalCtx = document.getElementById('historicalChart').getContext('2d');
    historicalChart = new Chart(historicalCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                point: {
                    radius: 0
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'hour',
                        displayFormats: {
                            hour: 'HH:mm'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Generation (GW)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'UK Electricity Generation - past 24 hours',
                    font: {
                        size: 20,
                        weight: 'bold'
                    },
                    padding: {
                        bottom: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });

    // Initialize current mix chart
    const currentMixCtx = document.getElementById('currentMixChart').getContext('2d');
    currentMixChart = new Chart(currentMixCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [],
                borderWidth: 1,
                cutout: '50%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Current Generation Mix',
                    font: {
                        size: 20,
                        weight: 'bold'
                    },
                    padding: {
                        bottom: 10
                    }
                },
                subtitle: {
                    display: true,
                    text: '',  // Will be updated with timestamp
                    font: {
                        size: 14,
                        style: 'italic'
                    },
                    padding: {
                        bottom: 10
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percentage = ((value / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                            return `${context.label}: ${formatValue(value)} (${percentage}%)`;
                        }
                    }
                },
                datalabels: {
                    color: 'white',
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    anchor: 'center',
                    align: 'center',
                    offset: 0,
                    formatter: function(value, context) {
                        const percentage = ((value / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                        return percentage >= 4 ? `${percentage}%` : '';
                    },
                    display: true
                }
            }
        }
    });

    // Initialize interconnector chart
    const interconnectorCtx = document.getElementById('interconnectorChart').getContext('2d');
    interconnectorChart = new Chart(interconnectorCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                point: {
                    radius: 0
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'hour',
                        displayFormats: {
                            hour: 'HH:mm'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Flow (GW)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value > 0 ? `+${value}` : value;
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Interconnector Flows (+ Import, - Export)'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const flowType = value > 0 ? 'Import' : 'Export';
                            return `${context.dataset.label}: ${formatValue(value)} (${flowType})`;
                        }
                    }
                }
            }
        }
    });
}

// Update historical generation chart
async function updateHistoricalChart() {
    try {
        // Get both generation and solar data
        const now = new Date();
        const from = new Date(now - 24 * 60 * 60 * 1000); // 24 hours ago
        
        // Ensure we don't request future data and convert to UTC
        const endTime = new Date(Math.min(now.getTime(), Date.now()));
        
        const [genResponse, solarResponse] = await Promise.all([
            fetch(config.generationUrl),
            fetch(`/api/solar?start=${formatDate(from)}&end=${formatDate(endTime)}`)
        ]);
        
        if (!genResponse.ok || !solarResponse.ok) {
            throw new Error('Failed to fetch data');
        }

        const [genData, solarData] = await Promise.all([
            genResponse.json(),
            solarResponse.json()
        ]);

        // Process generation data
        const processedData = processGenerationData(genData);

        // Add solar data
        if (solarData && solarData.data) {
            console.log('Solar data processing:', {
                rawData: solarData.data,
                processedTimes: processedData.times.map(t => t.toISOString()),
                beforeSolar: [...processedData.datasets['SOLAR']],
            });

            solarData.data.forEach(([_, timestamp, gen]) => {
                // Convert both timestamps to UTC for comparison
                const solarTime = new Date(timestamp);
                
                // Find matching time in processed data
                const timeIndex = processedData.times.findIndex(t => {
                    // Convert both to UTC before comparing
                    return t.getUTCHours() === solarTime.getUTCHours() && 
                           t.getUTCMinutes() === solarTime.getUTCMinutes() &&
                           t.getUTCDate() === solarTime.getUTCDate();
                });

                if (timeIndex !== -1) {
                    // Convert from MW to GW
                    const generation = Number(gen) / 1000;  // Convert MW to GW
                    if (!isNaN(generation)) {
                        processedData.datasets['SOLAR'][timeIndex] = generation;
                        console.log('Matched solar data:', {
                            solarTime: solarTime.toISOString(),
                            matchedTime: processedData.times[timeIndex].toISOString(),
                            valueMW: gen,
                            valueGW: generation
                        });
                    }
                } else {
                    console.log('No match found for solar time:', solarTime.toISOString());
                }
            });

            console.log('After solar processing:', {
                afterSolar: processedData.datasets['SOLAR'],
                nonZeroCount: processedData.datasets['SOLAR'].filter(v => v > 0).length
            });
        }

        // Update charts
        const interconnectorOrder = ['INTFR', 'INTIRL', 'INTNED', 'INTEW', 'INTELEC', 'INTNEM', 'INTVKL'];

        // Update historical chart
        historicalChart.data = {
            labels: processedData.times,
            datasets: stackOrder.map(fuelType => ({
                label: displayLabels[fuelType],
                data: processedData.datasets[fuelType],
                backgroundColor: config.colors[fuelType],
                borderColor: config.colors[fuelType],
                fill: true,
                borderWidth: 1,
                tension: fuelType === 'SOLAR' ? 0.4 : 0,  // Add smooth line interpolation for solar data
                stepped: fuelType === 'SOLAR' ? false : true  // Ensure lines are not stepped for solar data
            }))
        };

        // Update current mix chart with latest values
        const latestValues = stackOrder.map(fuelType => {
            const values = processedData.datasets[fuelType];
            return values[values.length - 1] || 0;
        });

        // Get the latest timestamp
        const latestTime = processedData.times[processedData.times.length - 1];
        const timeString = latestTime.toLocaleString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        currentMixChart.data = {
            labels: stackOrder.map(fuelType => displayLabels[fuelType]),
            datasets: [{
                data: latestValues,
                backgroundColor: stackOrder.map(fuelType => config.colors[fuelType]),
                borderWidth: 1
            }]
        };

        // Update the subtitle with the timestamp
        currentMixChart.options.plugins.subtitle.text = `Last updated: ${timeString}`;

        // Update interconnector chart
        interconnectorChart.data = {
            labels: processedData.times,
            datasets: interconnectorOrder.map(intType => ({
                label: displayLabels[intType],
                data: processedData.interconnectors[intType],
                borderColor: config.colors[intType],
                fill: false,
                borderWidth: 2,
                tension: 0.1
            }))
        };

        // Update all charts
        historicalChart.update();
        currentMixChart.update();
        interconnectorChart.update();

    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

// Main update function
async function updateCharts() {
    await updateHistoricalChart();
}

// Initialize and start updates
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    updateCharts();
    // Update every 5 minutes
    setInterval(updateCharts, 5 * 60 * 1000);
});
