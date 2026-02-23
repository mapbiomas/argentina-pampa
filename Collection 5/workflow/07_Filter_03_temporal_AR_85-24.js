/**
 * Script: 007_Filtro_03_temporal_AR_85-24
 */
var version = '6';
var col = '5';
var years = '1985-2024';
var col_arg = '2';

var dirout = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-' + col_arg + '/GENERAL/CLASSIFICATION/FILTERS/PAMPA/classification_c' + col + '_filtros/';
var versionIn = 'col' + col + '-v' + version + '-esp-' + years + '-mosaic';
var versionOut = 'col' + col + '-v' + version + '-temPas-' + years + '-mosaic';

var image_in = ee.Image(dirout + versionIn);

// Definición de funciones de enmascarado temporal (Kernels temporales)

// Ventana de 3 años (t-1, t, t+1) - Corrige valor central si es diferente a los extremos iguales
var mask3 = function(valor, ano, imagem) {
    var mask = imagem.select('classification_' + (parseInt(ano) - 1)).eq(valor)
        .and(imagem.select('classification_' + ano).neq(valor))
        .and(imagem.select('classification_' + (parseInt(ano) + 1)).eq(valor));
    var muda_img = imagem.select('classification_' + ano).mask(mask.eq(1)).where(mask.eq(1), valor);
    return imagem.select('classification_' + ano).blend(muda_img);
};

// Ventana de 4 años y 5 años (Lógica similar extendida)
var mask4a = function(valor, ano, imagem) {
    var mask = imagem.select('classification_' + (parseInt(ano) - 1)).eq(valor)
        .and(imagem.select('classification_' + ano).neq(valor))
        .and(imagem.select('classification_' + (parseInt(ano) + 1)).neq(valor))
        .and(imagem.select('classification_' + (parseInt(ano) + 2)).eq(valor));
    // Aplica corrección a t y t+1
    var muda_img = imagem.select('classification_' + ano).mask(mask.eq(1)).where(mask.eq(1), valor);
    var muda_img1 = imagem.select('classification_' + (parseInt(ano) + 1)).mask(mask.eq(1)).where(mask.eq(1), valor);
    return imagem.select('classification_' + ano).blend(muda_img).blend(muda_img1);
};

// ... (Otras funciones mask4b, mask5 siguen la misma lógica con diferentes patrones)

// Aplicación de Filtros en Cascada
var filtered = image_in;

// Orden de ejecución por clase (prioridad)
var ordem_exec = [33, 22, 3, 4, 6, 11, 66, 77, 9, 48, 36, 19, 12];
var anos3 = ['1986', '1987', ... , '2023']; // Rango intermedio válido

// Función para aplicar ventana de 3 años a una clase específica
var window3years = function(imagem, valor) {
    var img_out = imagem.select('classification_1985');
    // Iterar años intermedios
    // Nota: simplificado, se debe iterar y reconstruir la imagen banda por banda
    // ...
    return img_out; 
};

// Ejecución del filtrado
for (var i_class = 0; i_class < ordem_exec.length; i_class++) {
    var id_class = ordem_exec[i_class];
    // filtered = window3years(filtered, id_class); // Aplicar lógica
}

// Exportar
Export.image.toAsset({
    'image': filtered,
    'description': versionOut,
    'assetId': dirout + versionOut,
    'pyramidingPolicy': {'.default': 'mode'},
    'region': ee.FeatureCollection('projects/MapBiomas_Pampa/ANCILLARY_DATA/C3/ZonasPampa_ARG_C3_CONbuffer').geometry(),
    'scale': 30,
    'maxPixels': 1e13
});