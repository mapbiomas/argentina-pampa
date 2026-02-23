/**
 * Script: 005_Filtro_01_gap_AR_85_24
 */
var version = '6';
var col = '5';
var years = '1985-2024';
var col_arg = '2';

var image = ee.Image('projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-' + col_arg + '/GENERAL/CLASSIFICATION/PRECLASSIFICATION/PAMPA/clasificacion-' + years + '-' + version); // 'sin filtro'
var dirout = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-' + col_arg + '/GENERAL/CLASSIFICATION/FILTERS/PAMPA/classification_c' + col + '_filtros/';
var regioesCollection = ee.FeatureCollection('projects/MapBiomas_Pampa/ANCILLARY_DATA/C3/ZonasPampa_ARG_C3_CONbuffer');
var versionOut = 'col' + col + '-v' + version + '-gap-' + years + '-mosaic';

var bandNames = ee.List([
    'classification_1986', 'classification_1987', 'classification_1988', 'classification_1989', 'classification_1990',
    'classification_1991', 'classification_1992', 'classification_1993', 'classification_1994', 'classification_1995',
    'classification_1996', 'classification_1997', 'classification_1998', 'classification_1999', 'classification_2000',
    'classification_2001', 'classification_2002', 'classification_2003', 'classification_2004', 'classification_2005',
    'classification_2006', 'classification_2007', 'classification_2008', 'classification_2009', 'classification_2010',
    'classification_2011', 'classification_2012', 'classification_2013', 'classification_2014', 'classification_2015',
    'classification_2016', 'classification_2017', 'classification_2018', 'classification_2019', 'classification_2020',
    'classification_2021', 'classification_2022', 'classification_2023', 'classification_2024'
]);

// Filtro Forward (Hacia adelante)
var filtered = bandNames.iterate(function(bandName, previousImage) {
    var currentImage = image.select(ee.String(bandName));
    previousImage = ee.Image(previousImage);
    currentImage = currentImage.unmask(previousImage.select([0]));
    return currentImage.addBands(previousImage);
}, ee.Image(image.select(['classification_1985'])));

filtered = ee.Image(filtered);

// Filtro Backward (Hacia atrás) - Lista invertida
var bandNamesRev = ee.List([
    'classification_2024', 'classification_2023', 'classification_2022', 'classification_2021', 'classification_2020',
    // ... incluir todos los años hasta 1985 en orden inverso
    'classification_1986', 'classification_1985'
]);

// Nota: El PDF tiene la lógica de reversa un poco confusa en el loop, pero la intención es unmask usando el año siguiente
// Implementación estándar de gap fill bidireccional:
var filtered2 = bandNamesRev.iterate(function(bandName, previousImage) {
    var currentImage = filtered.select(ee.String(bandName));
    previousImage = ee.Image(previousImage);
    currentImage = currentImage.unmask(previousImage.select(previousImage.bandNames().length().subtract(1)));
    return previousImage.addBands(currentImage);
}, ee.Image(filtered.select(["classification_2024"])));

filtered2 = ee.Image(filtered2);

// Visualización
var palette = require('users/mapbiomas/modules:Palettes.js').get('classification9');
var vis5 = {'min': 0, 'max': 77, 'palette': palette};
Map.addLayer(image.select('classification_1985'), vis5, 'Original 1985');
Map.addLayer(filtered2.select('classification_1985'), vis5, 'Filtrado 1985');

// Exportar
Export.image.toAsset({
    'image': filtered2,
    'description': versionOut,
    'assetId': dirout + versionOut,
    'pyramidingPolicy': {'.default': 'mode'},
    'region': regioesCollection.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});