import LocaleManager from '../../../lib/Core/localization/LocaleManager.js';
//<umd>
import LocaleHelper from '../../../lib/Core/localization/LocaleHelper.js';
import Ru from '../../../lib/SchedulerPro/localization/Ru.js';
import SharedRu from './shared.locale.Ru.js';

const examplesRuLocale = LocaleHelper.mergeLocales(SharedRu, {

    extends : 'Ru',

    Column : {
        Capacity           : 'Вместительность',
        City               : 'Город',
        Company            : 'Компания',
        Duration           : 'Продолжительность',
        'Employment type'  : 'Тип занятости',
        End                : 'Конец',
        'First name'       : 'Имя',
        Id                 : '№',
        Machines           : 'Машины',
        Name               : 'Имя',
        'Nbr tasks'        : 'Кол-во задач',
        'Production line'  : 'Производственная линия',
        Rating             : 'Рейтинг',
        Role               : 'Роль',
        Score              : 'Счет',
        Staff              : 'Персонал',
        Start              : 'Начало',
        Surname            : 'Фамилия',
        'Task color'       : 'Цвет задачи',
        Type               : 'Тип',
        'Unassigned tasks' : 'Неназначенные задачи'
    }

});

LocaleHelper.publishLocale('Ru', Ru);
LocaleHelper.publishLocale('RuExamples', examplesRuLocale);

export default examplesRuLocale;
//</umd>

LocaleManager.extendLocale('Ru', examplesRuLocale);
