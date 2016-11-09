import { Pouch } from '../../services/pouch';
import { F7 } from '../../services/f7';
import {inject} from 'aurelia-framework';
import { Router } from 'aurelia-router';
import {I18N,BaseI18N} from 'aurelia-i18n';
import {EventAggregator} from 'aurelia-event-aggregator';


@inject(F7, Router, Pouch,I18N, Element,EventAggregator)
export class viewRound extends BaseI18N {
    
    clubList = [{code:"DR",disp:"Drive"},{code:"3W",disp:"3 Wood"},{code:"5W",disp:"5 Wood"},{code:"I3",disp:"Iron 3"},{code:"I4",disp:"Iron 4"},{code:"I5",disp:"Iron 5"},
                {code:"I6",disp:"Iron 6"},{code:"I7",disp:"Iron 7"},{code:"I8",disp:"Iron 8"},{code:"I9",disp:"Iron 9"},{code:"P",disp:"Pitch"},{code:"50",disp:"Wedge 50°"},
                {code:"52",disp:"Wedge 52°"},{code:"54",disp:"Wedge 54°"},{code:"56",disp:"Wedge 56°"},{code:"58",disp:"Wedge 58°"},{code:"60",disp:"Wedge 60°"},{code:"64",disp:"Wedge 64°"}];
    ballLies = [{code:"OOB",disp:"Out of bounds"},{code:"F",disp:"Fairway"},{code:"R",disp:"Rough"},{code:"G",disp:"Green"},{code:"B",disp:"Bunker"},{code:"H",disp:"Hazard"}];
    ballRightLeft = [{code:"R",disp:"Right"},{code:"L",disp:"Left"},{code:"A",disp:"After"}];
    powerList = [{code:"F",disp:"Full"},{code:"10:30",disp:"10:30"},{code:"0900",disp:"9:00"},{code:"0730",disp:"7:30"},{code:"C",disp:"Chip"}];

    constructor(f7, router, pouch, i18n, element, eventAggregator) {
        super(i18n,element,eventAggregator);
        this.i18n = i18n;
        this.f7 = f7;
        this.router = router;
        this.pouch = pouch;
        this.round = {};
        this.course = {};
        this.roundForDisplay = [];
        this.shotsForSelHole=[];
        this.selectedHole = 0;
    }

     attached() {
        super.attached();
        this.i18n.updateTranslations(this.element);
    }

    async activate(params) {
        console.log('[viewRound] activate called - params is :'+JSON.stringify(params));
        var _self = this;
        if (params.roundId) {
            await this.pouch.getDoc(params.roundId).then(round => _self.round = round);     
            await this.pouch.getDoc(this.round.roundData.courseId).then(course => _self.course = course);     
        }
        this.prepareForDisplay();
        console.log('[viewRound] activate called end'+JSON.stringify(this.round));
    }

    getDateTime(ISODateString) {
        return({day:ISODateString.substring(0,10),hour:ISODateString.substring(11,16)})
    }

    prepareForDisplay() {
        let headerLine = [];
        let parLine = {pars:[],sum:0};
        let scoreLine = {scores:[],sum:0};
        let table = {};
        let bcolor = '', tcolor = '';
        for (let i=0; i<this.round.roundData.holes.length;i++) {
            if (i>0 && i%9 == 0) {
                table = {line1:headerLine,line2:parLine,line3:scoreLine};
                this.roundForDisplay.push(table);
                headerLine = [], parLine = {pars:[],sum:0}, scoreLine = {scores:[],sum:0}, table = {}; 
            }
            headerLine.push(i+1);
            parLine.pars.push(this.course.courseData.holes[i].par);
            parLine.sum += parseInt(this.course.courseData.holes[i].par,10);
            switch (this.round.roundData.holes[i].shots.length-this.course.courseData.holes[i].par) {
                case (-2) : bcolor = 'yellow'; tcolor='white'; break;
                case (-1) : bcolor = 'red'; tcolor='white'; break;
                case (0) : bcolor = 'inherit'; tcolor='black'; break;
                case (1) : bcolor = 'blue'; tcolor='white'; break;
                case (2) :
                default : bcolor = 'black'; tcolor='white';
            }
            scoreLine.scores.push({s:this.round.roundData.holes[i].shots.length,bc:bcolor,tc:tcolor,hole:i});
            scoreLine.sum += parseInt(this.round.roundData.holes[i].shots.length,10);
        }
        if (headerLine.length != 0) {
            table = {line1:headerLine,line2:parLine,line3:scoreLine};
            this.roundForDisplay.push(table);
        }
    }

    selectHole(holeNum) {
        this.shotsForSelHole=[];
        this.selectedHole = holeNum+1;
        this.round.roundData.holes[holeNum].shots.map(s => {
            if (!s.penalty) {
                if (s.club != "Putt")
                    this.shotsForSelHole.push({club:this.getValueFromCode(this.clubList,s.club), power: this.getValueFromCode(this.powerList,s.power), 
                        lie:this.getValueFromCode(this.ballLies,s.lie), leftRight: this.getValueFromCode(this.ballRightLeft,s.leftright), distance : s.distance});
                else
                    this.shotsForSelHole.push({club:s.club, distance : s.putt});
            } else 
                this.shotsForSelHole.push({penalty:true});
        });
    }

    getValueFromCode(object,value) {
        for (let i=0;i<object.length;i++) {
            if (object[i].code == value) 
                return(object[i].disp);
        }
    }
  }
