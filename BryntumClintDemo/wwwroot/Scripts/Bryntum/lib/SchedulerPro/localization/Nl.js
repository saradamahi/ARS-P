import LocaleManager from '../../Core/localization/LocaleManager.js';
//<umd>
import parentLocale from '../../Scheduler/localization/Nl.js';
import LocaleHelper from '../../Core/localization/LocaleHelper.js';

const
    locale = LocaleHelper.mergeLocales(parentLocale, {

        ConstraintTypePicker : {
            none                : 'Geen',
            muststarton         : 'Niet eerder eindigen dan',
            mustfinishon        : 'Niet later eindigen dan',
            startnoearlierthan  : 'Moet beginnen op',
            startnolaterthan    : 'Moet eindigen op',
            finishnoearlierthan : 'Niet eerder beginnen dan',
            finishnolaterthan   : 'Niet later beginnen dan'
        },

        CalendarField : {
            'Default calendar' : 'Standaardkalender'
        },

        TaskEditorBase : {
            Information   : 'Informatie',
            Save          : 'Opslaan',
            Cancel        : 'Annuleer',
            Delete        : 'Verwijder',
            calculateMask : 'Taken berekenen...',
            saveError     : 'Kan niet opslaan. Corrigeer eerst de fouten'
        },

        TaskEdit : {
            'Edit task'            : 'Bewerk taak',
            ConfirmDeletionTitle   : 'Bevestig verwijderen',
            ConfirmDeletionMessage : 'Weet u zeker dat u dit item wilt verwijderen?'
        },

        TaskEditor : {
            editorWidth : '55em'
        },

        SchedulerTaskEditor : {
            editorWidth : '30em'
        },

        SchedulerGeneralTab : {
            labelWidth   : '12em',
            General      : 'Algemeen',
            Name         : 'Naam',
            Resources    : 'Resources',
            '% complete' : '% compleet',
            Duration     : 'Duur',
            Start        : 'Begin',
            Finish       : 'Einde'
        },

        GeneralTab : {
            labelWidth   : '6em',
            General      : 'Algemeen',
            Name         : 'Naam',
            '% complete' : '% compleet',
            Duration     : 'Duur',
            Start        : 'Begin',
            Finish       : 'Einde',
            Effort       : 'Inspanning',
            Dates        : 'Datums'
        },

        SchedulerAdvancedTab : {
            labelWidth           : '10em',
            Advanced             : 'Geavanceerd',
            Calendar             : 'Kalender',
            'Manually scheduled' : 'Handmatig',
            'Constraint type'    : 'Beperkingstype',
            'Constraint date'    : 'Beperkingsdatum'
        },

        AdvancedTab : {
            labelWidth           : '12em',
            Advanced             : 'Geavanceerd',
            Calendar             : 'Kalender',
            'Scheduling mode'    : 'Taaktype',
            'Effort driven'      : 'Op inspanning',
            'Manually scheduled' : 'Handmatig',
            'Constraint type'    : 'Beperkingstype',
            'Constraint date'    : 'Beperkingsdatum',
            Constraint           : 'Beperking',
            Rollup               : 'Samenvouwen'
        },

        DependencyTab : {
            Predecessors      : 'Voorafgaande taken',
            Successors        : 'Opvolgende taken',
            ID                : 'ID',
            Name              : 'Naam',
            Type              : 'Type',
            Lag               : 'Vertraging',
            cyclicDependency  : 'Cyclische afhankelijkheid',
            invalidDependency : 'Ongeldige afhankelijkheid'
        },

        ResourcesTab : {
            unitsTpl  : ({ value }) => `${value}%`,
            Resources : 'Middelen',
            Resource  : 'Hulpbron',
            Units     : 'Eenheden'
        },

        NotesTab : {
            Notes : 'Notities'
        },

        SchedulingModePicker : {
            Normal           : 'Normaal',
            'Fixed Duration' : 'Vaste duur',
            'Fixed Units'    : 'Vaste eenheden',
            'Fixed Effort'   : 'Vast werk'
        },

        DurationColumn : {
            Duration : 'Duur'
        },

        ResourceHistogram : {
            barTipInRange : '<b>{resource}</b> {startDate} - {endDate}<br>{allocated} van de {available} toegewezen',
            barTipOnDate  : '<b>{resource}</b> op {startDate}<br>{allocated} van de {available} toegewezen'
        }

    });

export default locale;
//</umd>

LocaleManager.registerLocale('Nl', { desc : 'Nederlands', locale : locale });
