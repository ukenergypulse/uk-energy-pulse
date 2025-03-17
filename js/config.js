export const config = {
    // API endpoints
    generationUrl: 'https://data.elexon.co.uk/bmrs/api/v1/generation/outturn/summary?includeNegativeGeneration=true&format=json',
    colors: {
        'NUCLEAR': 'lightgrey',
        'BIOMASS': 'peru',
        'PS': 'pink',
        'IMPORTS': 'orchid',
        'NPSHYD': 'steelblue',
        'OTHER': 'yellow',
        'WIND': 'limegreen',
        'SOLAR': 'orange',
        'GAS': 'cornflowerblue',
        // Interconnector colors
        'INTFR': 'red',
        'INTIRL': 'green',
        'INTNED': 'purple',
        'INTEW': 'blue',
        'INTELEC': 'brown',
        'INTNEM': 'darkblue',
        'INTVKL': 'darkgreen'
    }
};
