const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
// define el puerto
// - si existe PORT por ejemplo en hosting se usa, si no, usa 3000

const DB_PATH = path.join(__dirname, "mensajes.json");
const TEMPLATE_PATH = path.join(__dirname, "public", "index.html");

app.use(express.urlencoded({ extended: true }));
// middleware convierte los datos del formulario (x-www-form-urlencoded) en req.body
// sin esto req.body llegaria vacio
app.use(express.static(path.join(__dirname, "public"), { index: false }));

function escapeHtml(str) {   // funcion de seguridad. convierte caracteres especiales que cambien el html o js
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function leerMensajes() {    // lee el archivo mensajes.json y lo transforma a un array de js
  try {
    const contenido = fs.readFileSync(DB_PATH, "utf-8"); //lee el archivo en sincrono y devuelve un string
    const data = JSON.parse(contenido); //convierte el string en un array u objetojs
    return Array.isArray(data) ? data : []; //si lee un array lo devuelve, de lo contrario devuelve []
  } catch (err) {
    // Si no existe o está corrupto, devolvemos arreglo vacío
    return [];
  }
}

function guardarMensajes(mensajes) {
  fs.writeFileSync(DB_PATH, JSON.stringify(mensajes, null, 2), "utf-8");
} //recibe el array y lo guarda en mensajes.json sobre escribiendo el archivo

app.get("/", (req, res) => {
  const mensajes = leerMensajes(); // trae los mensajes guardados del archivo

  const listaHtml =
    mensajes.length === 0
      ? `<p>Aún no hay mensajes. ¡Sé el primero! 🙂</p>`
      : `<ul class="lista-mensajes">
          ${mensajes
            .map((m) => {  // map recorre el array y transforma cada mensaje en html
              const usuario = escapeHtml(m.usuario);
              const mensaje = escapeHtml(m.mensaje);
              const fechaIso = m.fecha ? escapeHtml(m.fecha) : "";
              return `
                <li class="mensaje">
                  <strong>${usuario}</strong>: ${mensaje}
                  ${fechaIso ? `<time class="meta js-fecha" datetime="${fechaIso}"></time>` : ""}
                </li>`;
            })  // devuelve el html de 1 mensaje (li)
            .join("")}
        </ul>`; // join une todos los <li> en un solo string

  const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");
  const htmlFinal = template.replace("<!-- MENSAJES_AQUI -->", listaHtml);  // Reemplaza el comentario por la lista real de mensajes

  res.send(htmlFinal); // Envía el html final al navegador
});

app.post("/nuevo-mensaje", (req, res) => { // ruta que recibe el formulario cuando aprietas al enviar
  const usuario = (req.body.usuario || "").trim();
  const mensaje = (req.body.mensaje || "").trim(); //validacion para que no ingresen espacios

  if (!usuario || !mensaje) {
    return res.redirect("/?error=1");
  }

  const mensajes = leerMensajes();

  mensajes.push({  // agrega un nuevo objeto al final del array
    usuario,
    mensaje,
    fecha: new Date().toISOString(), //// guarda fecha en formato ISO 
  });

  guardarMensajes(mensajes); //re escribe el mensajes.json con el array actualizado

  res.redirect("/");
});  //vuelve a la página principal para que se vea el mensaje nuevo

app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
});