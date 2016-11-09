import { Pouch } from '../../services/pouch';
import { F7 } from '../../services/f7';
import {inject,DOM} from 'aurelia-framework';
import { Router } from 'aurelia-router';
import {I18N,BaseI18N} from 'aurelia-i18n';
import {EventAggregator} from 'aurelia-event-aggregator';
import Chart from 'chart.js'
//import palette from '../../services/palette.js'

@inject(F7, Router, Pouch,I18N, Element, DOM ,EventAggregator)
export class RoundStats extends BaseI18N {

    constructor(f7, router, pouch, i18n, element, DOM, eventAggregator) {
        super(i18n,element,eventAggregator);
        this.DOM = DOM;
        this.i18n = i18n;
        this.f7 = f7;
        this.router = router;
        this.pouch = pouch;
        this.round = {};
        this.course = {};
        this.brutScore = 0, this.netScore = 0, this.stbScore = 0;
        this.fwhits = 0, this.fw = 0, this.gir = 0, this.fwr = 0, this.fwl = 0, this.rr = 0, this.rl = 0;
        this.nbrputts = 0, this.nbrpenalties = 0, this.nbrPuttsGIR = 0;
        this.par3s = {nbr:0,sum:0}, this.par4s = {nbr:0,sum:0}, this.par5s = {nbr:0,sum:0};
        this.nbrEagles = 0, this.nbrBirdies = 0, this.nbrPars = 0, this.nbrBogeys = 0, this.nbrDoubleBogeys = 0;
        this.playerPlayingHcp = 20;
        // Define a plugin to provide data labels
        Chart.plugins.register({
            afterDatasetsDraw: function(chartInstance, easing) {
                // To only draw at the end of animation, check for easing === 1
                var ctx = chartInstance.chart.ctx;
                chartInstance.data.datasets.forEach(function (dataset, i) {
                    var meta = chartInstance.getDatasetMeta(i);
                    if (!meta.hidden) {
                        meta.data.forEach(function(element, index) {
                            // Draw the text in black, with the specified font
                            ctx.fillStyle = 'rgb(0, 0, 0)';
                            var fontSize = 16;
                            var fontStyle = 'normal';
                            var fontFamily = 'Helvetica Neue';
                            ctx.font = Chart.helpers.fontString(fontSize, fontStyle, fontFamily);
                            // Just naively convert to string for now
                            var dataString = dataset.data[index].toString();
                            // Make sure alignment settings are correct
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            var padding = 5;
                            var position = element.tooltipPosition();
                            if (dataString != "0") {
                                switch (meta.type) {
                                    case "horizontalBar": ctx.fillText(dataString, position.x-(fontSize*dataString.length)-padding, position.y); break;
                                    case "pie": ctx.fillText(dataString, position.x, position.y); break;
                                    case "bar": ctx.fillText(dataString, position.x, position.y - (fontSize / 2) - padding); break;
                                }
                            }
                        });
                    }
                });
            }
        });

    }

     attached() {
        super.attached();
        this.i18n.updateTranslations(this.element);
        this.showScoreByParStats();
        this.showScoring();
        this.showDriveAccuracy();
        this.showGreenInRegulation();
        this.showPuttStats();
    }

    async activate(params) {
        if (params.id) {
            this.round = await this.pouch.getDoc(params.id);
            this.course = await this.pouch.getDoc(this.round.roundData.courseId);
            this.calculateStats();
        }
    }

    calculateStats() {
        //Stats are : Brut Score, Net score (brut and Stableford), %FW Hits, %Rough Right & Left, %GIR, #Putts, #Penalties
        for (let i=0;i<this.round.roundData.holes.length;i++) {
            //Brut and net score
            this.brutScore = this.brutScore+this.round.roundData.holes[i].shots.length;
            this.stbScore = this.stbScore+this.calculateStbPointsPerHole(this.playerPlayingHcp,this.course.courseData.holes[i].strokeIndex)+this.course.courseData.holes[i].par-this.round.roundData.holes[i].shots.length+2;
            // count nbr of eagles, birdies, ...
            switch (this.round.roundData.holes[i].shots.length-this.course.courseData.holes[i].par) {
                case -3 : this.nbrEagles++; break;
                case -2 : this.nbrEagles++; break;
                case -1 : this.nbrBirdies++; break;
                case 0 : this.nbrPars++; break;
                case 1 : this.nbrBogeys++; break;
                case 2 : this.nbrDoubleBogeys++; break;
                default : this.nbrDoubleBogeys++; break;
            }
            //count nbr of par3, 4 and 5 and sum on each
            switch (this.course.courseData.holes[i].par) {
                case "3" : this.par3s.nbr++; this.par3s.sum=this.par3s.sum+this.round.roundData.holes[i].shots.length; break;
                case "4" : this.par4s.nbr++; this.par4s.sum=this.par4s.sum+this.round.roundData.holes[i].shots.length; break;
                case "5" : this.par5s.nbr++; this.par5s.sum=this.par5s.sum+this.round.roundData.holes[i].shots.length; break;                
            }
            //Fairway hits
            if (this.course.courseData.holes[i].par>3) {
                switch (this.round.roundData.holes[i].shots[1].lie) {
                    case "F": this.fwhits++; break;
                    case "R": if (this.round.roundData.holes[i].shots[1].leftright && this.round.roundData.holes[i].shots[1].leftright=="R")
                                    this.fwr++;
                                else this.fwl++;
                                break;
                }
            } 
            //count # of fairways only on par 4 and 5s
            if (this.course.courseData.holes[i].par>3)
                this.fw++;
            //# of GIR
            if (this.round.roundData.holes[i].shots[this.course.courseData.holes[i].par-2].club && 
                this.round.roundData.holes[i].shots[this.course.courseData.holes[i].par-2].club=="Putt")
                this.gir++;
            for (let j=0;j<this.round.roundData.holes[i].shots.length;j++) {
                // sum all putts and putts done when GIR
                if (this.round.roundData.holes[i].shots[j].club && this.round.roundData.holes[i].shots[j].club=="Putt") {
                    this.nbrputts++;
                    if (this.round.roundData.holes[i].shots[this.course.courseData.holes[i].par-2].club && 
                        this.round.roundData.holes[i].shots[this.course.courseData.holes[i].par-2].club=="Putt")
                        this.nbrPuttsGIR++;
                }
                // sums all rough left and right
                if (this.round.roundData.holes[i].shots[j].lie && this.round.roundData.holes[i].shots[j].lie=="R") {
                    if (this.round.roundData.holes[i].shots[j].leftright && this.round.roundData.holes[i].shots[j].leftright=="R")
                        this.rr++;
                    else this.rl++;
                }
                // count penalties
                if (this.round.roundData.holes[i].shots[j].penalty)
                    this.nbrpenalties++;
            }            
        }
        this.netScore = this.brutScore - this.playerPlayingHcp;
    }

    calculateStbPointsPerHole(playHcp,strokeIndex) {
        let retVal = Math.trunc(playHcp/18);
        if (playHcp-(retVal*18)*18-strokeIndex>=0 || playHcp-(retVal*18)*18-strokeIndex<strokeIndex)
            retVal++;
        return retVal;
    }

    roundTo(x,decimals) {
        return (Math.round(x*Math.pow(10,decimals))/Math.pow(10,decimals))
    }

    generateColorPalette(scheme,nbColors,transparency) {
       var colPal=[];
       var palTol = [
            ['4477aa'],
            ['4477aa', 'cc6677'],
            ['4477aa', 'ddcc77', 'cc6677'],
            ['4477aa', '117733', 'ddcc77', 'cc6677'],
            ['332288', '88ccee', '117733', 'ddcc77', 'cc6677'],
            ['332288', '88ccee', '117733', 'ddcc77', 'cc6677', 'aa4499'],
            ['332288', '88ccee', '44aa99', '117733', 'ddcc77', 'cc6677', 'aa4499'],
            ['332288', '88ccee', '44aa99', '117733', '999933', 'ddcc77', 'cc6677',
            'aa4499'],
            ['332288', '88ccee', '44aa99', '117733', '999933', 'ddcc77', 'cc6677',
            '882255', 'aa4499'],
            ['332288', '88ccee', '44aa99', '117733', '999933', 'ddcc77', '661100',
            'cc6677', '882255', 'aa4499'],
            ['332288', '6699cc', '88ccee', '44aa99', '117733', '999933', 'ddcc77',
            '661100', 'cc6677', '882255', 'aa4499'],
            ['332288', '6699cc', '88ccee', '44aa99', '117733', '999933', 'ddcc77',
            '661100', 'cc6677', 'aa4466', '882255', 'aa4499']
        ];
        var genPalTol = palTol[nbColors-1];
        genPalTol.map((c,i) => colPal[i] = 'rgba('+parseInt(c.substring(0,2),16)+', '+parseInt(c.substring(2,4),16)+', '+parseInt(c.substring(4,6),16)+', '+transparency+')');
        return colPal;
    }

    showDriveAccuracy() {
        //Drive accuracy Stats
        let ctxDriveAccuracy = this.DOM.getElementById('driveAccuracy');
        var puttStatChart = new Chart(ctxDriveAccuracy, {
            type: 'pie',
            data: {
                labels: ["Fairway hits", "Rough Left", "Rough Right"],
                datasets: [{
                    label: 'Putting average',
                    data: [this.roundTo(this.fwhits/this.fw*100,0),
                           this.roundTo(this.fwl/this.fw*100,0),
                           this.roundTo(this.fwr/this.fw*100,0)],
                    backgroundColor: this.generateColorPalette('tol',3,0.4),
                    borderColor: this.generateColorPalette('tol',3,1),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: false,
                title: {
                    display: true,
                    fontSize: 20,
                    text: 'Driving Accuracy'
                },
                legend: {
                    display: true,
                    labels: {
                        fontColor: 'rgb(0, 0, 0)'
                        }
                }
            }
        });
    }

    showScoring() {
        //Drive accuracy Stats
        let ctxScoring = this.DOM.getElementById('scoring');
        var scoringChart = new Chart(ctxScoring, {
            type: 'pie',
            data: {
                labels: ["Eagles +", "Birdies", "Par", "Bogeys", "Double Bogeys +"],
                datasets: [{
                    label: 'Scoring',
                    data: [this.nbrEagles, this.nbrBirdies, this.nbrPars, this.nbrBogeys, this.nbrDoubleBogeys],
                    backgroundColor: this.generateColorPalette('tol',5,0.4),
                    borderColor: this.generateColorPalette('tol',5,1),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: false,
                title: {
                    display: true,
                    fontSize: 20,
                    text: 'Scoring'
                },
                legend: {
                    display: true,
                    labels: {
                        fontColor: 'rgb(0, 0, 0)'
                        }
                }
            }
        });
    }

    showPuttStats() {
        //putting Stats
        let ctxPuttStat = this.DOM.getElementById('puttstats');
        var puttStatChart = new Chart(ctxPuttStat, {
            type: 'horizontalBar',
            data: {
                labels: ["per hole", "per GIR"],
                datasets: [{
                    label: 'Putting average',
                    data: [this.roundTo(this.nbrputts/this.course.courseData.holes.length,1),
                           this.roundTo(this.nbrPuttsGIR/this.gir,1)],
                    backgroundColor: this.generateColorPalette('tol',2,0.4),
                    borderColor: this.generateColorPalette('tol',2,1),
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    xAxes: [{
                        ticks: {
                            beginAtZero:true
                        }
                    }]
                },
                responsive: false,
                title: {
                    display: true,
                    fontSize: 20,
                    text: 'Putting average'
                },
                legend: {
                    display: false,
                    labels: {
                        fontColor: 'rgb(255, 99, 132)'
                    }
                }
            }
        });        
    }

    showScoreByParStats() {
        //putting Stats
        let ctxScorePerParStat = this.DOM.getElementById('scorePerParStats');
        var puttStatChart = new Chart(ctxScorePerParStat, {
            type: 'horizontalBar',
            data: {
                labels: ["per par 3", "per par 4", "per par 5"],
                datasets: [{
                    label: 'Putting average',
                    data: [this.roundTo(this.par3s.sum/this.par3s.nbr,1),
                           this.roundTo(this.par4s.sum/this.par4s.nbr,1),
                           this.roundTo(this.par5s.sum/this.par5s.nbr,1)],
                    backgroundColor: this.generateColorPalette('tol',3,0.4),
                    borderColor: this.generateColorPalette('tol',3,1),
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    xAxes: [{
                        ticks: {
                            beginAtZero:true
                        }
                    }]
                },
                responsive: false,
                title: {
                    display: true,
                    fontSize: 20,
                    text: 'Scores per par'
                },
                legend: {
                    display: false,
                    labels: {
                        fontColor: 'rgb(0, 0, 0)'
                    }
                }
            }
        });        
    }

    showGreenInRegulation() {
        //GIR stats
        let ctxGIRStat = this.DOM.getElementById('GIRstats');
        var GIRStatChart = new Chart(ctxGIRStat, {
            type: 'pie',
            data: {
                labels: ["GIR", "missed"],
                datasets: [{
                    label: 'GIR',
                    data: [this.roundTo(this.gir/this.course.courseData.holes.length*100,0),
                           100-this.roundTo(this.gir/this.course.courseData.holes.length*100,0)],
                    backgroundColor: this.generateColorPalette('tol',2,0.4),
                    borderColor: this.generateColorPalette('tol',2,1),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: false,
                title: {
                    display: true,
                    fontSize: 20,
                    text: 'Greens in Regulation'
                },
                legend: {
                    display: true,
                    labels: {
                        fontColor: 'rgb(0, 0, 0)'
                    }
                }
            }
        });
        
    }
  }
