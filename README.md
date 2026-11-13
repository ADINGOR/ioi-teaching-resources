# Catálogo docente de ADINGOR

[Consultar el catálogo](https://adingor.github.io/ioi-teaching-resources/)

Catálogo colaborativo de recursos para la docencia en Ingeniería de Organización Industrial, mantenido por la Comisión de Coordinación Docente de ADINGOR. Cada ficha describe el recurso, cómo se accede a él y qué permisos de reutilización constan en la fuente.

## Proponer y revisar recursos

1. El profesorado envía un recurso propio o recomienda uno ajeno mediante el enlace **Proponer un recurso** de la web.
2. La comisión revisa la pertinencia, la autoría, el enlace y los permisos declarados en el Excel privado de recepción. Registra las fichas aprobadas en una tabla editorial con las columnas de [la tabla inicial](datos/catalogo-inicial.csv). El CSV puede abrirse en Excel e importarse como tabla.
3. Para publicar, exporta la tabla editorial como CSV UTF-8 y ejecuta `python scripts/exportar_catalogo.py RUTA_AL_CSV` desde el repositorio. Sube el JSON generado en `docs/recursos.json` a la rama principal. GitHub Pages publica desde `main` → `/docs`.

La tabla admite varios valores separados por `|` en los campos de tipo, área, conceptos, asignatura, finalidad, idioma y formato. Usa un identificador estable en `id`, una fecha de revisión en formato `AAAA-MM-DD` y `Aprobado` en `estado` para publicar una fila. Para una retirada, cambia el estado y vuelve a exportar.

Usa `Público`, `Restringido` o `Bajo solicitud` en `acceso`. En `url_publica` incluye solo un enlace que pueda difundirse, como la página informativa de un material restringido. En `contacto_publico` incluye solo el canal autorizado. Guarda los datos del proponente, enlaces privados y notas de revisión en la recepción privada. El exportador publica solo las columnas previstas y las filas aprobadas. Si la licencia está pendiente de confirmar, indícalo en la ficha.

La actualización desde Excel se ejecuta actualmente mediante exportación. La automatización de Forms y la sincronización con el Excel de la comisión quedan pendientes de configurar en Microsoft 365.

Para reconocer a quien propone el recurso, usa las columnas opcionales `propuesto_por` y `autoriza_atribucion`. Copia solo el nombre público indicado en el formulario y escribe `Sí` en la segunda columna cuando conste la autorización expresa. El exportador omite el nombre si falta esa autorización o si el campo contiene una dirección de correo.

## Desarrollo local

Ejecuta `python -m http.server 8000 --directory docs` y abre [localhost:8000](http://localhost:8000/). La búsqueda y los filtros se ejecutan en el navegador. Las fichas existentes conservan su dirección y los resultados de la portada se pueden enlazar mediante su identificador.

## Licencia

El código y la documentación del proyecto se distribuyen bajo la [licencia MIT](LICENSE). Los recursos catalogados se rigen por los permisos de sus titulares, recogidos en cada ficha.
