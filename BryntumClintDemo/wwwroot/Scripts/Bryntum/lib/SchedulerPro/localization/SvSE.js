import LocaleManager from '../../Core/localization/LocaleManager.js';
//<umd>
import parentLocale from '../../Scheduler/localization/SvSE.js';
import LocaleHelper from '../../Core/localization/LocaleHelper.js';

const
    locale = LocaleHelper.mergeLocales(parentLocale, {

        ConstraintTypePicker : {
            none                : 'Ingen',
            muststarton         : 'Måste starta',
            mustfinishon        : 'Måste avslutas',
            startnoearlierthan  : 'Starta tidigast',
            startnolaterthan    : 'Starta senast',
            finishnoearlierthan : 'Avsluta tidigast',
            finishnolaterthan   : 'Avsluta senast'
        },

        CalendarField : {
            'Default calendar' : 'Standardkalender'
        },

        TaskEditorBase : {
            Information   : 'Information',
            Save          : 'Spara',
            Cancel        : 'Avbryt',
            Delete        : 'Ta bort',
            calculateMask : 'Beräknar...',
            saveError     : 'Kan inte spara, vänligen korrigera fel först'
        },

        TaskEdit : {
            'Edit task'            : 'Redigera uppgift',
            ConfirmDeletionTitle   : 'Bekräfta borttagning',
            ConfirmDeletionMessage : 'Är du säker på att du vill ta bort händelsen?'
        },

        TaskEditor : {
            editorWidth : '45em'
        },

        SchedulerTaskEditor : {
            editorWidth : '33em'
        },

        SchedulerGeneralTab : {
            labelWidth   : '8em',
            General      : 'Allmänt',
            Name         : 'Namn',
            Resources    : 'Resurser',
            '% complete' : '% Färdig',
            Duration     : 'Varaktighet',
            Start        : 'Start',
            Finish       : 'Slut'
        },

        GeneralTab : {
            labelWidth   : '8em',
            General      : 'Allmänt',
            Name         : 'Namn',
            '% complete' : '% Färdig',
            Duration     : 'Varaktighet',
            Start        : 'Start',
            Finish       : 'Slut',
            Effort       : 'Arbetsinsats',
            Dates        : 'Datum'
        },

        SchedulerAdvancedTab : {
            labelWidth           : '11em',
            Advanced             : 'Avancerat',
            Calendar             : 'Kalender',
            'Manually scheduled' : 'Manuellt planerad',
            'Constraint type'    : 'Villkorstyp',
            'Constraint date'    : 'Måldatum'
        },

        AdvancedTab : {
            labelWidth           : '11em',
            Advanced             : 'Avancerat',
            Calendar             : 'Kalender',
            'Scheduling mode'    : 'Aktivitetstyp',
            'Effort driven'      : 'Insatsdriven',
            'Manually scheduled' : 'Manuellt planerad',
            'Constraint type'    : 'Villkorstyp',
            'Constraint date'    : 'Måldatum',
            Constraint           : 'Villkor',
            Rollup               : 'Upplyft'
        },

        DependencyTab : {
            Predecessors      : 'Föregångare',
            Successors        : 'Efterföljare',
            ID                : 'ID',
            Name              : 'Namn',
            Type              : 'Typ',
            Lag               : 'Fördröjning',
            cyclicDependency  : 'Cykliskt beroende',
            invalidDependency : 'Ogiltigt beroende'
        },

        ResourcesTab : {
            unitsTpl  : ({ value }) => `${value}%`,
            Resources : 'Resurser',
            Resource  : 'Resurs',
            Units     : 'Enheter'
        },

        NotesTab : {
            Notes : 'Anteckning'
        },

        SchedulingModePicker : {
            Normal           : 'Normal',
            'Fixed Duration' : 'Fast varaktighet',
            'Fixed Units'    : 'Fasta enheter',
            'Fixed Effort'   : 'Fast arbete'
        },

        ResourceHistogram : {
            barTipInRange : '<b>{resource}</b> {startDate} - {endDate}<br>{allocated} av {available} allokerade',
            barTipOnDate  : '<b>{resource}</b> på {startDate}<br>{allocated} av {available} allokerade'
        },

        DurationColumn : {
            Duration : 'Varaktighet'
        }
    });

export default locale;
//</umd>

LocaleManager.registerLocale('SvSE', { desc : 'Svenska', locale : locale });
