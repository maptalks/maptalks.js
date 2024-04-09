type BlendingFunction =
/* `gl.ZERO` */
"zero" | 0 |
/* `gl.ONE` */
"one" | 1 |
/* `gl.SRC_COLOR` */
"src color" |
/* `gl.ONE_MINUS_SRC_COLOR` */
"one minus src color" |
/* `gl.SRC_ALPHA` */
"src alpha" |
/* `gl.ONE_MINUS_SRC_ALPHA` */
"one minus src alpha" |
/* `gl.DST_COLOR` */
"dst color" |
/* `gl.ONE_MINUS_DST_COLOR` */
"one minus dst color" |
/* `gl.DST_ALPHA` */
"dst alpha" |
/* `gl.ONE_MINUS_DST_ALPHA` */
"one minus dst alpha" |
/* `gl.CONSTANT_COLOR` */
"constant color" |
/* `gl.ONE_MINUS_CONSTANT_COLOR` */
"one minus constant color" |
/* `gl.CONSTANT_ALPHA` */
"constant alpha" |
/* `gl.ONE_MINUS_CONSTANT_ALPHA` */
"one minus constant alpha" |
/* `gl.SRC_ALPHA_SATURATE` */
"src alpha saturate";

//TODO regl中已经定义过了
type ComparisonOperatorType =
/* `gl.NEVER` */
"never" |
/* `gl.ALWAYS` */
"always" |
/* `gl.LESS` */
"less" | "<" |
/* `gl.LEQUAL` */
"lequal" | "<=" |
/* `gl.GREATER` */
"greater" | ">" |
/* `gl.GEQUAL` */
"gequal" | ">=" |
/* `gl.EQUAL` */
"equal" | "=" |
/* `gl.NOTEQUAL` */
"notequal" | "!=";
