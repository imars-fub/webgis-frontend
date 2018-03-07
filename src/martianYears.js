// Credits: http://www-mars.lmd.jussieu.fr/mars/time/martian_time.html

goog.provide('martianYears');

function checkGivenYear(year){
    var leapyear; // bissextil year ? (0==no, 1==yes) (returned value)
    
    if ((((year%4)==0)&&((year%100)!=0))||((year%400)==0)) {
      leapyear=1;
    }
    else {
      leapyear=0; // not a bissextil year
    }

    return leapyear;
}

function convertDate2Jdate(date){
  var year=date.getFullYear();
  var month=date.getMonth()+1;
  var day=date.getDate();
  var hours=date.getHours();
  var minutes=date.getMinutes();
  var seconds=date.getSeconds();


  var leapyear; // (0==no, 1==yes)
  var i;
  var ref_year=1968;
  var ref_jdate=2.4398565e6; // Julian date for 01/01/1968 00:00:00
  var edays = new Array(0,31,59,90,120,151,181,212,243,273,304,334);
  // edays = number of elapsed days during previous monthes of same year
  var nday=0.0; // number of days

  // start by checking validity of given date
  leapyear=checkGivenYear(year);

  // compute number of days due to years 
  if(year>ref_year) {
    for(i=ref_year;i<year;i++){
      nday=nday+365.0;
      if ((((i%4)==0)&&((i%100)!=0))||((i%400)==0)) { // leap year
        nday++;
      }
    }
  }
  else {
    for(i=year;i<ref_year;i++){
      nday=nday-365.0;
      if ((((i%4)==0)&&((i%100)!=0))||((i%400)==0)) { // leap year
        nday--;
      }
    }
  }

  if (month>0) {
    // add number of days due to elapsed monthes
    nday=nday+edays[month-1];
  }
  
  //add 1 if year is leap year and month >=3
  if((leapyear==1)&&(month>=3)){
    nday=nday+1;
  }

  // add reference year offset and day
  //jdate=ref_jdate+nday+day;
  jdate=nday*1.0+day*1.0+ref_jdate*1.0-1.0;

  // add time (hours+minutes+seconds)
  jdate=jdate+hours/24.0+minutes/1440.0+seconds/86400.0;
  
  return jdate;
}

function convertSol2Ls(sol) {
  var ls;

  var year_day=668.6; // number of sols in a martian year
  var peri_day=485.35; // perihelion date
  var e_ellip=0.09340; // orbital ecentricity
  var timeperi=1.90258341759902 // 2*Pi*(1-Ls(perihelion)/360); Ls(perihelion)=250.99
  var rad2deg=180./Math.PI;

  var i;
  var zz,zanom,zdx=10;
  var xref,zx0,zteta;
  // xref: mean anomaly, zx0: eccentric anomaly, zteta: true anomaly

  zz=(sol-peri_day)/year_day;
  zanom=2.*Math.PI*(zz-Math.round(zz));
  xref=Math.abs(zanom);

  // Solve Kepler equation zx0 - e *sin(zx0) = xref
  // Using Newton iterations 
  zx0=xref+e_ellip*Math.sin(xref);
  do {
    zdx=-(zx0-e_ellip*Math.sin(zx0)-xref)/(1.-e_ellip*Math.cos(zx0));
    zx0=zx0+zdx;
  }while (zdx>1.e-7);
  if (zanom<0) zx0=-zx0;

  // Compute true anomaly zteta, now that eccentric anomaly zx0 is known
  zteta=2.*Math.atan(Math.sqrt((1.+e_ellip)/(1.-e_ellip))*Math.tan(zx0/2.));

  // compute Ls
  ls=zteta-timeperi;
  if(ls<0) ls=ls+2.*Math.PI;
  if(ls>2.*Math.PI) ls=ls-2.*Math.PI;
  // convert Ls into degrees
  ls=rad2deg*ls;

  return ls;
}

function convertJdate2MartianDate(jdate){
  // Convert a Julian date to corresponding "sol" and "Ls"
  var sol;
  var ls;
  var martianyear;
  var martianmonth;

  var jdate_ref=2.442765667e6; // 19/12/1975 4:00:00, such that Ls=0
  // jdate_ref is also the begining of Martian Year "12"
  var martianyear_ref=12;
  var earthday=86400.0;
  var marsday=88775.245;
  var marsyear=668.6; // number of sols in a martian year 

  sol=(jdate-jdate_ref)*earthday/marsday;

  martianyear=martianyear_ref;
  // Compute Martian Year #, along with sol value
  // sol being computed modulo the number of sols in a martian year
  while (sol>=marsyear){
    sol=sol-marsyear;
    martianyear=martianyear+1;
  }
  while (sol<0.0){
    sol=sol+marsyear;
    martianyear=martianyear-1;
  }

  // convert sol number to Ls
  //ls=convertSol2Ls(sol);
  // Knowing Ls compute martian month
  //martianmonth=1+Math.floor(ls/30.);

  // MA, MM, Ls, Sol
  //return [martianyear, martianmonth, Math.round(ls*10)/10, 1+Math.floor(sol)]

  // MA, Ls, Sol
  //return [martianyear, ls, sol]

  // MA, Sol
  return [martianyear, 1+Math.floor(sol)]

}


function convertGregorian2Martian(date) {
  var jdate = convertDate2Jdate(date);
  var my = convertJdate2MartianDate(jdate);
  return my;
}

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


function ConvertMartian2Julian(marsyear, sol){
//var sol;
//console.dir(marsyear.toString()+' '+sol.toString());
var ls;

var solsinamarsyear=668.6; // number of sols in a martian year
var sollength=88775.245; // sol length, in seconds
var daylength=86400; // Earth day length, in seconds
var yearlength=365.2422; // number of earth days in an earth year

var ref_marsyear=26;
var ref_jdate=2452383.23; // Julian date for April 18.7 2002, Ls=0, beginning of Mars Year 26

var marsyear; // Martian Year
var jdate; // julian date

jdate=(marsyear-ref_marsyear)*(solsinamarsyear*(sollength/daylength))+ref_jdate;

// small fix; for Ls=0, we get sol=668.59987 instead of sol~0
if (sol>=668.59) {
  sol=sol+0.01-solsinamarsyear;
}

//3. Add up these sols to get julian date
jdate=jdate+sol*(sollength/daylength);

//return Julian2Gregorian(jdate);
return jdate;
}

function ConvertMartian2Gregorian(marsyear, sol){
  var jdate=ConvertMartian2Julian(marsyear, sol);
  var ymd;

  ymd = Julian2Gregorian(jdate);

  var date = new Date(ymd[0], ymd[1]-1, ymd[2],0,0,0,0);
  return date;
}

function Julian2Gregorian(jdate) {

var ijj,is,ir3,iap,ir2,imp,ir1,ij;
var year;
var month;
var day;

// convert julian date to gregorian date
ijj=Math.floor(jdate+0.5);
is=Math.floor((4.*ijj-6884477.)/146097.);
ir3=ijj-Math.floor((146097.*is+6884480.)/4.);
iap=Math.floor((4.*ir3+3.)/1461.);
ir2=ir3-Math.floor(1461.*iap/4.);
imp=Math.floor((5.*ir2+461.)/153.);
ir1=ir2-Math.floor((153.*imp-457.)/5.);
ij=ir1+1;
if (imp>=13) {
  imp=imp-12;
  iap=iap+1;
}

year=iap+100*is;
month=imp;
day=ij;

return [year, month, day];
//return new Date(year, month-1, day,0,0,0,0);
}

/* Zalf */
function convertJDate2Date(jdate){
    // Converts julian date into corresponding Earth date
    // input: jdate as number
    // output: year, month, day, hour, minute, second as Date
    var year, month, day, hour, minute, second; // returned values
    var leapyear; // (0==no, 1==yes)
    var rest;
    var ref_year=1960;
    var ref_jdate=2436934.5; // Julian date for 01/01/1960 00:00:00
    var edays = new Array(0,31,59,90,120,151,181,212,243,273,304,334);
    var edaysLY = new Array(0,31,60,91,121,152,182,213,244,274,305,335); // leap year
    // edays = number of elapsed days during previous monthes of same year
    var nday = jdate - ref_jdate; // number of days
    
    if (nday > 0) { // jdate after 01/01/1960
        year = ref_year;
        // calculate year
        while (((nday > 365.0)&&(!checkGivenYear(year))) || ((nday > 366.0)&&(checkGivenYear(year)))) {
            nday = nday - 365.0;
            if (checkGivenYear(year)) { // leap year
                nday--;
            }
            year++;    
        }
        //calculate month
        month = 0;
        if (checkGivenYear(year)) { // leap year
            while (nday > edaysLY[month]) {
                month++;
            }                         
            nday = nday - edaysLY[month-1] + 1;
        } else {
            while (nday > edays[month]) {
                month++;
            }             
            nday = nday - edays[month-1] + 1;
        }
        //calculate day
        day = Math.floor(nday); 
        // calulate hours
        rest = nday - Math.floor(nday);
        hour = Math.floor(rest*24.0);
        rest = rest * 24.0 - hour;
        minute = Math.floor(rest*60.0);
        rest = rest * 60.0 - minute;
        second = Math.floor(rest*60.0);
    } else { // jdate == reference_date or before reference_date
        year = ref_year;
        month = 1;
        day = 1;
        hour = 0;
        minute = 0;
        second = 0;
    }
    
    return new Date(year, month-1, day, hour, minute, second);
}
