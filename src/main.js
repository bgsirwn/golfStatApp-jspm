import 'bootstrap';

import {I18N} from 'aurelia-i18n';
import Backend from 'i18next-xhr-backend'; // <-- your previously installed backend plugin

export function configure(aurelia) {
  aurelia.use
    .standardConfiguration()
    .developmentLogging()
    .plugin('aurelia-i18n', (instance) => {
        // register backend plugin
        instance.i18next.use(Backend);

        // adapt options to your needs (see http://i18next.com/docs/options/)
        // make sure to return the promise of the setup method, in order to guarantee proper loading
        return instance.setup({
          backend: {                                  // <-- configure backend settings
            loadPath: './locale/{{lng}}/{{ns}}.json', // <-- XHR settings for where to get the files from
          },
          lng : 'fr-FR',
          attributes : ['t','i18n'],
          fallbackLng : 'en-US',
          debug : false
        });
      })
      .plugin('aurelia-validation');


  //Uncomment the line below to enable animation.
  //aurelia.use.plugin('aurelia-animator-css');
  //if the css animator is enabled, add swap-order="after" to all router-view elements

  //Anyone wanting to use HTMLImports to load views, will need to install the following plugin.
  //aurelia.use.plugin('aurelia-html-import-template-loader')

  aurelia.start().then(() => aurelia.setRoot());
}
