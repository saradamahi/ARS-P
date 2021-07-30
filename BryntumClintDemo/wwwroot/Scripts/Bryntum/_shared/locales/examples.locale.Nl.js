import LocaleManager from '../../../lib/Core/localization/LocaleManager.js';
//<umd>
import LocaleHelper from '../../../lib/Core/localization/LocaleHelper.js';
import Nl from '../../../lib/SchedulerPro/localization/Nl.js';
import SharedNl from './shared.locale.Nl.js';

const examplesNlLocale = LocaleHelper.mergeLocales(SharedNl, {

    extends : 'Nl',

    Column : {
        Capacity           : 'Capaciteit',
        City               : 'Stad',
        Company            : 'Bedrijf',
        Duration           : 'Looptijd',
        'Employment type'  : 'Type werkgeverschap',
        End                : 'Einde',
        'First name'       : 'Voornaam',
        Id                 : '#',
        Machines           : 'Machines',
        Name               : 'Naam',
        'Nbr tasks'        : 'Numerieke taken',
        'Production line'  : 'Productielijn',
        Rating             : 'Beoordeling',
        Role               : 'Rol',
        Score              : 'Score',
        Staff              : 'Personeel',
        Start              : 'Begin',
        Surname            : 'Achternaam',
        'Task color'       : 'Taakkleur',
        Type               : 'Type',
        'Unassigned tasks' : 'Niet-toegewezen taken'
    }

});

LocaleHelper.publishLocale('Nl', Nl);
LocaleHelper.publishLocale('NlExamples', examplesNlLocale);

export default examplesNlLocale;
//</umd>

LocaleManager.extendLocale('Nl', examplesNlLocale);
