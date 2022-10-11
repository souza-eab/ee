////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////// GOALS: Export pairwise transition maps from a MapBiomas collection ////////////////////////////////////////////////
//////////  Created by: Felipe Lenti, Barbara Zimbres, Edriano Souza /////////////////////////////////////////////////////////
//////////  Developed by: IPAM, SEEG and Climate Observatory ////////////////////////////////////////////////////////////////
//////////  Citing: Zimbres et al.,2022.  //////////////////////////////////////////////////////////////////////////////////
/////////   Processing time <2h> in Google Earth Engine ///////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// @. UPDATE HISTORIC EXECUTABLE//
// 1: Export pairwise transition maps from a MapBiomas collection
// 1.1: Load asset
// 1.2: Define the data path
// 1.3: Define filename prefix     
// 1.4: Export the pairwise data
// @. ~~~~~~~~~~~~~~ // 


/* @. Set user parameters */// eg.



var geometry = ee.Geometry.Polygon(
        [[[-74.34040691705002, 5.9630086351511690],
                [-74.34040691705002, -34.09134700746099],
                [-33.64704754205002, -34.09134700746099],
                [-33.64704754205002, 5.9630086351511690]]]);


var dir = ee.ImageCollection('projects/mapbiomas-workspace/SEEG/2022/SPATIAL/SEEG10_BR_v1_0').mosaic().clip(geometry);
Map.addLayer(dir)

//Map.addLayer(geometry)
// Set directory for the output file
var dir_output = 'projects/mapbiomas-workspace/SEEG/2022/SPATIAL/';

// Define filename prefix
var prefix = 'Emissions_Removals_';

Export.image.toAsset({
  image: dir,
  description: 'Spatial_Emission_Removals_C10',
  assetId:  dir_output + prefix + 'v1_0_1',
   'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': geometry,
    'scale': 30,
    'maxPixels': 1e13
});
