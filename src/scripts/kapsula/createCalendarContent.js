import flatpickr from "flatpickr";
import {Russian} from "flatpickr/dist/l10n/ru.js";
import {logWarning} from "./logger.js";
import {setFieldValue} from "../../modules/form-configurator/core/state.ts";

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
  value,
  values,
  updateState
) {
  const wrapper = document.createElement('div');

  wrapper.className = 'calendar-field';

  if (typeof updateState !== 'function') {
    logWarning("Calendar updateState is missing");
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

      updateState((state) => setFieldValue(state, section.id, calendarValue));
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

export function createCalendarContentHandle(section, value, values, updateState) {
  const wrapper = document.createElement('div');
  wrapper.className = 'calendar-field';

  if (typeof updateState !== 'function') {
    logWarning("Calendar updateState is missing");
    return {node: wrapper, sync() {}, destroy() {}};
  }

  const input = document.createElement('input');
  input.type = 'hidden';
  input.style.display = 'none';
  input.dataset.field = section.id;
  wrapper.appendChild(input);

  const formatDate = (date) => date ? date.toISOString().split('T')[0] : '';
  const instance = flatpickr(input, {
    inline: true,
    mode: section.calendar?.mode || 'single',
    locale: Russian,
    minDate: section.calendar?.minDate,
    defaultDate: normalizeCalendarValue(value),
    onChange(selectedDates) {
      updateState((state) => setFieldValue(state, section.id, {
        from: formatDate(selectedDates[0]),
        to: formatDate(selectedDates[1]),
      }));
    },
    onDayCreate(_, __, ___, dayElem) {
      if (dayElem.dateObj?.getDate() === 12) dayElem.classList.add('is-flexible');
    },
  });
  let destroyed = false;

  return {
    node: wrapper,
    sync() {},
    destroy() {
      if (destroyed) return;
      destroyed = true;
      instance.destroy();
    },
  };
}
