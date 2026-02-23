/**
 * Script: 001_genera_clases_estables_10años
 * Fuente: MapBiomas Pampa - Colección 5
 */

var version = '6';
var coleccion_Arg = '2';
var biome = 'PAMPA';
var periodo = 4; // 1, 2, 3 o 4 valores

var dirout = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-' + coleccion_Arg + '/GENERAL/SAMPLES/STABLE/' + biome + '/';
var regioesCollection = ee.FeatureCollection("projects/MapBiomas_Pampa/ANCILLARY_DATA/C3/ZonasPampa_ARG_C3_CONbuffer");

// var limite = regions.filterMetadata('idZona', 'equals', region);
// var geometry = limite.geometry();
// print(regioesCollection);

var assetBiomes = 'projects/mapbiomas-public/assets/pampa/collection4/mapbiomas_pampa_collection4_integration_v1';
var colecao = ee.Image(assetBiomes);

print('input', colecao);

var freq_lim, anos, bandas_anos, sufix;

if (periodo == 1) {
    freq_lim = 10;
    anos = ['1985', '1986', '1987', '1988', '1989', '1990', '1991', '1992', '1993', '1994'];
    bandas_anos = ['classification_1985', 'classification_1986', 'classification_1987', 'classification_1988', 'classification_1989', 'classification_1990', 'classification_1991', 'classification_1992', 'classification_1993', 'classification_1994'];
    sufix = '85_94';
}

if (periodo == 2) {
    freq_lim = 10;
    anos = ['1995', '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004'];
    bandas_anos = ['classification_1995', 'classification_1996', 'classification_1997', 'classification_1998', 'classification_1999', 'classification_2000', 'classification_2001', 'classification_2002', 'classification_2003', 'classification_2004'];
    sufix = '95_04';
}

if (periodo == 3) {
    freq_lim = 10;
    anos = ['2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014'];
    bandas_anos = ['classification_2005', 'classification_2006', 'classification_2007', 'classification_2008', 'classification_2009', 'classification_2010', 'classification_2011', 'classification_2012', 'classification_2013', 'classification_2014'];
    sufix = '05_14';
}

if (periodo == 4) {
    freq_lim = 9;
    anos = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'];
    bandas_anos = ['classification_2015', 'classification_2016', 'classification_2017', 'classification_2018', 'classification_2019', 'classification_2020', 'classification_2021', 'classification_2022', 'classification_2023'];
    sufix = '15_23';
}

var palette = require('users/mapbiomas/modules:Palettes.js').get('classification7');
var vis = {
    'bands': 'classification_2023',
    'min': 0,
    'max': 63,
    'palette': palette
};

Map.addLayer(colecao, vis, 'colecao');

var colList = ee.List([]);

for (var i_ano = 0; i_ano < anos.length; i_ano++) {
    var ano = anos[i_ano];
    var colflor = colecao.select('classification_' + ano).remap(
        [3, 4, 9, 11, 12, 15, 19, 22, 33, 36],
        [3, 4, 9, 11, 12, 15, 19, 22, 33, 36]
    );
    colList = colList.add(colflor.int8());
}

var collection = ee.ImageCollection(colList);

var unique = function(arr) {
    var u = {}, a = [];
    for (var i = 0, l = arr.length; i < l; ++i) {
        if (!u.hasOwnProperty(arr[i])) {
            a.push(arr[i]);
            u[arr[i]] = 1;
        }
    }
    return a;
};

/**
 * REFERENCE MAP
 */
var classFrequency = {
    "3": freq_lim, "4": freq_lim, "9": freq_lim, "11": freq_lim, "12": freq_lim,
    "15": freq_lim, "18": freq_lim, "22": freq_lim, "33": freq_lim, "36": freq_lim
};

var getFrequencyMask = function(collection, classId) {
    var classIdInt = parseInt(classId, 10);
    var maskCollection = collection.map(function(image) {
        return image.eq(classIdInt);
    });
    var frequency = maskCollection.reduce(ee.Reducer.sum());
    var frequencyMask = frequency.gte(classFrequency[classId])
        .multiply(classIdInt)
        .toByte();
    frequencyMask = frequencyMask.mask(frequencyMask.eq(classIdInt));
    return frequencyMask.rename('frequency').set('class_id', classId);
};

// FUNCTION: LOOP for each carta
var lista_image = ee.List([]);

var frequencyMasks = Object.keys(classFrequency).map(function(classId) {
    return getFrequencyMask(collection, classId);
});

frequencyMasks = ee.ImageCollection.fromImages(frequencyMasks);
var referenceMap = frequencyMasks.reduce(ee.Reducer.firstNonNull()); // .clip(pampa) si estuviera definido

referenceMap = referenceMap.mask(referenceMap.neq(27)).rename("reference");

var vis_ref = {
    'bands': ['reference'],
    'min': 0,
    'max': 63,
    'palette': palette
};

Map.addLayer(referenceMap, vis_ref, 'Classes persistentes');

// Export
// referenceMap.set('region_code', region)
Export.image.toAsset({
    "image": referenceMap.toInt8(),
    "description": 'Pampa_muestras_estables_Argentina_C' + coleccion_Arg + sufix + 'v' + version,
    "assetId": dirout + 'Pampa_muestras_estables_Argentina_C' + coleccion_Arg + sufix + 'v' + version,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regioesCollection.geometry() // Asumiendo geometria completa
});

var blank = ee.Image(0).mask(0);
var outline = blank.paint(regioesCollection, 'AA0000', 2);
var visPar = {'palette': '000000', 'opacity': 0.6};
Map.addLayer(outline, visPar, 'Regiao', true);