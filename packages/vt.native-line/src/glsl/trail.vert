/**
* contains code from deck.gl
* https://github.com/uber/deck.gl
* MIT License
*/

attribute vec3 aPosition;
attribute float aLinesofar;

uniform mat4 projViewModelMatrix;
uniform float currentTime;
uniform float trailLength;
uniform float tileScale;

varying float vTime;

void main()
{
    vTime = 1.0 - (currentTime - aLinesofar / tileScale) / trailLength;
    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
}
