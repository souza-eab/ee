
// bounds
var geometry = ee.Geometry.Polygon(
        [[[-74.34040691705002, 5.9630086351511690],
                [-74.34040691705002, -34.09134700746099],
                [-33.64704754205002, -34.09134700746099],
                [-33.64704754205002, 5.9630086351511690]]]);

Map.addLayer(geometry, {}, 'Image_AMZ_', false);

//var image = ee.ImageCollection("projects/ee-seeg-brazil/assets/collection_9/v1/Biomes_BR_tif").filterMetadata('first', 'equals', '1').mosaic();
//Map.addLayer(image, {}, 'Image_AMZ_', false)

// Add Asset Biomes_BR (Source: IBGE && INCRA, 2019) 
var BiomesBR = ee.FeatureCollection('projects/ee-seeg-brazil/assets/collection_9/v1/Biomes_BR')//.filter('CD_LEGENDA == "AMAZONIA"');


var geom = BiomesBR.geometry().bounds();
// var geometry = geometry22;
Map.addLayer(geom, {}, 'Image_AMZ_', false)

// variaveis dinamicas
var areasProtegidas_porAno = ee.ImageCollection('projects/ee-seeg-brazil/assets/collection_10/v1/areas-protegidas-por-ano-2021')
  .toBands();

var oldBands_ap = areasProtegidas_porAno.bandNames();
var newBands_ap = oldBands_ap.map(function(bandName){
  return ee.String(bandName).split('_').get(0);
});

areasProtegidas_porAno = areasProtegidas_porAno.select(oldBands_ap,newBands_ap);

var transitions = ee.Image('projects/mapbiomas-workspace/SEEG/2023/c10/3_1_SEEG_Transitions_stacked');

// band: transicao_1992_1993
print('transitions',transitions);

// variaveis estaticas:

//Map.addLayer(cos, {}, 'COS-0.09');

// var cos = ee.Image('projects/mapbiomas-workspace/SEEG/2022/SOC/Embrapa/Embrapa_BR_SOCstock_0_30cm_t_ha');

var municipios = ee.Image('projects/ee-seeg-brazil/assets/collection_9/v1/mun_BR')
  .multiply(10);
var biomes = ee.Image('projects/ee-seeg-brazil/assets/collection_9/v1/Biomes_BR_tif');

var territory = municipios.add(biomes);

// Map.addLayer(territory.randomVisualizer(),{},'territory');

var emiss_removal_years = ee.ImageCollection('projects/mapbiomas-workspace/SEEG/2023/c10/Spatial/SEEG_BR_v_0_0_0').mosaic();

transitions.bandNames()
.evaluate(function(bandnames){
  
  print(bandnames);
  
  bandnames
  //.slice(-2)//cortar a lista
  .forEach(function(band){
    
    var split = band.split('_');
    
    var year_end = split[2];
    
    
    var emiss_removal_year = emiss_removal_years.select('emissions_removals_'+year_end)
      .add(100)
      .multiply(100)
      .int();

    var ap_year = areasProtegidas_porAno.select('ap' + year_end).unmask(0);
    
    var years_transition = band.replace('transicao_','');
    
    var classe = transitions.select(band)
      .multiply(100000)
      .add(emiss_removal_year);
    
    // print(band,classe);
    // Map.addLayer(classe.randomVisualizer(),{},band);
    
    var territory_year = territory.multiply(10)
      .add(ap_year);
    
    var reduce = ee.Image.pixelArea().divide(10000).reproject({crs:'EPSG:4326',scale:30})
      .addBands(classe)
      .addBands(territory_year)
      .reduceRegion({
        reducer:ee.Reducer.sum().group(1,'territory').group(1,'classe'),
        geometry:geometry,
        scale:30,
        // crs:,
        // crsTransform:,
        // bestEffort:,
        maxPixels:1e12,
        // tileScale:
      });
      
    reduce = ee.List(ee.Dictionary(reduce).get('groups'));
      
    print('reduce',reduce);
      
    var features = reduce.map(function(obj_n0){
      obj_n0 = ee.Dictionary(obj_n0);
      
      var groups = ee.List(obj_n0.get('groups'));
      
      return ee.FeatureCollection(groups.map(function(obj_n1){
          
          obj_n1 = ee.Dictionary(obj_n1);

          var territory  = ee.Number(obj_n1.get('territory'));
          
          var ap_post = territory.mod(10);

          territory = territory.divide(10).int();
          var biome = territory.mod(10);
          var municipio = territory.divide(10).int();
          
          var classe = ee.Number(obj_n0.get('classe'));
          
          var emiss_removal = classe.mod(100000)
            .divide(100)
            .subtract(100);
            
          var transition = classe.divide(100000).int();

          var transition_prev = transition.divide(10000).int();
          var transition_post = transition.mod(10000);
          
          var area = obj_n1.getNumber('sum');
          
          return ee.Feature(null)
            .set({
              'emiss_removal':emiss_removal,
              'emiss_removal_ha':emiss_removal.multiply(area),
              'Area_ha':area,
              'biome':biome,
              'municipio':municipio,
              'transition':transition,
              'transition_prev':transition_prev,
              'transition_post':transition_post,
              'years_transition':years_transition,
              'ap_post':ap_post,
            });
      }));
      
    });
    
  
    var table = ee.FeatureCollection(features).flatten();
  
    print('table',table.limit(10));
  
     var description = 'SEEG_Emissions-stats-c10_v0_0_0_'+years_transition;
    // --- Version
    var version = 'c10_v_0_0-0';
  
    Export.table.toDrive({
      collection:table,
      description:description,
      folder:'SEEG_Emission_Removals'+'_Spatial_'+version,
      fileNamePrefix:description,
      fileFormat:'CSV', 
    });
  
  });
});
