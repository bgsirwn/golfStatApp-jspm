import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import { Router } from 'aurelia-router';
import { SimpleCache } from './simpleCache';
import {I18N} from 'aurelia-i18n';
import PouchDB from 'pouchdb';

//var db = new PouchDB('golfstat');
		
@inject(EventAggregator, Router, SimpleCache,I18N)
export class Pouch {
	constructor(eventAggregator, router, cache,i18n) {
		console.log("entering Pouch constructor");
		this.db = null;
		this.eventAggregator = eventAggregator;
		this.router = router;
		this.cache = cache;
		this.remoteServerUrl = "";
		this.i18n = i18n;
		this.init();
//		this.db = db;
//                this.db = new PouchDB('golfstat');
	}

	init() {
		var _self = this;
		this.db = new PouchDB('golfstat',{auto_compaction: true});
		this.db.setMaxListeners(20);
		this.db.info().then( info => {
  			console.log('We have a database: ' + JSON.stringify(info));
			this.db.get("config").then(result => {
				_self.remoteServerUrl = result.serverUrl;
				_self.locale = result.locale;
				result.locale
					?this.i18n.setLocale(result.locale).then(console.log('Langue adaptée -> '+result.locale))
					:this.i18n.setLocale("en-US").then(console.log('Langue par défaut -> '+"en-US"));
				_self.createDBViews();
				_self.eventAggregator.publish("SyncStarts");
				console.log('Start syncing with: ' + _self.remoteServerUrl);
				_self.syncDB();
			})
			.catch(err => _self.router.navigateToRoute('config'))
		});
	}

	syncDB(){
		var _self = this;
		this.db.sync(this.remoteServerUrl, {
			live: true,
			retry: true
			})
		.on('change', function (info) {
  			console.log('Database changed : ' + JSON.stringify(info));
		}).on('paused', function (err) {
			_self.dbUpToDate = true;
  			console.log('Database paused');
  			console.log('dbUpToDate Event emitted');
			//_self.loadRefDataInCache();
			_self.eventAggregator.publish("dbUpToDate");
		}).on('active', function () {
  			console.log('Database active : ');
		}).on('denied', function (err) {
  			console.log('Database access denied : ' + JSON.stringify(err));
		}).on('complete', function (info) {
  			console.log('Database access completed : ' + JSON.stringify(info));
		}).on('error', function (err) {
  			console.log('Database error : ' + JSON.stringify(err));
		});		
	}
	
/*	loadOriginesRefList() {
		var _self = this;
        return this.db.query('indexOrigine',{include_docs:true}).then(result => _self.cache.set("originesRefList",result.rows));
    }

    loadAppellationsRefList() {
		var _self = this;
        return this.db.query('indexAppellation',{include_docs:true}).then(result => _self.cache.set("appellationsRefList",result.rows));
    }

    loadTypesRefList() {
		var _self = this;
        return this.db.query('indexType',{include_docs:true}).then(result => _self.cache.set("typesRefList",result.rows));
    }
    
    loadRefDataInCache() {
        return Promise.all([this.loadOriginesRefList(),this.loadAppellationsRefList(),this.loadTypesRefList()]);
    }
*/
	createDesignDoc(name, mapFunction, reduceFunction) {
		var ddoc = {
			_id: '_design/' + name,
			views: {
			}
		};
		if (reduceFunction) 
			ddoc.views[name] = { map: mapFunction.toString(), reduce: reduceFunction.toString() };
		else 
			ddoc.views[name] = { map: mapFunction.toString() };
		return ddoc;
	}
 
	createDBViews() {
		// Creation des view dans DB locale
		console.log("Création des vues ...");
		// view used to get all courses
		var courseListView = this.createDesignDoc('courseListView', function (doc) {
				if (doc && doc.type == 'course') {emit(doc.courseData);}
			});
		this.db.put(courseListView).then(doc => console.log("courseListView created")).catch(err => console.log("courseListView already exists: " + JSON.stringify(err)));

		// view used to get all rounds
		var roundListView = this.createDesignDoc('roundListView', function (doc) {
				if (doc && doc.type == 'round') {emit(doc.roundData);}
			});
		this.db.put(roundListView).then(doc => console.log("roundListView created")).catch(err => console.log("roundListView already exists: " + JSON.stringify(err)));

		// view used to get all players
		var playerListView = this.createDesignDoc('playerListView', function (doc) {
				if (doc && doc.type == 'player') {emit(doc.playerData);}
			});
		this.db.put(playerListView).then(doc => console.log("playerListView created")).catch(err => console.log("playerListView already exists: " + JSON.stringify(err)));


		// view to be used for reports
		var reportVinView = this.createDesignDoc('reportVin', 
				function(doc) {
					if(doc && doc.nbreBouteillesReste && parseInt(doc.nbreBouteillesReste,10)>0) {
							emit([doc.type.nom,doc.origine.pays,doc.origine.region,doc.nom,doc.annee], parseInt(doc.nbreBouteillesReste,10));
					}
				},"_sum");
		this.db.put(reportVinView).then(doc => console.log("reportVinView created")).catch(err => console.log("reportVinView already exists: " + JSON.stringify(err)));
	}
	
	nuke() {
		return this.db.destroy();
	}

	swithchDB(newConfig) {
		var _self = this;
		this.nuke().then(response => {
			console.log("DB destroyed");
			_self.db = new PouchDB('golfstat');
			_self.createSettings(newConfig).then(result => {
				console.log("new config saved");
				_self.init();
			})
		});		
	}

	createSettings(config){
		let _self = this;
		return this.db.get(config.id).then(doc => {
			// config doc exists, doc._rev is used to update)
			console.log("existing config loaded");
			return _self.db.put({
				serverUrl: config.serverUrl,
				locale : config.locale
			}, 'config', doc._rev);
		}).catch(function (err) {
			// no config document exists
			console.log("no existing config "+JSON.stringify(err));
			return _self.db.put({
				_id:"config",
				serverUrl: config.serverUrl,
				locale : config.locale
			});
		});
	}

	/*******************************************************************

						GENERIC

	********************************************************************/

	getDoc( id ) {
		return this.db.get(id).then( result => {
			return result;
		}).catch( error => {
			console.error( error );
			return error;
		});
	}
	
	deleteDoc( doc ) {
		return this.db.remove(doc._id, doc._rev).then( result => {
			return result;
		}).catch( error => {
			console.error( error );
			return error;
		});
	}
	
	saveDoc(doc) {
		let _self = this;
		if (doc._id) {
			return this.db.get(doc._id).then(resultDoc => {
				doc._rev = resultDoc._rev;
				return _self.db.put(doc);
			}).then(response => {
				return response;
			}).catch(err => {
				if (err.status == 404) {
					return this.db.put(doc).then(response => { return response }
							).catch(err => {
								console.log(err);
								return err;
							});
				} else {
					console.log(err);
					return err;
				}
			});
		} else {
			return this.db.post(doc).then(response => { return response }
			).catch(err => {
				console.log(err);
				return err;
			});
		}		
	}
	
	createDoc(doc) {
		return this.db.post(doc).then(response => { return response }
			).catch(err => {
				console.log(err);
				return err;
			});
	}
	
	getCollection(viewName){
		return this.db.query(viewName,{include_docs:true})
		.then(result => {return result.rows}).catch(err => {console.log(err); return err;});
	}
	
	/*******************************************************************

						Convenience functions

	********************************************************************/
	getAllDocs() {
		return this.db.allDocs({include_docs: true}).then( result => {
			return result.rows.filter( row => {
				if( !row.doc._id.match(new RegExp("^vin","i")) ) {
					return false;
				} else {
					return true;
				}
			});
		});
	}
	
	/*******************************************************************

						SETTINGS

	********************************************************************/

	getSettings() {
		return this.db.get('settings').then( result => {
			return result;
		}).catch( error => {
			console.warn('Settings do not exist yet');

		});
	}

	updateSettings( settings ) {
		return this.db.get('settings').then( settingsDoc => {
			settings._rev = settingsDoc._rev;
			settings._id = 'settings';
		  	return this.db.put( settings ).then( result => {
		  		return settings;
		  	});
		}).catch( err => {
			console.error( err );
		  	return null;
		});
	}

/*	createSettings() {
		return this.db.get('settings').catch( err => {
		  	// default settings
		  	if (err.status === 404) {
		    	return {	
		      		_id: 'settings',
		      		auto_start: false,
		      		default_project: null,
		      		remove_related: true
		    	};
		  	} else {
		    	throw err;
		  	}
		}).then( set => {
		  	return this.db.put( set ).then( result => {
		  		return set;
		  	});
		}).catch( err => {
			console.error( err );
		  	return null;
		});
	}
*/
	/**
	 * Generates a GUID string.
	 * @returns {String} The generated GUID.
	 * @example af8a8416-6e18-a307-bd9c-f2c947bbb3aa
	 * @author Slavik Meltser (slavik@meltser.info).
	 * @link http://slavik.meltser.info/?p=142
	 */
	guid() {
		function _p8(s) {
			var p = (Math.random().toString(16)+"000000000").substr(2,8);
	//        return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
	// modified version to return 32 characters as a cloudant id
			return s ? p.substr(0,4) + p.substr(4,4) : p ;
		}
		return _p8() + _p8(true) + _p8(true) + _p8();
	}

}
