var gui = new dat.GUI( { width: 250 } );
function initGUI() {

    var Config = function() {
        this.metallicFactor = MatUNIFORMS['metallicFactor'];
        this.roughnessFactor = MatUNIFORMS['roughnessFactor'];
        this.reflectance = MatUNIFORMS['reflectance'];
        //cameraPosition
        // this.camPosX = UNIFORMS['cameraPosition'][0];
        // this.camPosY = UNIFORMS['cameraPosition'][1];
        // this.camPosZ = UNIFORMS['cameraPosition'][2];
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
        this.exposure = UNIFORMS['exposure'];
        this.ev100 = UNIFORMS['ev100'];
    };
    var options = new Config();
    var metallicFactorController = gui.add(options, 'metallicFactor', 0, 1);
    metallicFactorController.onChange(function(value){
        changeMaterialUniforms('metallicFactor', value);
    });
    var roughnessFactorController = gui.add( options, "roughnessFactor", 0, 1);
    roughnessFactorController.onChange(function(value){
        changeMaterialUniforms('roughnessFactor', value);
    });
    var reflectanceController = gui.add( options, "reflectance", 0, 1);
    reflectanceController.onChange(function(value){
        changeMaterialUniforms('reflectance', value);
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
    var sunControllerW = sunController.add(options, 'sunW');
    sunControllerW.onChange(function(value){
        UNIFORMS['sun'][3] = value;
    });
    //lightDirection
    var lightDirectionController = gui.addFolder('lightDirection');
    var lightDirectionControllerX = lightDirectionController.add(options, 'lightDirectionX');
    lightDirectionControllerX.onChange(function(value){
        UNIFORMS['lightDirection'][0] = value;
    });
    var lightDirectionControllerY = lightDirectionController.add(options, 'lightDirectionY');
    lightDirectionControllerY.onChange(function(value){
        UNIFORMS['lightDirection'][1] = value;
    });
    var lightDirectionControllerZ = lightDirectionController.add(options, 'lightDirectionZ');
    lightDirectionControllerZ.onChange(function(value){
        UNIFORMS['lightDirection'][2] = value;
    });
    //iblLuminance
    var iblLuminanceController = gui.add(options, 'iblLuminance', 0, 30000);
    iblLuminanceController.onChange(function(value){
        UNIFORMS['iblLuminance'] = value;
    });
}