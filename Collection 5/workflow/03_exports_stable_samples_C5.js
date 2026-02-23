/**
 * Script: 003_exporta_muestras_estables_C5
 */
var bioma = "PAMPAARGENTINA";
var versao = 'v1';
var version_exp = 'v2';
var col = 5;
var coleccion_arg = 2;
var carpetaDrive = 'Shapes_puntos_Pampa_c' + col;
var cantyears = '10y';
var version_mosaic = '1';

// Configuración de años y sufijo (Seleccionar uno)
var sufix = '85_94'; 
var anos = [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994];

// Otros periodos comentados para referencia:
// var sufix = '15_23'; var anos = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
// var sufix = '05_14'; var anos = [2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014];
// var sufix = '95_04'; var anos = [1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004];

var pts = ee.FeatureCollection('projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-' + coleccion_arg + '/GENERAL/SAMPLES/STABLE/PAMPA/samples_C' + col + '_' + bioma + '_' + sufix + '_' + versao);

var dirout = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-' + coleccion_arg + '/GENERAL/SAMPLES/STABLE/PAMPA/YEAR/';
var col4 = ee.Image('projects/mapbiomas-public/assets/pampa/collection4/mapbiomas_pampa_collection4_integration_v1');

var dirasset = 'projects/nexgenmap/MapBiomas2/LANDSAT/PAMPA/mosaics';
var dirasset7 = 'projects/nexgenmap/MapBiomas2/LANDSAT/PAMPA/mosaics-landsat-7';
var regions = ee.FeatureCollection('projects/MapBiomas_Pampa/ANCILLARY_DATA/C3/ZonasPampa_ARG_C3_CONbuffer');
var regions_raster = ee.Image('projects/MapBiomas_Pampa/ANCILLARY_DATA/C3/ZonasPampa_ARG_C3_sinbuffer_raster');
var msk_regions = regions_raster.neq(22);

var limite = regions.geometry();
Map.addLayer(regions, {}, 'Regiones', false);
print('Puntos total:', pts.size());

// Definición de Nombres de Bandas
var bandNames = ee.List([
    'evi2_amp', 'gv_amp', 'ndfi_amp', 'ndvi_amp', 'ndwi_amp', 'soil_amp', 'wefi_amp',
    'blue_median', 'blue_median_dry', 'blue_median_wet',
    'cai_median', 'cai_median_dry', 'cloud_median',
    'evi2_median', 'evi2_median_dry', 'evi2_median_wet',
    'gcvi_median', 'gcvi_median_dry', 'gcvi_median_wet',
    'green_median', 'green_median_dry', 'green_median_wet', 'green_median_texture',
    'gv_median', 'gvs_median', 'gvs_median_dry', 'gvs_median_wet',
    'hallcover_median', 'latitude', 'longitude', 'prob_inundable',
    'rh0', 'rh1', 'rh5', 'rh10', 'rh95', 'rh96', 'rh99', 'rh100', 'quality_flag', 'num_detectedmodes', 'borde',
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
    'green_stdDev', 'gv_stdDev', 'gvs_stdDev', 'hallcover_stdDev',
    'ndfi_stdDev', 'ndvi_stdDev', 'ndwi_stdDev', 'nir_stdDev', 'red_stdDev',
    'savi_stdDev', 'sefi_stdDev', 'shade_stdDev', 'soil_stdDev',
    'swir1_stdDev', 'swir2_stdDev', 'wefi_stdDev', 'slope'
]);

// Variables Auxiliares
var terrain = ee.Image("JAXA/ALOS/AW3D30_V1_1").select("AVE");
var slope = ee.Terrain.slope(terrain);
var square = ee.Kernel.square({radius: 5});
var regions_name = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];

var mask_inund = ee.ImageCollection('users/intahumedales/Determinacion_probabilistica').mosaic();
mask_inund = mask_inund.updateMask(msk_regions);
mask_inund = mask_inund.multiply(1000).toInt16();

var ll = ee.Image.pixelLonLat().updateMask(msk_regions);
var long = ll.select('longitude').multiply(-1).multiply(100).toInt16();
var lati = ll.select('latitude').multiply(-1).multiply(100).toInt16();

// GEDI DATA
var GEDI_2A = ee.ImageCollection("LARSE/GEDI/GEDI02_A_002_MONTHLY").map(function(image) {
    return image.select(['rh0','rh1','rh5', 'rh10', 'rh95','rh96','rh99','rh100', 'quality_flag','num_detectedmodes']);
});
var gedi_rec = GEDI_2A.mosaic().updateMask(msk_regions);
var rh0 = gedi_rec.select('rh0').multiply(1000).toInt16().unmask(9999);
var rh1 = gedi_rec.select('rh1').multiply(1000).toInt16().unmask(9999);
var rh5 = gedi_rec.select('rh5').multiply(1000).toInt16().unmask(9999);
var rh10 = gedi_rec.select('rh10').multiply(1000).toInt16().unmask(9999);
var rh95 = gedi_rec.select('rh95').multiply(1000).toInt16().unmask(9999);
var rh96 = gedi_rec.select('rh96').multiply(1000).toInt16().unmask(9999);
var rh99 = gedi_rec.select('rh99').multiply(1000).toInt16().unmask(9999);
var rh100 = gedi_rec.select('rh100').multiply(1000).toInt16().unmask(9999);
var quality_flag = gedi_rec.select('quality_flag').toInt16().unmask(9999);
var num_detectedmodes = gedi_rec.select('num_detectedmodes').toInt16().unmask(9999);

// Mosaicos
var mosaicos1 = ee.ImageCollection(dirasset)
    .filterMetadata('biome', 'equals', bioma)
    .filterMetadata('version', 'equals', version_mosaic);
var mosaicos2 = ee.ImageCollection(dirasset7)
    .filterMetadata('biome', 'equals', bioma)
    .filterMetadata('version', 'equals', version_mosaic);
var mosaicos = mosaicos1.merge(mosaicos2);

// Iterar por Años
for (var i_ano = 0; i_ano < anos.length; i_ano++) {
    var ano = anos[i_ano];
    var mosaicoTotal = mosaicos.filterMetadata('year', 'equals', ano).mosaic();

    // Calculo de Amplitud de 3 años
    var min3anos, max3anos;
    if (ano == 1985) {
        min3anos = mosaicoTotal.select('ndvi_median_dry');
        max3anos = mosaicoTotal.select('ndvi_median_wet');
    } else if (ano == 1986) {
        var mosaico1ano_antes = mosaicos.filterMetadata('year', 'equals', (ano - 1)).filterBounds(limite).mosaic();
        min3anos = ee.ImageCollection.fromImages([mosaicoTotal.select('ndvi_median_dry'), mosaico1ano_antes.select('ndvi_median_dry')]).min();
        max3anos = ee.ImageCollection.fromImages([mosaicoTotal.select('ndvi_median_wet'), mosaico1ano_antes.select('ndvi_median_wet')]).max();
    } else {
        var mosaico1ano_antes = mosaicos.filterMetadata('year', 'equals', (ano - 1)).filterBounds(limite).mosaic();
        var mosaico2anos_antes = mosaicos.filterMetadata('year', 'equals', (ano - 2)).filterBounds(limite).mosaic();
        min3anos = ee.ImageCollection.fromImages([mosaicoTotal.select('ndvi_median_dry'), mosaico1ano_antes.select('ndvi_median_dry'), mosaico2anos_antes.select('ndvi_median_dry')]).min();
        max3anos = ee.ImageCollection.fromImages([mosaicoTotal.select('ndvi_median_wet'), mosaico1ano_antes.select('ndvi_median_wet'), mosaico2anos_antes.select('ndvi_median_wet')]).max();
    }
    var amp3anos = max3anos.subtract(min3anos).rename('ndvi_amp_3y');

    // Banda de Borde (clases estables anterior)
    var mean3x3_int;
    if (i_ano == 0) {
       var mapa_estable1 = col4.select(['classification_' + ano]);
       var proj = mapa_estable1.projection().atScale(30);
       var mean3x3 = mapa_estable1.focal_mean({radius: 1, units: 'pixels', kernelType: 'square'}).reproject(proj);
       mean3x3_int = mean3x3.select('classification_' + ano).multiply(1000).toInt16();
    } else {
       var mapa_estable1 = col4.select(['classification_' + (ano - 1)]);
       var proj = mapa_estable1.projection().atScale(30);
       var mean3x3 = mapa_estable1.focal_mean({radius: 1, units: 'pixels', kernelType: 'square'}).reproject(proj);
       mean3x3_int = mean3x3.select('classification_' + (ano - 1)).multiply(1000).toInt16();
    }

    // Agregar Bandas
    mosaicoTotal = mosaicoTotal.addBands(amp3anos);
    mosaicoTotal = mosaicoTotal.addBands(long.rename('longitude'));
    mosaicoTotal = mosaicoTotal.addBands(lati.rename('latitude'));
    mosaicoTotal = mosaicoTotal.addBands(slope.int8().updateMask(msk_regions), ['slope']);
    mosaicoTotal = mosaicoTotal.addBands(mask_inund.rename('prob_inundable'));
    mosaicoTotal = mosaicoTotal.addBands(rh0.rename('rh0'));
    mosaicoTotal = mosaicoTotal.addBands(rh1.rename('rh1'));
    mosaicoTotal = mosaicoTotal.addBands(rh5.rename('rh5'));
    mosaicoTotal = mosaicoTotal.addBands(rh10.rename('rh10'));
    mosaicoTotal = mosaicoTotal.addBands(rh95.rename('rh95'));
    mosaicoTotal = mosaicoTotal.addBands(rh96.rename('rh96'));
    mosaicoTotal = mosaicoTotal.addBands(rh99.rename('rh99'));
    mosaicoTotal = mosaicoTotal.addBands(rh100.rename('rh100'));
    mosaicoTotal = mosaicoTotal.addBands(quality_flag.rename('quality_flag'));
    mosaicoTotal = mosaicoTotal.addBands(num_detectedmodes.rename('num_detectedmodes'));
    mosaicoTotal = mosaicoTotal.addBands(mean3x3_int.rename('borde'));

    // Seleccionar bandas finales (usando bandNames definidos previamente)
    // Nota: El script original define bandNamesShort para renombrar, aquí simplifico seleccionando las que existen.
    // mosaicoTotal = mosaicoTotal.select(bandNames); 
    
    // Samplear Regiones
    for (var i_reg = 0; i_reg < regions_name.length; i_reg++) {
        var region = regions_name[i_reg];
        var pts_reg = pts.filterMetadata('idZona', 'equals', region);
        
        var training = mosaicoTotal.sampleRegions({
            'collection': pts_reg,
            'scale': 30,
            'tileScale': 4,
            'geometries': true
        });

        // Exportar
        if (ano == 1990) { // Ejemplo condicional para exportar solo ciertos años o todos
             Export.table.toAsset(training,
                'pontos_C' + col + '_' + version_exp + '_' + cantyears + '_' + ano,
                dirout + 'pontos_C' + col + '_' + cantyears + '_' + version_exp + '_' + ano
             );
        }
    }
}