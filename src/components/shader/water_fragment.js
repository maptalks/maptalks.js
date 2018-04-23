// full fragment
const full_fragment = `
    precision mediump float;
    
    void main(){
        gl_FragColor = vec4(1.0,0.2,0.5,1.0);
    }`;
// ocean fragment
const ocean_fragment = `
    precision mediump float;

    varying vec2 v_coordinates;
    varying vec3 v_position;

    uniform sampler2D u_displacementMap;
    uniform sampler2D u_normalMap;
    uniform vec3 u_cameraPosition;
    uniform vec3 u_oceanColor;
    uniform vec3 u_skyColor;
    uniform float u_exposure;
    uniform vec3 u_sunDirection;

    vec3 hdr (vec3 color, float exposure) {
        return 1.0 - exp(-color * exposure);
    }

    void main (void) {
        vec3 normal = texture2D(u_normalMap, v_coordinates).rgb;

        vec3 view = normalize(u_cameraPosition - v_position);
        float fresnel = 0.02 + 0.98 * pow(1.0 - dot(normal, view), 5.0);
        vec3 sky = fresnel * u_skyColor;

        float diffuse = clamp(dot(normal, normalize(u_sunDirection)), 0.0, 1.0);
        vec3 water = (1.0 - fresnel) * u_oceanColor * u_skyColor * diffuse;

        vec3 color = sky + water;

        gl_FragColor = vec4(hdr(color, u_exposure), 1.0);
    }`;
//vertical transform
const vertical_transform_fragment = `
    precision mediump float;

    const float PI = 3.14159265359;

    uniform sampler2D u_input;
    uniform float u_transformSize;
    uniform float u_subtransformSize;

    varying vec2 v_coordinates;

    vec2 multiplyComplex (vec2 a,vec2 b){
        return vec2(a[0] * b[0] - a[1] * b[1], a[1] * b[0] + a[0] * b[1]);
    }

    void main(){
        float index = v_coordinates.y * u_transformSize - 0.5;
        float evenIndex = floor(index / u_subtransformSize) * (u_subtransformSize * 0.5) + mod(index, u_subtransformSize * 0.5);
        vec4 even = texture2D(u_input, vec2(gl_FragCoord.x, evenIndex + 0.5) / u_transformSize).rgba;
        vec4 odd = texture2D(u_input, vec2(gl_FragCoord.x, evenIndex + u_transformSize * 0.5 + 0.5) / u_transformSize).rgba;
        float twiddleArgument = -2.0 * PI * (index / u_subtransformSize);
        vec2 twiddle = vec2(cos(twiddleArgument), sin(twiddleArgument));
        vec2 outputA = even.xy + multiplyComplex(twiddle, odd.xy);
        vec2 outputB = even.zw + multiplyComplex(twiddle, odd.zw);
        gl_FragColor = vec4(outputA, outputB);
    }`;

//horizontal transform
const horizontal_transform_fragment = `
    precision mediump float;

    const float PI = 3.14159265359;

    uniform sampler2D u_input;
    uniform float u_transformSize;
    uniform float u_subtransformSize;

    varying vec2 v_coordinates;

    vec2 multiplyComplex (vec2 a,vec2 b){
        return vec2(a[0] * b[0] - a[1] * b[1], a[1] * b[0] + a[0] * b[1]);
    }

    void main(){
        float index = v_coordinates.x * u_transformSize - 0.5;
        float evenIndex = floor(index / u_subtransformSize) * (u_subtransformSize * 0.5) + mod(index, u_subtransformSize * 0.5);
        vec4 even = texture2D(u_input, vec2(evenIndex + 0.5, gl_FragCoord.y) / u_transformSize).rgba;
        vec4 odd = texture2D(u_input, vec2(evenIndex + u_transformSize * 0.5 + 0.5, gl_FragCoord.y) / u_transformSize).rgba;
        float twiddleArgument = -2.0 * PI * (index / u_subtransformSize);
        vec2 twiddle = vec2(cos(twiddleArgument), sin(twiddleArgument));
        vec2 outputA = even.xy + multiplyComplex(twiddle, odd.xy);
        vec2 outputB = even.zw + multiplyComplex(twiddle, odd.zw);
        gl_FragColor = vec4(outputA, outputB);
    }`;
//
const phase_fragment = `
    precision mediump float;
    
    const float PI = 3.14159265359;
    const float G = 9.81;
    const float KM = 370.0;

    varying vec2 v_coordinates;

    uniform sampler2D u_phases;
    uniform float u_deltaTime;
    uniform float u_resolution;
    uniform float u_size;

    float omega(float k){
        return sqrt(G * k * (1.0 + k * k / KM * KM));
    }

    void main(){
        float deltaTime = 1.0/60.0;
        vec2 coordinates = gl_FragCoord.xy - 0.5;
        float n = (coordinates.x < u_resolution * 0.5) ? coordinates.x : coordinates.x - u_resolution;
        float m = (coordinates.y < u_resolution * 0.5) ? coordinates.y : coordinates.y - u_resolution;
        vec2 waveVector = (2.0 * PI * vec2(n, m)) / u_size;
        float phase = texture2D(u_phases, v_coordinates).r;
        float deltaPhase = omega(length(waveVector)) * u_deltaTime;
        phase = mod(phase + deltaPhase, 2.0 * PI);
        //
        gl_FragColor = vec4(1.0, 0.0, 0.0, 0.0);
    }`;
//initial spectrum
const initial_spectrum_fragment = `
    precision mediump float;

    const float PI = 3.14159265359;

    const float G = 9.81;
    const float KM = 370.0;
    const float CM = 0.23;

    uniform vec2 u_wind;
    uniform float u_resolution;
    uniform float u_size;

    float square(float x){
        return x * x;
    }

    float omega(float k){
        return sqrt(G * k * (1.0 + square(k / KM)));
    }

    float tanh(float x){
        return (1.0 - exp(-2.0 * x)) / (1.0 + exp(-2.0 * x));
    }

    void main(){
        vec2 coordinates = gl_FragCoord.xy - 0.5;
        float n = (coordinates.x < u_resolution * 0.5) ? coordinates.x : coordinates.x - u_resolution;
        float m = (coordinates.y < u_resolution * 0.5) ? coordinates.y : coordinates.y - u_resolution;
        vec2 waveVector = (2.0 * PI * vec2(n, m)) / u_size;
        float k = length(waveVector);
        float U10 = length(u_wind);
        float Omega = 0.84;
        float kp = G * square(Omega / U10);
        float c = omega(k) / k;
        float cp = omega(kp) / kp;
        float Lpm = exp(-1.25 * square(kp / k));
        float gamma = 1.7;
        float sigma = 0.08 * (1.0 + 4.0 * pow(Omega, -3.0));
        float Gamma = exp(-square(sqrt(k / kp) - 1.0) / 2.0 * square(sigma));
        float Jp = pow(gamma, Gamma);
        float Fp = Lpm * Jp * exp(-Omega / sqrt(10.0) * (sqrt(k / kp) - 1.0));
        float alphap = 0.006 * sqrt(Omega);
        float Bl = 0.5 * alphap * cp / c * Fp;
        float z0 = 0.000037 * square(U10) / G * pow(U10 / cp, 0.9);
        float uStar = 0.41 * U10 / log(10.0 / z0);
        float alpham = 0.01 * ((uStar < CM) ? (1.0 + log(uStar / CM)) : (1.0 + 3.0 * log(uStar / CM)));
        float Fm = exp(-0.25 * square(k / KM - 1.0));
        float Bh = 0.5 * alpham * CM / c * Fm * Lpm;
        float a0 = log(2.0) / 4.0;
        float am = 0.13 * uStar / CM;
        float Delta = tanh(a0 + 4.0 * pow(c / cp, 2.5) + am * pow(CM / c, 2.5));
        float cosPhi = dot(normalize(u_wind), normalize(waveVector));
        float S = (1.0 / (2.0 * PI)) * pow(k, -4.0) * (Bl + Bh) * (1.0 + Delta * (2.0 * cosPhi * cosPhi - 1.0));
        float dk = 2.0 * PI / u_size;
        float h = sqrt(S / 2.0) * dk;
        if (waveVector.x == 0.0 && waveVector.y == 0.0) {
            h = 0.0;
        }
        //
        gl_FragColor = vec4(h, 0.0, 0.0, 0.0);
    }`;
// spectrum
const spectrum_fragment = `
    precision mediump float;

    const float PI = 3.14159265359;
    const float G = 9.81;
    const float KM = 370.0;

    varying vec2 v_coordinates;

    uniform float u_size;
    uniform float u_resolution;
    uniform sampler2D u_phases;
    uniform sampler2D u_initialSpectrum;
    uniform float u_choppiness;

    vec2 multiplyComplex (vec2 a, vec2 b) {
        return vec2(a[0] * b[0] - a[1] * b[1], a[1] * b[0] + a[0] * b[1]);
    }

    vec2 multiplyByI (vec2 z) {
        return vec2(-z[1], z[0]);
    }

    float omega (float k) {
        return sqrt(G * k * (1.0 + k * k / KM * KM));
    }

    void main (void) {
        vec2 coordinates = gl_FragCoord.xy - 0.5;
        float n = (coordinates.x < u_resolution * 0.5) ? coordinates.x : coordinates.x - u_resolution;
        float m = (coordinates.y < u_resolution * 0.5) ? coordinates.y : coordinates.y - u_resolution;
        vec2 waveVector = (2.0 * PI * vec2(n, m)) / u_size;
        float phase = texture2D(u_phases, v_coordinates).r;
        vec2 phaseVector = vec2(cos(phase), sin(phase));
        vec2 h0 = texture2D(u_initialSpectrum, v_coordinates).rg;
        vec2 h0Star = texture2D(u_initialSpectrum, vec2(1.0 - v_coordinates + 1.0 / u_resolution)).rg;
        h0Star.y *= -1.0;
        vec2 h = multiplyComplex(h0, phaseVector) + multiplyComplex(h0Star, vec2(phaseVector.x, -phaseVector.y));
        vec2 hX = -multiplyByI(h * (waveVector.x / length(waveVector))) * u_choppiness;
        vec2 hZ = -multiplyByI(h * (waveVector.y / length(waveVector))) * u_choppiness;
        if (waveVector.x == 0.0 && waveVector.y == 0.0) {
            h = vec2(0.0);
            hX = vec2(0.0);
            hZ = vec2(0.0);
        }
        gl_FragColor = vec4(hX + multiplyByI(h), hZ);
    }`;
// normal map
const normal_fragment = `
    precision mediump float;

    varying vec2 v_coordinates;

    uniform sampler2D u_displacementMap;
    uniform float u_resolution;
    uniform float u_size;

    void main(){
        float texel = 1.0 / u_resolution;
        float texelSize = u_size / u_resolution;
        vec3 center = texture2D(u_displacementMap, v_coordinates).rgb;
        vec3 right = vec3(texelSize, 0.0, 0.0) + texture2D(u_displacementMap, v_coordinates + vec2(texel, 0.0)).rgb - center;
        vec3 left = vec3(-texelSize, 0.0, 0.0) + texture2D(u_displacementMap, v_coordinates + vec2(-texel, 0.0)).rgb - center;
        vec3 top = vec3(0.0, 0.0, -texelSize) + texture2D(u_displacementMap, v_coordinates + vec2(0.0, -texel)).rgb - center;
        vec3 bottom = vec3(0.0, 0.0, texelSize) + texture2D(u_displacementMap, v_coordinates + vec2(0.0, texel)).rgb - center;
        vec3 topRight = cross(right, top);
        vec3 topLeft = cross(top, left);
        vec3 bottomLeft = cross(left, bottom);
        vec3 bottomRight = cross(bottom, right);
        gl_FragColor = vec4(normalize(topRight + topLeft + bottomLeft + bottomRight), 1.0);
    }`;

module.exports = {
    full_fragment,
    ocean_fragment,
    vertical_transform_fragment,
    horizontal_transform_fragment,
    phase_fragment,
    initial_spectrum_fragment,
    spectrum_fragment,
    normal_fragment
}