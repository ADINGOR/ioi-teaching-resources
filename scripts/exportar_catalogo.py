"""Convierte el CSV editorial de Excel en los metadatos públicos de Pages."""

import argparse
import csv
from datetime import date
import json
from pathlib import Path
import re
from urllib.parse import urlsplit


MULTIPLE = ("tipos", "areas", "conceptos", "asignaturas", "finalidad", "idiomas", "formatos")
PUBLIC = (
    "id", "titulo", "descripcion", "autor", *MULTIPLE, "nivel", "acceso",
    "condiciones_acceso", "registro", "coste", "url_publica", "contacto_publico",
    "licencia", "licencia_url", "permisos", "fecha_revision",
)
REQUIRED = (
    "id", "titulo", "descripcion", "autor", "tipos", "acceso",
    "condiciones_acceso", "licencia", "fecha_revision",
)


def export_catalog(source):
    records = []
    identifiers = set()
    with source.open(encoding="utf-8-sig", newline="") as stream:
        header = stream.readline()
        delimiter = ";" if header.count(";") > header.count(",") else ","
        stream.seek(0)
        reader = csv.DictReader(stream, delimiter=delimiter)
        missing = set((*REQUIRED, "estado")) - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"Faltan columnas: {', '.join(sorted(missing))}")
        for row in reader:
            if (row["estado"] or "").strip().casefold() != "aprobado":
                continue
            try:
                record = {key: (row.get(key) or "").strip() for key in PUBLIC}
                proposer = (row.get("propuesto_por") or "").strip()
                consent = (row.get("autoriza_atribucion") or "").strip().casefold()
                if proposer and consent == "sí" and "@" not in proposer:
                    record["propuesto_por"] = proposer
                if not all(record[key] for key in REQUIRED):
                    raise ValueError("faltan campos obligatorios")
                slug = record["id"]
                if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug) or slug in identifiers:
                    raise ValueError("identificador inválido o repetido")
                if record["acceso"] not in {"Público", "Restringido", "Bajo solicitud"}:
                    raise ValueError("modalidad de acceso inválida")
                if not (record["url_publica"] or record["contacto_publico"]):
                    raise ValueError("falta enlace público o contacto autorizado")
                if record["acceso"] == "Público" and not record["url_publica"]:
                    raise ValueError("el acceso público requiere un enlace")
                for key in ("url_publica", "licencia_url"):
                    if record[key]:
                        url = urlsplit(record[key])
                        if url.scheme != "https" or not url.hostname or url.username:
                            raise ValueError(f"{key} debe ser una URL HTTPS pública")
                record["fecha_revision"] = date.fromisoformat(record["fecha_revision"]).isoformat()
                for key in MULTIPLE:
                    record[key] = list(dict.fromkeys(part.strip() for part in record[key].split("|") if part.strip()))
                if not record["tipos"]:
                    raise ValueError("falta al menos un tipo de recurso")
                identifiers.add(slug)
                records.append(record)
            except ValueError as error:
                raise ValueError(f"Fila {reader.line_num}: {error}") from error
    return records


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv", type=Path, help="CSV UTF-8 de la tabla editorial")
    args = parser.parse_args()
    try:
        resources = export_catalog(args.csv)
    except (OSError, ValueError) as error:
        parser.exit(1, f"{error}\n")
    output = Path(__file__).resolve().parents[1] / "docs" / "recursos.json"
    output.write_text(json.dumps(resources, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(resources)} fichas aprobadas exportadas a {output.name}")
