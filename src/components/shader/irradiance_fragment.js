const text = `precision mediump float;
uniform samplerCube environmentMap;
varying vec3 FragPosition;

const float PI = 3.1415926539;

void main(){
    vec3 N = normalize(FragPosition);
    vec3 irradiance = vec3(0.0);
    vec3 up = vec3(0.0,1.0,0.0);
    vec3 right = cross(up,N);
    up = corss(N,right);
    float sampleDelta = 0.025;
    float nrSamples = 0.0;
    for(float phi = 0.0; phi < 2.0 * PI; phi += sampleDelta)
    {
        for(float theta = 0.0; theta < 0.5 * PI; theta += sampleDelta)
        {
            // spherical to cartesian (in tangent space)
            vec3 tangentSample = vec3(sin(theta) * cos(phi),  sin(theta) * sin(phi), cos(theta));
            // tangent space to world
            vec3 sampleVec = tangentSample.x * right + tangentSample.y * up + tangentSample.z * N; 
            irradiance += texture(environmentMap, sampleVec).rgb * cos(theta) * sin(theta);
            nrSamples++;
        }
    }
    irradiance = PI * irradiance * (1.0 / float(nrSamples));
    gl_FragColor = vec4(irradiance, 1.0);
}`;

module.exports = text;