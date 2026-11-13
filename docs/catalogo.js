const facets = {
  tipos: 'Tipo', areas: 'Área', asignaturas: 'Asignatura', finalidad: 'Finalidad',
  idiomas: 'Idioma', acceso: 'Acceso', licencia: 'Licencia', nivel: 'Nivel', formatos: 'Formato',
};
const search = document.querySelector('#search');
const sort = document.querySelector('#sort');
const filters = document.querySelector('#filters');
const active = document.querySelector('#active');
const cards = document.querySelector('#cards');
const status = document.querySelector('#status');
const collator = new Intl.Collator('es');
const normalize = text => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const values = value => Array.isArray(value) ? value : value ? [value] : [];

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function renderCard(resource, opened) {
  const card = element('article');
  card.id = resource.id;
  const types = values(resource.tipos);
  const symbol = types.includes('Juegos') ? '🎲' : types.includes('Libro de texto') ? '📖' : types.includes('Curso') ? '🎓' : '📄';
  const thumbnail = element('span', symbol, 'resource-thumbnail');
  thumbnail.setAttribute('aria-hidden', 'true');
  const overview = element('div', '', 'resource-overview');
  const copy = element('div');
  const title = element('a', resource.titulo);
  title.href = '#' + resource.id;
  const heading = element('h3');
  heading.append(title);
  copy.append(heading, element('p', resource.descripcion));
  const chips = element('div', '', 'chips');
  for (const key of ['tipos', 'areas', 'acceso']) {
    for (const value of values(resource[key])) {
      chips.append(element('span', value, 'chip chip--' + key));
    }
  }
  copy.append(chips);
  overview.append(thumbnail, copy);
  card.append(overview);

  const detail = element('details');
  detail.open = opened || location.hash === '#' + resource.id;
  const fields = element('dl');
  const labels = {
    autor: 'Autoría', propuesto_por: 'Propuesto por', asignaturas: 'Asignaturas', conceptos: 'Conceptos', finalidad: 'Finalidad',
    idiomas: 'Idioma', nivel: 'Nivel', formatos: 'Formato', condiciones_acceso: 'Condiciones de acceso',
    registro: 'Registro', coste: 'Coste', licencia: 'Licencia', permisos: 'Reutilización',
    contacto_publico: 'Contacto autorizado', fecha_revision: 'Última revisión',
  };
  for (const [key, label] of Object.entries(labels)) {
    const value = values(resource[key]).join(', ');
    if (!value) continue;
    const description = element('dd', value);
    if (key === 'licencia' && resource.licencia_url) {
      const link = element('a', value);
      link.href = resource.licencia_url;
      description.replaceChildren(link);
    }
    fields.append(element('dt', label), description);
  }
  detail.append(element('summary', 'Ver ficha'), fields);
  card.append(detail);
  if (resource.url_publica) {
    const link = element('a', resource.acceso === 'Público' ? 'Abrir recurso' : 'Consultar información', 'resource-link');
    link.href = resource.url_publica;
    card.append(link);
  }
  return card;
}

function start(resources) {
  const indexed = resources.map(resource => ({
    resource,
    title: normalize(resource.titulo),
    text: normalize([resource.titulo, resource.descripcion, resource.autor,
      ...values(resource.conceptos), ...values(resource.asignaturas), ...values(resource.areas),
      ...values(resource.tipos), resource.condiciones_acceso, resource.acceso,
    ].join(' ')),
  }));
  const controls = {};
  for (const [key, label] of Object.entries(facets)) {
    const options = [...new Set(resources.flatMap(resource => values(resource[key])))].sort(collator.compare);
    if (!options.length) continue;
    const group = element('details');
    group.open = key === 'tipos' || key === 'areas';
    group.append(element('summary', label));
    controls[key] = options.map(option => {
      const row = element('label');
      const input = element('input');
      input.type = 'checkbox';
      input.value = option;
      row.append(input, document.createTextNode(option));
      group.append(row);
      return input;
    });
    filters.append(group);
  }

  function render() {
    const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    const selected = Object.entries(controls).map(([key, inputs]) => [key, inputs.filter(input => input.checked)]);
    active.replaceChildren();
    for (const [key, inputs] of selected) {
      for (const input of inputs) {
        const chip = element('button', input.value + ' ×', 'chip chip--' + key);
        chip.type = 'button';
        chip.setAttribute('aria-label', 'Quitar filtro de ' + facets[key].toLowerCase() + ': ' + input.value);
        chip.addEventListener('click', () => {
          input.checked = false;
          render();
          search.focus();
        });
        active.append(chip);
      }
    }
    const result = indexed.filter(({ resource, text }) =>
      terms.every(term => text.includes(term)) &&
      selected.every(([key, inputs]) => !inputs.length || inputs.some(input => values(resource[key]).includes(input.value))),
    );
    const score = item => terms.filter(term => item.title.includes(term)).length;
    result.sort((left, right) => {
      const byTitle = collator.compare(left.resource.titulo, right.resource.titulo);
      if (sort.value === 'updated') return right.resource.fecha_revision.localeCompare(left.resource.fecha_revision) || byTitle;
      if (sort.value === 'title') return byTitle;
      return score(right) - score(left) || byTitle;
    });
    const openIds = new Set([...cards.querySelectorAll('article:has(details[open])')].map(card => card.id));
    cards.replaceChildren(...result.map(({ resource }) => renderCard(resource, openIds.has(resource.id))));
    status.textContent = result.length ? result.length + ' de ' + resources.length + ' recursos' : 'No hay recursos que coincidan con la búsqueda.';
  }

  function openHash() {
    const card = document.getElementById(location.hash.slice(1));
    if (card?.matches('article')) {
      card.querySelector('details').open = true;
      card.scrollIntoView();
    }
  }

  search.addEventListener('input', render);
  filters.addEventListener('change', render);
  sort.addEventListener('change', render);
  document.querySelector('#clear').addEventListener('click', () => {
    search.value = '';
    for (const input of filters.querySelectorAll('input')) input.checked = false;
    render();
  });
  window.addEventListener('hashchange', openHash);
  render();
  openHash();
}

fetch('recursos.json')
  .then(response => {
    if (!response.ok) throw new Error('Error al cargar el catálogo');
    return response.json();
  })
  .then(start)
  .catch(() => { status.textContent = 'No se pudo cargar el catálogo. Vuelve a intentarlo recargando la página.'; });
