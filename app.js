const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DB_PATH = path.join(__dirname, "mensajes.json");
const TEMPLATE_PATH = path.join(__dirname, "public", "index.html");

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); // por si agregas assets luego

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function leerMensajes() {
  try {
    const contenido = fs.readFileSync(DB_PATH, "utf-8");
    const data = JSON.parse(contenido);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    // Si no existe o está corrupto, devolvemos arreglo vacío
    return [];
  }
}

function guardarMensajes(mensajes) {
  fs.writeFileSync(DB_PATH, JSON.stringify(mensajes, null, 2), "utf-8");
}

app.get("/", (req, res) => {
  const mensajes = leerMensajes();

  const listaHtml =
    mensajes.length === 0
      ? `<p>Aún no hay mensajes. ¡Sé el primero! 🙂</p>`
      : `<ul class="lista-mensajes">
          ${mensajes
            .map((m) => {
              const usuario = escapeHtml(m.usuario);
              const mensaje = escapeHtml(m.mensaje);
              const fecha = m.fecha ? new Date(m.fecha).toLocaleString() : "";
              return `
                <li class="mensaje">
                  <strong>${usuario}</strong>: ${mensaje}
                  ${fecha ? `<div class="meta">${escapeHtml(fecha)}</div>` : ""}
                </li>`;
            })
            .join("")}
        </ul>`;

  const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");
  const htmlFinal = template.replace("<!-- MENSAJES_AQUI -->", listaHtml);

  res.send(htmlFinal);
});

app.post("/nuevo-mensaje", (req, res) => {
  const usuario = (req.body.usuario || "").trim();
  const mensaje = (req.body.mensaje || "").trim();

  if (!usuario || !mensaje) {
    return res.redirect("/?error=1");
  }

  const mensajes = leerMensajes();

  mensajes.push({
    usuario,
    mensaje,
    fecha: new Date().toISOString(),
  });

  guardarMensajes(mensajes);

  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});