import { F7 } from '../../services/f7';
import {inject} from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { Pouch } from '../../services/pouch';
import { SimpleCache } from '../../services/simpleCache';
import {NewInstance} from 'aurelia-dependency-injection';
import {ValidationRules,ValidationController} from 'aurelia-validation';
import {BootstrapFormRenderer} from '../../bootstrap-validation/bootstrap-form-renderer'
import {I18N,BaseI18N} from 'aurelia-i18n';
import {EventAggregator} from 'aurelia-event-aggregator';
//import {required, email, length, date, datetime, numericality, ValidationRules} from 'aurelia-validatejs';

@inject(F7, Router, Pouch, SimpleCache,NewInstance.of(ValidationController),I18N,Element,EventAggregator,BootstrapFormRenderer)
export class round extends BaseI18N {
    clubList = [{line:1,clubs:[{code:"DR",disp:"DR"},{code:"3W",disp:"3W"},{code:"5W",disp:"5W"},{code:"I3",disp:"I3"},{code:"I4",disp:"I4"},{code:"I5",disp:"I5"}]},
                {line:2,clubs:[{code:"I6",disp:"I6"},{code:"I7",disp:"I7"},{code:"I8",disp:"I8"},{code:"I9",disp:"I9"},{code:"P",disp:"P"},{code:"50",disp:"50"}]},
                {line:3,clubs:[{code:"52",disp:"52"},{code:"54",disp:"54"},{code:"56",disp:"56"},{code:"58",disp:"58"},{code:"60",disp:"60"},{code:"64",disp:"64"}]}]
    ballLies = [{short:"OOB",long:"Out of bounds"},{short:"F",long:"Fairway"},{short:"R",long:"Rough"},{short:"G",long:"Green"},{short:"B",long:"Bunker"},{short:"H",long:"Hazard"}];
    ballRightLeft = [{short:"R",long:"Right"},{short:"L",long:"Left"},{short:"A",long:"After"}];
    puttDistance = [{short:"0.5",long:"0.5 m"},{short:"1",long:"1 m"},{short:"1.5",long:"1.5 m"},{short:"2",long:"2 m"},{short:"3",long:"3 m"},
                    {short:"4",long:"4 m"},{short:"5",long:"5 m"},{short:"6",long:"6 m"},{short:"8",long:"8 m"},{short:"10",long:"10 m"},
                    {short:"15",long:"15 m"},{short:"20",long:">15 m"}];
    powerList = [{stored:"F",displayed:"Full"},{stored:"10:30",displayed:"10:30"},{stored:"0900",displayed:"9:00"},{stored:"0730",displayed:"7:30"},{stored:"C",displayed:"Chip"}];
    putt = null;

    constructor(f7,router, pouch, simpleCache,controller,i18n,element,eventAggregator,bsRenderer) {
        console.log('Entering round constructor');
        super(i18n,element,eventAggregator);
        this.f7 = f7;
        this.router = router;
        this.pouch = pouch;
        this.cache = simpleCache;
        this.controller = controller;
        this.isDirty = false;
        this.round = {};
        this.course = {};
        this.currHole = 1;
        this.currShot = 1;
        this.capturingGPSData = false;
        this.currLat;
        this.currLong;
        this.prevDist = 0;
    }
    
    async activate(params) {
        console.log('Round activate called - params is :'+JSON.stringify(params));
        var _self = this;
        this.round.dateTime = new Date().toISOString();
        if (params.id) {
            await this.pouch.getDoc(params.id).then(course => {
                _self.course = course;
                _self.round.type = 'round';
                _self.round.roundData={};
                _self.round.roundData.courseName = course.courseData.courseName;
                _self.round.roundData.courseId = course._id;
                _self.round.roundData.holes=[];
                _self.round.roundData.holes[this.currHole-1] = {};
                _self.round.roundData.holes[this.currHole-1].shots=[];
                _self.round.roundData.holes[this.currHole-1].shots[this.currShot-1]={};
                _self.round.roundData.holes[this.currHole-1].shots[this.currShot-1].lie="F";
                _self.round.roundData.holes[this.currHole-1].shots[this.currShot-1].power="F";
            });
        } else if (params.roundId) {
            await this.pouch.getDoc(params.roundId).then(round => _self.round = round);     
            await this.pouch.getDoc(this.round.roundData.courseId).then(course => _self.course = course);     
        }
        // start watching GPS Data
        this.watchID = navigator.geolocation.watchPosition(
            function(position){
                console.log('Latitude: '          + position.coords.latitude          + '\n' +
                    'Longitude: '         + position.coords.longitude         + '\n' +
                    'Accuracy: '          + position.coords.accuracy          + '\n' +
                    'Timestamp: '         + position.timestamp                + '\n');
                _self.currLat = position.coords.latitude;
                _self.currLong = position.coords.longitude;
                if (_self.currShot>1 && !_self.round.roundData.holes[_self.currHole-1].shots[_self.currShot-2].penalty)
                    _self.round.roundData.holes[_self.currHole-1].shots[_self.currShot-1].distance = 
                        _self.computeDistance(_self.round.roundData.holes[_self.currHole-1].shots[_self.currShot-2].lat,
                                                _self.round.roundData.holes[_self.currHole-1].shots[_self.currShot-2].long,_self.currLat,_self.currLong)

            }, 
            function onError(error) {
                console.log("[ERROR] reading GPS coordinates");
                alert('code: '    + error.code    + '\n' +
                    'message: ' + error.message + '\n');
            },
            { maximumAge: 3000, timeout: 5000, enableHighAccuracy: true });
    }

    get puttDist() {
        return this.putt;
    }

    set puttDist(newValue) {
        this.putt = newValue;
        if (newValue != null) {
            console.log("[set puttDist]called");
            this.setClub("Putt",newValue);
        }
    }

    async setClub(club,dist) {
        this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].club=club;
        if (club!="Putt") {
            this.puttDist=null;
            delete this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].putt;
            this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].power='F';            
        } else {
            this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].putt=dist;            
        }
//        if (this.round.roundData.holes[this.currHole-1].shots[this.currShot-2].club != "Putt") {
            try {
                this.capturingGPSData = true;
                await this.wait3Seconds();            
                this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].lat=this.currLat;        
                this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].long=this.currLong;
                if (this.currShot>1 && !this.round.roundData.holes[this.currHole-1].shots[this.currShot-2].penalty) {
                    this.round.roundData.holes[this.currHole-1].shots[this.currShot-2].distance = 
                        this.computeDistance(this.round.roundData.holes[this.currHole-1].shots[this.currShot-2].lat,
                                            this.round.roundData.holes[this.currHole-1].shots[this.currShot-2].long,
                                            this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].lat,
                                            this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].long);
                }        
                this.capturingGPSData = false;
                console.log("[setClub]rounddata is : "+JSON.stringify(this.round));
            } catch (error) {
                console.log("[ERROR] reading GPS coordinates");
                alert('code: '    + error.code    + '\n' +
                    'message: ' + error.message + '\n');
            }
//        }
    }

    setPower(power) {
        this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].power=power;
        console.log("rounddata is : "+JSON.stringify(this.round));
    }
 
    nextShot() {
        this.currShot++;
        if (!this.round.roundData.holes[this.currHole-1].shots[this.currShot-1]) {
            this.round.roundData.holes[this.currHole-1].shots[this.currShot-1]={};
            if (this.round.roundData.holes[this.currHole-1].shots[this.currShot-2].lie=="G") {
                this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].lie="G";
                this.puttDist=0.5;
                this.setClub("Putt","0.5");
            } else
                this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].lie="F";
        }
        this.mySwiper._slideTo(0,"300",false);
    }

    prevShot() {
        if (this.currShot>1)
            this.currShot--;
    }

    async setPenalty(){
        this.round.roundData.holes[this.currHole-1].shots[this.currShot-1]={};
        this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].penalty=true;
        try {
            this.capturingGPSData = true;
            await this.wait3Seconds();            
            this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].lat=this.currLat;        
            this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].long=this.currLong;
            this.round.roundData.holes[this.currHole-1].shots[this.currShot-2].distance = 
                this.computeDistance(this.round.roundData.holes[this.currHole-1].shots[this.currShot-2].lat,
                                    this.round.roundData.holes[this.currHole-1].shots[this.currShot-2].long,
                                    this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].lat,
                                    this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].long);
            this.capturingGPSData = false;
            console.log("[setPenalty]rounddata is : "+JSON.stringify(this.round));
        } catch (error) {
            console.log("[ERROR] reading GPS coordinates");
            alert('code: '    + error.code    + '\n' +
                'message: ' + error.message + '\n');
        }
        this.currShot++;
        this.round.roundData.holes[this.currHole-1].shots[this.currShot-1]={};
        this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].lie="F";
        this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].power="F";
        
       this.mySwiper._slideTo(0,"300",false);       
    }

    deleteShot() {
        if (this.currShot>1) {
            delete this.round.roundData.holes[this.currHole-1].shots[this.currShot-1];
            this.currShot--;
        }
        this.mySwiper._slideTo(0,"300",false);
    }

    goToNextHole(){
        this.saveRound();
        if (this.currHole==this.course.courseData.nbrHoles)
            this.currHole=1;
        else {
                this.currHole++;
                this.currShot=1;
                this.puttDist=null;
                if (!this.round.roundData.holes[this.currHole-1]) {
                    this.round.roundData.holes[this.currHole-1] = {};
                    this.round.roundData.holes[this.currHole-1].shots=[];
                    this.round.roundData.holes[this.currHole-1].shots[this.currShot-1]={};
                    this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].lie="F";
                    this.round.roundData.holes[this.currHole-1].shots[this.currShot-1].power="F";
                }
            }
        this.mySwiper._slideTo(0,"300",false);
    }

    goToPrevHole() {
        if (this.currHole>1) {
            this.currHole--;    
            this.currShot=1;
        }
    }

    attached() {
        super.attached();
        this.i18n.updateTranslations(this.element);
        //Initialize swiper
        this.mySwiper = this.f7.swiper('.swiper-container', {
            speed: 400,
            pagination:'.swiper-pagination',
            paginationHide: false,
            paginationClickable: true,
            nextButton: '.swiper-button-next',
            prevButton: '.swiper-button-prev',
            spaceBetween: 100
        });
        let _self = this;
        console.log("[attaching Round view]round : "+JSON.stringify(this.round));
        if (!this.round.playerName) {
            this.f7.prompt('What is your name?','Round management', function (value) {
                if (!value)
                    value = "unknown";
                _self.round.playerName = value;
    //            this..alert('Your name is "' + value + '". You clicked Ok button');
            });
        }
    }

    saveRound() {
        let _self = this;
        console.log("saving round");
        this.round.lastUpdated = new Date().toISOString();
        let docToSave = this.round;
        this.pouch.saveDoc(this.round)
            .then(response => {
                if (response.ok) { 
                    _self.round._id=response.id;
                    console.log("roundData is : "+JSON.stringify(_self.round));
                } else {
                    _self.f7.alert("Problem with creation or update",'GolfStatApp');
                }
            });
    }

    deleteRound() {
        let _self = this;
        this.f7.confirm('Are you sure ?', 'GolfStatApp', function () {
            let result = _self.pouch.deleteDoc(_self.round).then(response => {
                if (response.ok)
                    _self.f7.alert('Round deleted', 'GolfStatApp', function () {
                        _self.router.navigateToRoute('search');
                    });
                else
                    _self.f7.alert('problem with deletion', 'GolfStatApp');
                }
            ).catch(err => _self.f7.alert('problem with deletion', 'GolfStatApp'));
        });
    }
    
    cancel() {
        this.router.navigateBack();
    }

    showDate(ISODateString) {
        return ISODateString.substring(0,10)
    } 

    getGPSData(){
        return new Promise((resolve, reject) => {
                // http is either the aurelia-fetch-client or aurelia-http-client
                navigator.geolocation.getCurrentPosition(function(position) {
                console.log('Latitude: '          + position.coords.latitude          + '\n' +
                    'Longitude: '         + position.coords.longitude         + '\n' +
                    'Accuracy: '          + position.coords.accuracy          + '\n' +
                    'Timestamp: '         + position.timestamp                + '\n');
                let retValue = {lat:position.coords.latitude,long:position.coords.longitude};
                console.log("[getGPSData - return]Resolving position "+JSON.stringify(retValue));
                resolve(retValue);
            }, 
            function onError(error) {
                console.log("[getGPSData]ERROR")
                reject(error);
            },
            { maximumAge: 3000, timeout: 5000, enableHighAccuracy: true });
        });
    }

    wait3Seconds(){
        return new Promise((resolve,reject) => {
            setTimeout(function(){
                resolve();
            }, 300);
        })
    }

    computeDistance(lat1d,long1d,lat2d,long2d) {

        var Rm = 3961; // mean radius of the earth (miles) at 39 degrees from the equator
    	var Rk = 6373; // mean radius of the earth (km) at 39 degrees from the equator

		// convert coordinates to radians
		let lat1 = this.deg2rad(lat1d);
		let lon1 = this.deg2rad(long1d);
		let lat2 = this.deg2rad(lat2d);
		let lon2 = this.deg2rad(long2d);
		
		// find the differences between the coordinates
		let dlat = lat2 - lat1;
		let dlon = lon2 - lon1;
		
		// here's the heavy lifting
		let a  = Math.pow(Math.sin(dlat/2),2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon/2),2);
		let c  = 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); // great circle distance in radians
		let dm = c * Rm; // great circle distance in miles
		let dk = c * Rk; // great circle distance in km
		
		// round the results down to the nearest 1/1000
		let mi = this._round(dm);
		let km = this._round(dk);

        return(km*1000);
    }

    // convert degrees to radians
	deg2rad(deg) {
		let rad = deg * Math.PI/180; // radians = degrees * pi/180
		return rad;
	}
	
	
	// round to the nearest 1/1000
	_round(x) {
		return Math.round( x * 1000) / 1000;
	}


}
