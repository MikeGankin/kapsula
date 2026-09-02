import flatpickr from "flatpickr";
import {Russian} from "flatpickr/dist/l10n/ru.js";

function normalizeCalendarValue(value) {
  if (!value) {
    return null;
  }


  if (typeof value === 'object' && value.from) {
    return [
      value.from,
      value.to,
    ].filter(Boolean);
  }


  return value;
}

export function createCalendarContent(
  section,
  value = '',
  values,
  updateState
) {
  const wrapper = document.createElement('div');

  wrapper.className = 'calendar-field';

  if (typeof updateState !== 'function') {
    console.warn('[calendar] updateState is missing');
    return wrapper;
  }

  const input = document.createElement('input');

  input.type = 'hidden';
  input.style.display = 'none';
  input.dataset.field = section.id;

  wrapper.appendChild(input);


  const formatDate = (date) => {
    if (!date) {
      return '';
    }

    return date.toISOString().split('T')[0];
  };


  flatpickr(input, {
    inline: true,

    mode: section.calendar?.mode || 'single',

    locale: Russian,

    minDate: section.calendar?.minDate,

    defaultDate: normalizeCalendarValue(value),


    onChange(selectedDates) {

      const calendarValue = {
        from: formatDate(selectedDates[0]),
        to: formatDate(selectedDates[1]),
      };


      console.log('[calendar value]', calendarValue);


      updateState((state) => ({
        ...state,
        values: {
          ...state.values,
          [section.id]: calendarValue,
        },
        touchedSections: {
          ...state.touchedSections,
          [section.id]: true,
        },
      }));
    },


    onDayCreate(_, __, ___, dayElem) {

      const date = dayElem.dateObj;

      if (!date) {
        return;
      }


      if (date.getDate() === 12) {
        dayElem.classList.add('is-flexible');
      }
    },

  });


  return wrapper;
}
