import { F7 } from '../../services/f7';
import {inject,DOM} from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { Pouch } from '../../services/pouch';
import {NewInstance} from 'aurelia-dependency-injection';
import {ValidationRules,ValidationController} from 'aurelia-validation';
import {BootstrapFormRenderer} from '../../bootstrap-validation/bootstrap-form-renderer'
import {I18N,BaseI18N} from 'aurelia-i18n';
import {EventAggregator} from 'aurelia-event-aggregator';

@inject(F7, Router, Pouch,NewInstance.of(ValidationController),I18N,Element,EventAggregator,BootstrapFormRenderer,DOM)
export class course extends BaseI18N {
    constructor(f7,router, pouch,controller,i18n,element,eventAggregator,bsRenderer,DOM) {
        console.log('Entering vin constructor');
        super(i18n,element,eventAggregator);
        this.f7 = f7;
        this.router = router;
        this.pouch = pouch;
		this.eventAggregator = eventAggregator;
        this.i18n = i18n;
        this.element = element;   
        this.DOM = DOM;     
    }
    
    activate(params) {
    }
 
    attached() {
        super.attached();
        DOM.addEventListener("deviceready",function (){console.log("navigator.geolocation works well")},false);
        var mainView = this.f7.addView('.view-main', {dynamicNavbar: true});
        this.i18n.updateTranslations(this.element);
        var _self = this;
        this.eventAggregator.subscribe("SyncStarts", function(){_self.showLoadingModal()} );
        this.eventAggregator.subscribe("dbUpToDate", function(){
                console.log('dbUpToDate Event received in attached'); 
        });
       return this.loadCourses();
    }

    get searchText() {
        return this._searchText;
    }

    set searchText(newValue) {
        this._searchText = newValue;
        this.coursesForSearch = [];
        if (newValue != '') {
            if (this._searchText.length>=3) {
            // Find matched items
                for (var i = 0; i < this.courses.length; i++) {
                    if (this.courses[i].courseData.courseName.toLowerCase().indexOf(this._searchText.toLowerCase()) >= 0) 
                        this.coursesForSearch.push(this.courses[i]);
                }
            }
        }
    }
    
    clearSearchBar() {
        this._searchText='';
        this.coursesForSearch = [];
    }   

    loadCourses() {
        var _self = this;
        return _self.pouch.getCollection("courseListView").then(courses => _self.courses = courses.map(v => v.doc));        
    }

        viewCourse(id) {
        this.router.navigateToRoute('course', {id: id});
    }

    startRound(id) {
        this.router.navigateToRoute('startRound', {id: id});
    }

    showLoadingModal() {
        var _self=this;
        this.eventAggregator.subscribeOnce("dbUpToDate", function() {
            console.log('dbUpToDate Event received in showLoadingModal'); 
            _self.f7.hidePreloader();
        });
        this.f7.showPreloader("Chargement des courses ...");
    }

    showDate(ISODateString) {
        return ISODateString.substring(0,10)
    } 
}
