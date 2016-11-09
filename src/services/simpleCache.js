export class SimpleCache {
	constructor() {
		this._hashmap = new Map();
		this.meetings  = [
        {id:"1",date:"2016-10-15",time:"10:00",location:"Justus Lipsius - room 50.7",duration:"2 hours",title:"COREPER I - meeting #248661",description:"trade secrets, insurance distribution and other topics"},
        {id:"2",date:"2016-10-22",time:"10:00",location:"Justus Lipsius - room 50.7",duration:"2 hours",title:"COREPER I - meeting #248662",description:"Immigration control"},
        {id:"3",date:"2016-10-19",time:"10:00",location:"Justus Lipsius - room 50.7",duration:"2 hours",title:"COREPER I - meeting #248663",description:"Commercial treatee with Canada"}
        ];
		this.agendaItems=[
			{id:"0",meetingid:"1",title:"Directive relating to a reduction in the sulphur content of certain liquid fuels",description:"Directive to reduce the emissions of sulphur dioxide resulting from the combustion of certain types of liquid fuels and thereby to reduce the harmful effects of such emissions on man and the environment.", type:"I", order:"1",DG:"dgenv"},
			{id:"1",meetingid:"1",title:"Directive on railway safety",description:"Meeting on common safety methods and targets", type:"I", order:"2",DG:"dgmove"},
			{id:"2",meetingid:"1",title:"Directive on trade secrets",description:"Measures, procedures and remedies related to the protection of undisclosed know-how and business information (trade secrets) against their unlawful acquisition, use and disclosure", type:"I", order:"3",DG:"dgtrade"},
			{id:"3",meetingid:"1",title:"Amendment Directive 2014/65/EU on markets in financial instruments",description:"Amendment of Article 89a", type:"II", order:"1",DG:"dgecfin"},
			{id:"4",meetingid:"1",title:"Directive 2016/97 on insurance distribution",description:"Article 5 : Breach of obligations when exercising the freedom to provide services", type:"II", order:"2",DG:"dgecfin"},
		];
	}

	get(key) {
		return this._hashmap.get(key);
	}

	set(key,object) {
		this._hashmap.set(key,object);
	}
	
	delete(key) {
		this._hashmap.delete(key);
	}
 
}