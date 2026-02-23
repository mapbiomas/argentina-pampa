/**
 * Script: 002_Extraer_puntos_estables
 */

var bioma = "PAMPAARGENTINA";
var versao = 'v1';
var nSamples = 2000;
var coleccion = 5;
var coleccion_arg = 2;
var carpetaDrive = 'Shapes_puntos_Pampa_c' + coleccion;
var cantyears = '5y';

// Configurar sufijo según el periodo
var sufix = '85_89'; 
// var sufix = '15_23';
// var sufix = '05_14';
// var sufix = '95_04'; 
// var sufix = '85_94';

// Rutas de entrada y salida
var dirsamples_path = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-' + coleccion_arg + '/GENERAL/SAMPLES/STABLE/PAMPA/Pampa_muestras_estables_Argentina_C' + coleccion_arg + sufix + versao;
var dirsamples = ee.Image(dirsamples_path);
print('dirsamples', dirsamples);

var dirout = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-' + coleccion_arg + '/GENERAL/SAMPLES/STABLE/PAMPA/';
var regioesCollection = ee.FeatureCollection('projects/MapBiomas_Pampa/ANCILLARY_DATA/C3/ZonasPampa_ARG_C3_CONbuffer');

print(regioesCollection);

var palette = require('users/mapbiomas/modules:Palettes.js').get('classification7');
var vis = {
    'bands': ['reference'],
    'min': 0,
    'max': 63,
    'palette': palette
};

Map.addLayer(dirsamples, vis, 'Classes persistentes ' + sufix, true);

// Función para extraer muestras por región
var getTrainingSamples = function(feature) {
    var regiao = feature.get('idZona');
    
    // Definir número de muestras por clase (aquí todas iguales, se puede personalizar)
    var num_train_03 = nSamples;
    var num_train_04 = nSamples;
    var num_train_09 = nSamples;
    var num_train_11 = nSamples;
    var num_train_12 = nSamples;
    var num_train_15 = nSamples;
    var num_train_18 = nSamples;
    var num_train_22 = nSamples;
    var num_train_33 = nSamples;
    var num_train_36 = nSamples;

    var clippedGrid = ee.Feature(feature).geometry();
    var referenceMap = dirsamples.clip(clippedGrid);

    var training = referenceMap.stratifiedSample({
        scale: 30,
        classBand: 'reference',
        numPoints: 0,
        region: feature.geometry(),
        classValues: [3, 4, 9, 11, 12, 15, 18, 22, 33, 36],
        classPoints: [
            num_train_03, num_train_04, num_train_09, num_train_11, 
            num_train_12, num_train_15, num_train_18, num_train_22, 
            num_train_33, num_train_36
        ],
        seed: 1,
        geometries: true
    });

    return training.map(function(feat) {
        return feat.set({'idZona': regiao});
    });
};

var mySamples = regioesCollection.map(getTrainingSamples).flatten();
Map.addLayer(mySamples, {}, 'Muestras');

print(mySamples.filterMetadata('reference', 'equals', 3)
    .filterMetadata('idZona', 'equals', '1')
    .size());

// Exportar a Asset
Export.table.toAsset(mySamples,
    'samples_C' + coleccion + '_' + bioma + '_' + sufix + '_' + versao,
    dirout + 'samples_C' + coleccion + '_' + bioma + '_' + sufix + '_' + versao
);

// Exportar a Drive (Shapefile)
Export.table.toDrive({
    collection: mySamples,
    description: 'DRIVE_Puntos_C' + coleccion + '_' + bioma + '_' + sufix + '_' + versao,
    folder: carpetaDrive,
    fileNamePrefix: cantyears + '_Puntos_C' + coleccion + '_' + bioma + '_' + sufix + '_' + versao,
    fileFormat: 'SHP'
});