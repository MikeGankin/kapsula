export function createMinimalFormConfig() {
  return {
    defaultCapsule: "first",
    capsules: {
      first: {
        title: "Первая капсула",
        subtitle: "Первое описание",
        submitLabel: "Подобрать первую",
        imageSrc: "/first.jpg",
        imageMobileSrc: "/first-mobile.jpg",
        imageAlt: "Первая капсула",
        sections: [
          {
            id: "style",
            type: "cards",
            title: "Стиль",
            render: true,
            required: true,
            expanded: true,
            options: [
              {value: "calm", label: "Спокойный", overlayImageSrc: "/calm.png"},
              {value: "bright", label: "Яркий"},
            ],
          },
          {
            id: "details",
            type: "cards",
            title: "Детали",
            render: true,
            multiple: true,
            options: [
              {value: "hat", label: "Шляпа", visibleWhen: {style: {includes: ["calm"]}}},
              {value: "bag", label: "Сумка"},
            ],
          },
          {
            id: "comment",
            type: "textarea",
            title: "Комментарий",
            subtitle: "Пожелания",
            placeholder: "Расскажите подробнее",
            render: true,
          },
        ],
      },
      second: {
        title: "Вторая капсула",
        subtitle: "Второе описание",
        submitLabel: "Подобрать вторую",
        imageSrc: "/second.jpg",
        imageAlt: "Вторая капсула",
        sections: [
          {
            id: "mood",
            type: "cards",
            title: "Настроение",
            render: true,
            required: true,
            options: [{value: "sea", label: "Море"}],
          },
        ],
      },
    },
  };
}

export function createAllRendererForm() {
  return {
    title: "Все поля",
    subtitle: "Контракт renderer",
    submitLabel: "Отправить",
    imageSrc: "/all.jpg",
    imageAlt: "Все поля",
    sections: [
      {
        id: "single",
        type: "cards",
        title: "Один вариант",
        subtitle: "Выберите один",
        render: true,
        required: true,
        options: [
          {value: "one", label: "Первый"},
          {value: "hidden", label: "Скрытый", hiddenWhen: {single: {includes: ["one"]}}},
        ],
      },
      {
        id: "multiple",
        type: "cards",
        title: "Несколько вариантов",
        render: true,
        multiple: true,
        options: [
          {value: "alpha", label: "Альфа"},
          {value: "beta", label: "Бета", visibleWhen: {single: {includes: ["one"]}}},
        ],
      },
      {
        id: "notes",
        type: "textarea",
        title: "Комментарий",
        subtitle: "Дополнительные пожелания",
        placeholder: "Введите текст",
        render: true,
      },
      {
        id: "query",
        type: "text",
        title: "Поиск",
        subtitle: "По названию",
        placeholder: "Введите запрос",
        render: true,
        options: [],
      },
      {
        id: "dates",
        type: "calendar",
        title: "Даты",
        render: true,
        calendar: {mode: "range"},
      },
    ],
  };
}
