/**
 * Script: 004_Clasificador_C5
 */
var bioma = 'PAMPAARGENTINA';
var zona = 1; // Identificador de Zona: 1 a 13
var version_clasificacion = '1';
var version_mosaico = '4';
var desvio = 0;
var nSamplesMin = 50;
var nSamplesMax = 2000;
var year_inicio = 1985;
var year_fin = 2024;

// Parámetros de Filtro de Muestras
var umbral_score = -1;
var umbral_IQ = 200;
var umbral_Res = 1;
var umbral_borde = 1;
var umbral_inund = 700;

var nro_arboles = 100; // Random Forest
var mosaico_con_huecos = 0;
var ver_muestras = 0;
var agregar_complementariasC3 = 0;
var agregar_complementariasC4 = 0;

// Cantidad Muestras Complementarias C3/C4
var cant_C3_03 = 1, cant_C3_04 = 1, cant_C3_09 = 1, cant_C3_11 = 1, cant_C3_12 = 1, cant_C3_15 = 1, cant_C3_19 = 1, cant_C3_22 = 1, cant_C3_33 = 1;
var cant_C4_03 = 1, cant_C4_04 = 1, cant_C4_09 = 1, cant_C4_11 = 1, cant_C4_12 = 1, cant_C4_15 = 1, cant_C4_19 = 1, cant_C4_22 = 1, cant_C4_33 = 1;

var id_zona = ee.Number(zona);
var id_zona_st = id_zona.format();

// Rutas
var dirsamples = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/SAMPLES/STABLE/PAMPA/YEAR/estables_scores_IQ_residuosRIR_xzona_';
var zonas = ee.FeatureCollection('projects/MapBiomas_Pampa/ANCILLARY_DATA/C3/ZonasPampa_ARG_C3_CONbuffer');
var output = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/CLASSIFICATION/PRECLASSIFICATION/PAMPA/ClasificacionesC5/';
var id_zona_prop = 'idZona';
var myRegion = zonas.filterMetadata(id_zona_prop, 'equals', id_zona_st);

// Rutas complementarias
var compl_C3 = ee.FeatureCollection('projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/SAMPLES/COMPLEMENT/PAMPA/complementarias_C3_scores_IQ_residuosRIR_xzona');
var compl_C4 = ee.FeatureCollection('projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/SAMPLES/COMPLEMENT/PAMPA/complementarias_C4_scores_IQ_residuosRIR_xzona');
var Muestras_FrutiSilvi = ee.FeatureCollection('projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/GENERAL/SAMPLES/COMPLEMENT/PAMPA/muestras_SilviFrut_BandasNuevas');

var target = 'reference';

// Mosaicos
var mosaics = ee.ImageCollection('projects/nexgenmap/MapBiomas2/LANDSAT/PAMPA/mosaics')
    .merge(ee.ImageCollection('projects/nexgenmap/MapBiomas2/LANDSAT/PAMPA/mosaics-landsat-7'))
    .filterMetadata('version', 'equals', version_mosaico)
    .filterMetadata('biome', 'equals', bioma);

// Definir Bandas (Lista completa extraída del PDF)
var bandNames = ee.List([
    'evi2_amp', 'ndfi_amp', 'gv_amp', 'ndvi_amp', 'ndwi_amp', 'soil_amp', 'wefi_amp',
    'blue_median', 'blue_median_dry', 'blue_median_wet', 'cai_median', 'cai_median_dry',
    'cloud_median', 'evi2_median', 'evi2_median_dry', 'evi2_median_wet',
    'gcvi_median', 'gcvi_median_dry', 'gcvi_median_wet',
    'green_median', 'green_median_dry', 'green_median_wet', 'green_median_texture',
    'gv_median', 'gvs_median', 'gvs_median_dry', 'gvs_median_wet', 'hallcover_median',
    'latitude', 'longitude', 
    'ndfi_median', 'ndfi_median_dry', 'ndfi_median_wet',
    'ndvi_median', 'ndvi_median_dry', 'ndvi_median_wet', 'ndvi_amp_3y',
    'ndwi_median', 'ndwi_median_dry', 'ndwi_median_wet',
    'nir_median', 'nir_median_dry', 'nir_median_wet',
    'npv_median', 'pri_median', 'pri_median_dry', 'pri_median_wet',
    'red_median', 'red_median_dry', 'red_median_wet',
    'savi_median', 'savi_median_dry', 'savi_median_wet',
    'sefi_median', 'sefi_median_dry', 'shade_median', 'soil_median',
    'swir1_median', 'swir1_median_dry', 'swir1_median_wet',
    'swir2_median', 'swir2_median_dry', 'swir2_median_wet',
    'wefi_median', 'wefi_median_wet',
    'blue_min', 'green_min', 'nir_min', 'red_min', 'swir1_min', 'swir2_min',
    'blue_stdDev', 'cai_stdDev', 'cloud_stdDev', 'evi2_stdDev', 'gcvi_stdDev',
    'green_stdDev', 'gv_stdDev', 'gvs_stdDev', 'hallcover_stdDev', 'ndfi_stdDev',
    'ndvi_stdDev', 'ndwi_stdDev', 'nir_stdDev', 'red_stdDev', 'savi_stdDev',
    'sefi_stdDev', 'shade_stdDev', 'soil_stdDev', 'swir1_stdDev', 'swir2_stdDev',
    'wefi_stdDev', 'slope'
]);

var bandNamesShort_muestras = bandNames.add('reference').add('year');

// BUCLE PRINCIPAL
var years = ee.List.sequence(year_inicio, year_fin, 1).getInfo();
var clasificacion_completa = null;
var tabla_output = null;

years.map(function(year) {
    if (year > 1985 && year <= 2024) {
        
        // Coeficientes de Balanceo (Ajustados del OCR)
        var percent_03 = 11.605163 + desvio + year * -0.005496;
        var percent_04 = -47.57073 + desvio + year * 0.023901;
        var percent_06 = 10;
        var percent_09 = 7.700535 + desvio + year * -0.003671;
        var percent_11 = 28.27577 + desvio + year * -0.013439;
        var percent_12 = 193.0540 + desvio + year * -0.085575;
        var percent_15 = 373.5052 + desvio + year * -0.177198;
        var percent_19 = -345.166 + desvio + year * 0.199413;
        var percent_22 = -81.9266 + desvio + year * 0.042093;
        var percent_33 = -0.22805 + desvio + year * 0.000283;
        var percent_36 = -47.5707 + desvio + year * 0.023901;
        var percent_48 = 100;

        // Cargar Muestras del Año
        var balanced = ee.FeatureCollection(dirsamples + year + '_C4')
            .filter(ee.Filter.gte('score', umbral_score))
            .filter(ee.Filter.lte('nro_outliers_IQ', umbral_IQ));
            
        // Filtrado por clase y lógica de balanceo
        var SS_03 = balanced.filterMetadata('reference', 'equals', 3).filter(ee.Filter.eq(id_zona_prop, id_zona_st)).filter(ee.Filter.lt('prob_inu', umbral_inund));
        var SS_04 = balanced.filterMetadata('reference', 'equals', 4).filter(ee.Filter.eq(id_zona_prop, id_zona_st)).filter(ee.Filter.lt('prob_inu', umbral_inund));
        // ... (resto de filtros de clases como en el PDF)
        
        // Calcular número de muestras (n_samples) basado en porcentajes
        var n_samples_03 = ee.Number(nSamplesMax).multiply(percent_03).divide(100).round().int16().max(nSamplesMin).min(nSamplesMax);
        // ... (repetir cálculo para otras clases)

        // Submuestreo aleatorio
        var SS_03_samples = SS_03.randomColumn().sort('random').limit(n_samples_03);
        // ... (repetir para otras clases)
        
        // Unir muestras finales
        var train = SS_03_samples; // .merge(SS_04_samples)...
        
        // Mosaico del Año
        var input_mosaic = mosaics.filterMetadata('year', 'equals', year).filterBounds(myRegion).mosaic();
        
        // Agregar bandas derivadas (Amp 3 años, coords)
        // ... (Lógica de min3anos, max3anos idéntica al script 3)
        
        // Entrenar Random Forest
        var rf_fit = ee.Classifier.smileRandomForest(nro_arboles).train(train, target, bandNames);
        
        // Clasificar
        var clasificacion = input_mosaic.classify(rf_fit)
            .set('year', year)
            .set('zona', id_zona_st)
            .set('version', version_clasificacion);

        // Acumular resultados
        clasificacion_completa = (clasificacion_completa === null) ? clasificacion.rename('classification_' + year) : clasificacion_completa.addBands(clasificacion.rename('classification_' + year));
    }
});

// Exportar Clasificación
if (clasificacion_completa !== null) {
    Export.image.toAsset({
        image: clasificacion_completa.updateMask(myRegion), // usando la máscara raster de zona
        description: 'clasificacion_' + year_inicio + '-' + year_fin + '-' + zona + '-' + version_clasificacion,
        assetId: output + 'clasificacion-' + year_inicio + '-' + year_fin + '-' + zona + '-' + version_clasificacion,
        region: myRegion.geometry(),
        scale: 30,
        maxPixels: 1e13,
        pyramidingPolicy: {'.default': 'mode'}
    });
}