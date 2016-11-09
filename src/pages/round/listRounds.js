import { Pouch } from '../../services/pouch';
import { F7 } from '../../services/f7';
import {inject} from 'aurelia-framework';
import { Router } from 'aurelia-router';
import {I18N,BaseI18N} from 'aurelia-i18n';
import {EventAggregator} from 'aurelia-event-aggregator';


@inject(F7, Router, Pouch,I18N, Element,EventAggregator)
export class ListRounds extends BaseI18N {

    constructor(f7, router, pouch, i18n, element, eventAggregator) {
        super(i18n,element,eventAggregator);
        this.i18n = i18n;
        this.f7 = f7;
        this.router = router;
        this.pouch = pouch;
        this.rounds = [];
        this.course = '';
    }

     attached() {
        super.attached();
        this.i18n.updateTranslations(this.element);
    }

    activate(params) {
        if (params.id) {
            this.pouch.getDoc(params.id).then(c => this.course = c);
            this.pouch.getCollection("roundListView").then(rounds => rounds.map(r => 
            {
                if (r.doc.roundData.courseId == params.id)
                    this.rounds.push(r.doc)
            }));
        }
    }


    getDateTime(ISODateString) {
        return({day:ISODateString.substring(0,10),hour:ISODateString.substring(11,16)})
    }

    getRoundScore(round) {
        console.log(JSON.stringify(this.rounds));
        var totalShots = 0
        round.roundData.holes.map(h => {totalShots = totalShots+h.shots.length;});
        return (totalShots);
    }

    deleteRound(round) {
        let _self = this;
        let courseId = round.roundData.courseId;
        this.f7.confirm('Es-tu sûr ?', 'GolfStatApp', function () {
            let result = _self.pouch.deleteDoc(round).then(response => {
                if (response.ok) {
                    let _self1 = _self;
                    _self.rounds = [];
                    _self.f7.alert('Round supprimé', 'GolfStatApp', function () {
                        _self1.pouch.getCollection("roundListView").then(rounds => rounds.map(r => 
                        {
                            if (r.doc.roundData.courseId == _self1.course._id)
                                _self1.rounds.push(r.doc)
                        }));
                    });
                } else
                    _self.f7.alert('problème dans la suppression', 'GolfStatApp');
                }
            ).catch(err => _self.f7.alert('problème dans la suppression', 'GolfStatApp'));
        });
    }

    editRound(round) {
        this.router.navigateToRoute('editRound', {roundId: round._id});
    }

    viewRound(round) {
        this.router.navigateToRoute('viewRound', {roundId: round._id});
    }

    viewRoundStats(round) {
        this.router.navigateToRoute('roundStats', {id: round._id});
    }

  }
