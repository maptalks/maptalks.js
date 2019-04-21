var gui = new dat.GUI( { width: 250 } );
var aperture = 16; //光圈
var speed = '1/125'; //快门速度
var iso = 100; //iso感光度
function initGUI() {

    var Config = function() {
        this.roughnessFactor = MatUNIFORMS['roughnessFactor'];
        //lightColorIntensity
        this.lightColorIntensityX = UNIFORMS['lightColorIntensity'][0];
        this.lightColorIntensityY = UNIFORMS['lightColorIntensity'][1];
        this.lightColorIntensityZ = UNIFORMS['lightColorIntensity'][2];
        this.lightColorIntensityW = UNIFORMS['lightColorIntensity'][3];
        //sun
        this.sunX = UNIFORMS['sun'][0];
        this.sunY = UNIFORMS['sun'][0];
        this.sunZ = UNIFORMS['sun'][0];
        this.sunW = UNIFORMS['sun'][0];
        //lightDirection
        this.lightDirectionX = UNIFORMS['lightDirection'][0];
        this.lightDirectionY = UNIFORMS['lightDirection'][1];
        this.lightDirectionZ = UNIFORMS['lightDirection'][2];
        //
        this.iblLuminance = UNIFORMS['iblLuminance'];
        this.aperture = aperture;
        this.speed = speed;
        this.iso = iso;
    };
    var options = new Config();
    var roughnessFactorController = gui.add( options, "roughnessFactor", 0, 1);
    roughnessFactorController.onChange(function(value){
        changeMaterialUniforms('roughnessFactor', value);
    });
    //lightColorIntensity
    var lightColorIntensityController = gui.addFolder('lightColorIntensity');
    var lightColorIntensityControllerX = lightColorIntensityController.add(options, 'lightColorIntensityX', 0, 1);
    lightColorIntensityControllerX.onChange(function(value){
        UNIFORMS['lightColorIntensity'][0] = value;
    });
    var lightColorIntensityControllerY = lightColorIntensityController.add(options, 'lightColorIntensityY', 0, 1);
    lightColorIntensityControllerY.onChange(function(value){
        UNIFORMS['lightColorIntensity'][1] = value;
    });
    var lightColorIntensityControllerZ = lightColorIntensityController.add(options, 'lightColorIntensityZ', 0, 1);
    lightColorIntensityControllerZ.onChange(function(value){
        UNIFORMS['lightColorIntensity'][2] = value;
    });
    var lightColorIntensityControllerW = lightColorIntensityController.add(options, 'lightColorIntensityW', 0, 50000);
    lightColorIntensityControllerW.onChange(function(value){
        UNIFORMS['lightColorIntensity'][3] = value;
    });
    //sun
    var sunController = gui.addFolder('sun');
    var sunControllerX = sunController.add(options, 'sunX');
    sunControllerX.onChange(function(value){
        UNIFORMS['sun'][0] = value;
    });
    var sunControllerY = sunController.add(options, 'sunY');
    sunControllerY.onChange(function(value){
        UNIFORMS['sun'][1] = value;
    });
    var sunControllerZ = sunController.add(options, 'sunZ');
    sunControllerZ.onChange(function(value){
        UNIFORMS['sun'][2] = value;
    });
    var sunControllerW = sunController.add(options, 'sunW', -1, 1);
    sunControllerW.onChange(function(value){
        UNIFORMS['sun'][3] = value;
    });
    //lightDirection
    var lightDirectionController = gui.addFolder('lightDirection');
    var lightDirectionControllerX = lightDirectionController.add(options, 'lightDirectionX',-100, 100);
    lightDirectionControllerX.onChange(function(value){
        UNIFORMS['lightDirection'][0] = value;
    });
    var lightDirectionControllerY = lightDirectionController.add(options, 'lightDirectionY', -100, 100);
    lightDirectionControllerY.onChange(function(value){
        UNIFORMS['lightDirection'][1] = value;
    });
    var lightDirectionControllerZ = lightDirectionController.add(options, 'lightDirectionZ', -100, 100);
    lightDirectionControllerZ.onChange(function(value){
        UNIFORMS['lightDirection'][2] = value;
    });
    //iblLuminance
    var iblLuminanceController = gui.add(options, 'iblLuminance', 0, 30000);
    iblLuminanceController.onChange(function(value){
        UNIFORMS['iblLuminance'] = value;
    });
    //exposure
    var exposureController = gui.addFolder('exposure');
    var apertureController = exposureController.add(options, 'aperture', [1.0, 1.2, 1.4, 1.8, 2, 2.5, 2.8, 3.2, 4, 4.8, 5.6, 6.7, 8, 9.5, 11, 13, 16, 18, 22, 27, 32]);
    apertureController.onChange(function(value){
        aperture = value;
        updateEV100();
    });
    var speedController = exposureController.add(options, 'speed', ['1/4000', '1/2000', '1/1000', '1/500', '1/250', '1/125', '1/60', '1/30', '1/15', '1/8', '1/4', '1/2', '1', '2', '4']);
    speedController.onChange(function(value){
        var values = value.split('/');
        speed = Number(values[0]) / Number(values[1]);
        updateEV100();
    });
    var isoController = exposureController.add(options, 'iso', [ 100.0, 125.0, 160.0, 200.0, 250.0, 320.0, 400.0, 500.0, 640.0, 800.0, 1000.0, 1250.0, 1600.0, 2000.0, 2500.0, 3200.0, 4000.0, 5000.0, 6400.0]);
    isoController.onChange(function(value){
        iso = value;
        updateEV100();
    });
}

function updateEV100() {
    UNIFORMS['ev100'] = computeEV100(aperture, speed, iso);
    UNIFORMS['exposure'] = EV100toExposure(UNIFORMS['ev100']);
}
