/* eslint-disable */
// https://github.com/mbloch/mapshaper-proj/blob/master/src/projections/etmerc.js

// add math.h functions to library scope
// (to make porting projection functions simpler)
var fabs = Math.abs,
    floor = Math.floor,
    sin = Math.sin,
    cos = Math.cos,
    tan = Math.tan,
    asin = Math.asin,
    acos = Math.acos,
    atan = Math.atan,
    atan2 = Math.atan2,
    sqrt = Math.sqrt,
    pow = Math.pow,
    exp = Math.exp,
    log = Math.log,
    hypot = Math.hypot,
    sinh = Math.sinh,
    cosh = Math.cosh;

// constants from math.h
var HUGE_VAL = Infinity,
    M_PI = Math.PI;

// from proj_api.h
var RAD_TO_DEG = 57.295779513082321;

// common
var EPS10 = 1e-10;

function e_error(n?: number) {}

function pj_etmerc(P) {
  var cgb = [],
      cbg = [],
      utg = [],
      gtu = [],
      Qn, Zb, f, n, np, Z;
  if (P.es <= 0) e_error(-34);
  /* flattening */
  f = P.es / (1 + sqrt(1 - P.es)); /* Replaces: f = 1 - sqrt(1-P.es); */
  /* third flattening */
  np = n = f/(2 - f);
  /* COEF. OF TRIG SERIES GEO <-> GAUSS */
  /* cgb := Gaussian -> Geodetic, KW p190 - 191 (61) - (62) */
  /* cbg := Geodetic -> Gaussian, KW p186 - 187 (51) - (52) */
  /* PROJ_ETMERC_ORDER = 6th degree : Engsager and Poder: ICC2007 */
  cgb[0] = n*(2 + n*(-2/3 + n * (-2 + n*(116/45 + n * (26/45 + n*(-2854/675 ))))));
  cbg[0] = n*(-2 + n*( 2/3 + n*( 4/3 + n*(-82/45 + n*(32/45 + n*(4642/4725))))));
  np *= n;
  cgb[1] = np*(7/3 + n*(-8/5 + n*(-227/45 + n*(2704/315 + n*(2323/945)))));
  cbg[1] = np*(5/3 + n*(-16/15 + n*( -13/9 + n*(904/315 + n*(-1522/945)))));
  np *= n;
  /* n^5 coeff corrected from 1262/105 -> -1262/105 */
  cgb[2] = np*(56/15 + n*(-136/35 + n*(-1262/105 + n*(73814/2835))));
  cbg[2] = np*(-26/15 + n*(34/21 + n*(8/5 + n*(-12686/2835))));
  np *= n;
  /* n^5 coeff corrected from 322/35 -> 332/35 */
  cgb[3] = np*(4279/630 + n*(-332/35 + n*(-399572/14175)));
  cbg[3] = np*(1237/630 + n*(-12/5 + n*( -24832/14175)));
  np *= n;
  cgb[4] = np*(4174/315 + n*(-144838/6237));
  cbg[4] = np*(-734/315 + n*(109598/31185));
  np *= n;
  cgb[5] = np*(601676/22275);
  cbg[5] = np*(444337/155925);

  /* Constants of the projections */
  /* Transverse Mercator (UTM, ITM, etc) */
  np = n*n;
  /* Norm. mer. quad, K&W p.50 (96), p.19 (38b), p.5 (2) */
  Qn = P.k0/(1 + n) * (1 + np*(1/4 + np*(1/64 + np/256)));
  /* coef of trig series */
  /* utg := ell. N, E -> sph. N, E,  KW p194 (65) */
  /* gtu := sph. N, E -> ell. N, E,  KW p196 (69) */
  utg[0] = n*(-0.5 + n*( 2/3 + n*(-37/96 + n*( 1/360 + n*(81/512 + n*(-96199/604800))))));
  gtu[0] = n*(0.5 + n*(-2/3 + n*(5/16 + n*(41/180 + n*(-127/288 + n*(7891/37800))))));
  utg[1] = np*(-1/48 + n*(-1/15 + n*(437/1440 + n*(-46/105 + n*(1118711/3870720)))));
  gtu[1] = np*(13/48 + n*(-3/5 + n*(557/1440 + n*(281/630 + n*(-1983433/1935360)))));
  np *= n;
  utg[2] = np*(-17/480 + n*(37/840 + n*(209/4480 + n*(-5569/90720 ))));
  gtu[2] = np*(61/240 + n*(-103/140 + n*(15061/26880 + n*(167603/181440))));
  np *= n;
  utg[3] = np*(-4397/161280 + n*(11/504 + n*(830251/7257600)));
  gtu[3] = np*(49561/161280 + n*(-179/168 + n*(6601661/7257600)));
  np *= n;
  utg[4] = np*(-4583/161280 + n*(108847/3991680));
  gtu[4] = np*(34729/80640  + n*(-3418889/1995840));
  np *= n;
  utg[5] = np*(-20648693/638668800);
  gtu[5] = np*(212378941/319334400);

   /* Gaussian latitude value of the origin latitude */
  Z = gatg(cbg, P.phi0);

  /* Origin northing minus true northing at the origin latitude */
  /* i.e. true northing = N - P.Zb  */
  Zb = -Qn*(Z + clens(gtu, 2*Z));
  P.fwd = e_fwd;
  P.inv = e_inv;

  function e_fwd(lp, xy) {
    var sin_Cn, cos_Cn, cos_Ce, sin_Ce, tmp;
    var Cn = lp.phi, Ce = lp.lam;

    /* ell. LAT, LNG -> Gaussian LAT, LNG */
    Cn = gatg(cbg, Cn);
    /* Gaussian LAT, LNG -> compl. sph. LAT */
    sin_Cn = sin(Cn);
    cos_Cn = cos(Cn);
    sin_Ce = sin(Ce);
    cos_Ce = cos(Ce);
    Cn = atan2(sin_Cn, cos_Ce*cos_Cn);
    Ce = atan2(sin_Ce*cos_Cn, hypot(sin_Cn, cos_Cn*cos_Ce));
    /* compl. sph. N, E -> ell. norm. N, E */
    Ce = asinhy(tan(Ce));
    tmp = clenS(gtu, 2*Cn, 2*Ce);
    Cn += tmp[0];
    Ce += tmp[1];
    if (fabs (Ce) <= 2.623395162778) {
        xy.y  = Qn * Cn + Zb;  /* Northing */
        xy.x  = Qn * Ce;       /* Easting  */
    } else {
      xy.x = xy.y = HUGE_VAL;
    }
  }

  function e_inv(xy, lp) {
    var sin_Cn, cos_Cn, cos_Ce, sin_Ce, tmp;
    var Cn = xy.y, Ce = xy.x;
    /* normalize N, E */
    Cn = (Cn - Zb)/Qn;
    Ce = Ce/Qn;
    if (fabs(Ce) <= 2.623395162778) { /* 150 degrees */
      /* norm. N, E -> compl. sph. LAT, LNG */
      tmp = clenS(utg, 2*Cn, 2*Ce);
      Cn += tmp[0];
      Ce += tmp[1];
      Ce = atan(sinh(Ce)); /* Replaces: Ce = 2*(atan(exp(Ce)) - M_FORTPI); */
      /* compl. sph. LAT -> Gaussian LAT, LNG */
      sin_Cn = sin(Cn);
      cos_Cn = cos(Cn);
      sin_Ce = sin(Ce);
      cos_Ce = cos(Ce);
      Ce = atan2(sin_Ce, cos_Ce*cos_Cn);
      Cn = atan2(sin_Cn*cos_Ce, hypot(sin_Ce, cos_Ce*cos_Cn));
      /* Gaussian LAT, LNG -> ell. LAT, LNG */
      lp.phi = gatg (cgb, Cn);
      lp.lam = Ce;
    }
    else {
      lp.phi = lp.lam = HUGE_VAL;
    }
  }

  function log1py(x) {
    var y = 1 + x,
        z = y - 1;
    return z === 0 ? x : x * log(y) / z;
  }

  function asinhy(x) {
    var y = fabs(x);
    y = log1py(y * (1 + y/(hypot(1, y) + 1)));
    return x < 0 ? -y : y;
  }

  function gatg(pp, B) {
    var cos_2B = 2 * cos(2 * B),
        i = pp.length - 1,
        h1 = pp[i],
        h2 = 0,
        h;
    while (--i >= 0) {
      h = -h2 + cos_2B * h1 + pp[i];
      h2 = h1;
      h1 = h;
    }
    return (B + h * sin(2 * B));
  }

  function clens(pp, arg_r) {
    var r = 2 * cos(arg_r),
        i = pp.length - 1,
        hr1 = pp[i],
        hr2 = 0,
        hr;
    while (--i >= 0) {
      hr = -hr2 + r * hr1 + pp[i];
      hr2 = hr1;
      hr1 = hr;
    }
    return sin(arg_r) * hr;
  }

  function clenS(pp, arg_r, arg_i) {
    var sin_arg_r = sin(arg_r),
        cos_arg_r = cos(arg_r),
        sinh_arg_i = sinh(arg_i),
        cosh_arg_i = cosh(arg_i),
        r = 2 * cos_arg_r * cosh_arg_i,
        i = -2 * sin_arg_r * sinh_arg_i,
        j = pp.length - 1,
        hr = pp[j],
        hi1 = 0,
        hr1 = 0,
        hi = 0,
        hr2, hi2;
    while (--j >= 0) {
      hr2 = hr1;
      hi2 = hi1;
      hr1 = hr;
      hi1 = hi;
      hr = -hr2 + r*hr1 - i * hi1 + pp[j];
      hi = -hi2 + i*hr1 + r * hi1;
    }
    r = sin_arg_r * cosh_arg_i;
    i = cos_arg_r * sinh_arg_i;
    return [r * hr - i * hi, r * hi + i * hr];
  }
}

export default pj_etmerc;
/* eslint-enable */

