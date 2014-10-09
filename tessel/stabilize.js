var mainControl = require('./mainControl.js');
var throttleIncrement = mainControl.throttleIncrement;
var motorMaxThrottle = mainControl.motorMaxThrottle;
var PIDoutput = require('./PID.js').PIDoutput;

var stabilize = function(posMotor, negMotor, axis){
  var currentError = mainControl.error[axis];
  console.log('current error ', currentError, axis);
  var correction = PIDoutput(axis, currentError)/2;
  console.log('PID Output / 2 ', correction)
  if(correction !== 0){  
    mainControl.motors[posMotor].setThrottle(mainControl.motors[posMotor].currentThrottle + (-1 * correction), axis);
    mainControl.motors[negMotor].setThrottle(mainControl.motors[negMotor].currentThrottle + correction, axis);
  } else {
    console.log("correction is zero? ", correction);
    mainControl.axisChanging[axis] = false;
  }
  mainControl.previousError[axis] = currentError;
};

var whichAxisToStabilize = function(axis){
  var whichMotorsToStabilize = function(posMotor, negMotor, accelReading){
    if(!mainControl.axisChanging[axis] && (mainControl.error[axis] > mainControl.targetBalance || mainControl.error[axis] < -1 * mainControl.targetBalance)){ //Check flag for axis changing - potentially where code is stopping
      mainControl.axisChanging[axis] = true;
      stabilize(posMotor, negMotor, axis);
    } 
    else if (!mainControl.axisChanging[axis]){
      throttleUp(1, 'x');
      throttleUp(2, 'x');
      throttleUp(3, 'y');
      throttleUp(4, 'y');
    }
    setImmediate(function(){
      whichAxisToStabilize(axis); //After balancing mainControl.motors call balanceAxis
    });
  };
  if(!mainControl.isLanding){
    if(axis === 'x'){
      whichMotorsToStabilize(1, 2, mainControl.error[axis]);
    } else if (axis === 'y'){
      whichMotorsToStabilize(4, 3, mainControl.error[axis]);
    }
  }
};

var throttleUp = function(motorNumber, axis){
  var proposedMotorThrottle = mainControl.motors[motorNumber].currentThrottle + throttleIncrement;
  if(proposedMotorThrottle <= motorMaxThrottle){
    mainControl.motors[motorNumber].setThrottle(proposedMotorThrottle, axis);
  }
};

exports.whichAxisToStabilize = whichAxisToStabilize;

