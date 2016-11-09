import { Pouch } from '../../services/pouch';
import { F7 } from '../../services/f7';
import {inject} from 'aurelia-framework';
import { Router } from 'aurelia-router';
import {I18N,BaseI18N} from 'aurelia-i18n';
import {EventAggregator} from 'aurelia-event-aggregator';


@inject(F7, Router, Pouch,I18N, Element,EventAggregator)
export class coursesPlayedList extends BaseI18N {

    constructor(f7, router, pouch, i18n, element, eventAggregator) {
        super(i18n,element,eventAggregator);
        this.i18n = i18n;
        this.f7 = f7;
        this.router = router;
        this.pouch = pouch;
        this.coursesPlayed = [];

        this.pouch.getCollection("roundListView").then(rounds => rounds.map(r => {
                if (this.coursesPlayed.find(function(e){return (e.name == r.doc.roundData.courseName)} )=== undefined)
                    this.coursesPlayed.push({name:r.doc.roundData.courseName,courseId:r.doc.roundData.courseId});
            }
        ));
    }

     attached() {
        super.attached();
        this.i18n.updateTranslations(this.element);
    }

    viewRoundForCourse(courseId) {
        this.router.navigateToRoute('viewRounds', {id: courseId});
    }


  }
