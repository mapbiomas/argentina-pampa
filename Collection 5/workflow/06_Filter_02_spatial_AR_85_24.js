/**
 * Script: 006_Filtro_02_espacial_AR_85_24
 */
var version = '6';
var col = '5';
var years = '1985-2024';
var col_arg = '2';

var dirout = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-' + col_arg + '/GENERAL/CLASSIFICATION/FILTERS/PAMPA/classification_c' + col + '_filtros/';
var versionIn = 'col' + col + '-v' + version + '-gap-' + years + '-mosaic';
var versionOut = 'col' + col + '-v' + version + '-esp-' + years + '-mosaic';

var class4GAP = ee.Image(dirout + versionIn);
var regioesCollection = ee.FeatureCollection('projects/MapBiomas_Pampa/ANCILLARY_DATA/C3/ZonasPampa_ARG_C3_CONbuffer');

var anos = ['1985','1986', '1987', '1988', '1989', '1990', '1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];

// Inicializar con el primer año
var ano0 = '1985';
var moda_00 = class4GAP.select('classification_' + ano0).focal_mode(1, 'square', 'pixels');
// Máscara basada en conexión (opcional según el PDF)
// moda_00 = moda_00.mask(class4GAP.select('connect_' + ano0).lte(6)); 
var class_outTotal = class4GAP.select('classification_' + ano0).blend(moda_00);

// Loop para el resto de años
for (var i_ano = 1; i_ano < anos.length; i_ano++) {
    var ano = anos[i_ano];
    var moda = class4GAP.select('classification_' + ano).focal_mode(1, 'square', 'pixels');
    // moda = moda.mask(class4GAP.select('connect_' + ano).lte(6));
    var class_out = class4GAP.select('classification_' + ano).blend(moda);
    class_outTotal = class_outTotal.addBands(class_out);
}

print(class_outTotal);

Export.image.toAsset({
    'image': class_outTotal,
    'description': versionOut,
    'assetId': dirout + versionOut,
    'pyramidingPolicy': {'.default': 'mode'},
    'region': regioesCollection.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});