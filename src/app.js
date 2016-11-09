import {inject} from 'aurelia-framework';

export class App {
    
    configureRouter(config, router) {
        config.title = 'Golf Stat App';
        config.map([
            {
                route: ['', 'search'],
                name: 'search',
                moduleId: 'pages/course/searchCourse',
                nav: true,
                title: 'View Search Course',
            }, {
                route: ['course', 'course/:id'],
                name: 'course',
                moduleId: 'pages/course/course',
                nav: true,
                title: 'View course',
            }, {
                route: ['config'],
                name: 'config',
                moduleId: 'pages/configuration/config',
                nav: true,
                title: 'Configuration',
            } , {
                route: ['stats'],
                name: 'stats',
                moduleId: 'pages/stats/stats',
                nav: true,
                title: 'test',
            } , {
                route: ['test'],
                name: 'test',
                moduleId: 'pages/test/test',
                nav: true,
                title: 'test',
            } , {
                route: 'viewRounds/course/:id',
                name: 'viewRounds',
                moduleId: 'pages/round/listRounds',
                nav: true,
                href: '#',
                title: 'View rounds',
            } , {
                route: 'roundStats/round/:id',
                name: 'roundStats',
                moduleId: 'pages/round/roundStats',
                nav: true,
                href: '#',
                title: 'View round stats',
            }, {
                route: ['coursesPlayed'],
                name: 'coursesPlayed',
                moduleId: 'pages/round/coursesPlayedList',
                nav: true,
                title: 'View Courses played',
            } , {
                route: ['startRound/course/:id'],
                name: 'startRound',
                moduleId: 'pages/round/round',
                nav: true,
                href: '#',
                title: 'Start round',
            }, {
                route: ['viewRound/round/:roundId'],
                name: 'viewRound',
                moduleId: 'pages/round/viewRound',
                nav: true,
                href: '#',
                title: 'View round',
            }, {
                route: ['editRound/round/:roundId'],
                name: 'editRound',
                moduleId: 'pages/round/round',
                nav: true,
                href: '#',
                title: 'Edit round',
            } 
        ]);

        this.router = router;
    }
    
   goBack() {
      history.back();
   }
	
   goForward(){
      history.forward();
   }
   

}
